"""Gera data/edicao.json a partir de data/transcricao.json e data/roteiro.json.

roteiro.json diz quais palavras ficam (intervalos de índices, inclusivos, na
ordem em que entram no Reel), as correções de texto das legendas, a
velocidade e os textos e marcações dos gráficos. As pausas internas maiores
que `pausaMax` (data/pausas.txt) são removidas.

Os tempos de cortes ficam em segundos do vídeo original; os demais (legendas,
gráficos, transições) já em segundos do Reel, com a velocidade aplicada.

Uso: python3 scripts/montar_edicao.py
"""
import json
import re
import wave
from pathlib import Path

import numpy as np

raiz = Path(__file__).resolve().parent.parent
dados = raiz / "data"
palavras = json.loads((dados / "transcricao.json").read_text())
roteiro = json.loads((dados / "roteiro.json").read_text())

FOLGA_INICIO, FOLGA_FIM = 0.08, 0.15
pausa_max = roteiro.get("pausaMax", 0.45)
velocidade = roteiro.get("velocidade", 1.0)

valores = [float(v) for v in re.findall(r"[0-9.]+", (dados / "pausas.txt").read_text())]
silencios = list(zip(valores[0::2], valores[1::2]))

with wave.open(str(dados / "fonte.wav")) as w:
    taxa = w.getframerate()
    audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def nivel(t, janela=0.03):
    trecho = audio[max(0, int(t * taxa)) : int((t + janela) * taxa)]
    return 20 * np.log10(np.sqrt((trecho**2).mean()) + 1e-9) if len(trecho) else -99


def recuar_ate_silencio(t, limite=0.3, silencio=-40, minimo=0.08):
    # Os tempos do Whisper às vezes começam depois da fala: recua até achar
    # um silêncio de pelo menos `minimo` segundos (ignora oclusivas, como o "c").
    recuo = 0.0
    while recuo < limite:
        janela = [nivel(t - recuo - k * 0.01) for k in range(int(minimo / 0.01))]
        if max(janela) <= silencio:
            break
        recuo += 0.01
    return t - recuo


def trechos_do_intervalo(de_i, ate_i):
    ini = palavras[de_i]["inicio"] - FOLGA_INICIO
    fim = palavras[ate_i]["fim"] + FOLGA_FIM
    # Não invade as palavras descartadas vizinhas.
    if de_i > 0:
        ini = max(ini, palavras[de_i - 1]["fim"] + 0.02)
    if ate_i + 1 < len(palavras):
        fim = min(fim, palavras[ate_i + 1]["inicio"] - 0.02)
    ini = recuar_ate_silencio(ini)
    # Tira as pausas longas de dentro do trecho, deixando um respiro curto.
    trechos = [[ini, fim]]
    for s_ini, s_fim in silencios:
        if s_fim - s_ini <= pausa_max:
            continue
        ultimo = trechos[-1]
        if ultimo[0] < s_ini and s_fim < ultimo[1]:
            trechos[-1] = [ultimo[0], s_ini + 0.12]
            trechos.append([s_fim - 0.10, ultimo[1]])
    return [t for t in trechos if t[1] - t[0] > 0.15]


cortes = []  # {"de", "ate"} no tempo original
posicoes = {}  # índice da palavra -> tempo no Reel (última ocorrência)
legendas = []
correcoes = {int(k): v for k, v in roteiro.get("correcoes", {}).items()}
inicios_intervalo = {}

for de_i, ate_i in roteiro["manter"]:
    mapa = []  # (de, ate, inicio no Reel em tempo original)
    for a, b in trechos_do_intervalo(de_i, ate_i):
        anterior = cortes[-1] if cortes else None
        # Continuação direta do corte anterior: emenda sem repetir áudio.
        if anterior and anterior["de"] <= a <= anterior["ate"] + 0.05:
            a = anterior["ate"]
            if b <= a:
                continue
            acumulado = sum(c["ate"] - c["de"] for c in cortes)
            anterior["ate"] = round(b, 3)
        else:
            acumulado = sum(c["ate"] - c["de"] for c in cortes)
            cortes.append({"de": round(a, 3), "ate": round(b, 3)})
        mapa.append((a, b, acumulado))

    def no_reel(t):
        for a, b, acc in mapa:
            if a - 0.05 <= t <= b + 0.05:
                return round((acc + min(max(t, a), b) - a) / velocidade, 3)
        return None

    inicios_intervalo[de_i] = no_reel(palavras[de_i]["inicio"]) or 0.0
    for i in range(de_i, ate_i + 1):
        p = palavras[i]
        ini, fim = no_reel(p["inicio"]), no_reel(p["fim"])
        if ini is None or fim is None:
            meio = no_reel((p["inicio"] + p["fim"]) / 2)
            if meio is None:
                continue
            ini, fim = ini or meio, fim or meio
        posicoes[i] = (ini, fim)
        texto = correcoes.get(i, p["texto"])
        if texto == "":  # palavra juntada à anterior
            legendas[-1]["fim"] = fim
            continue
        legendas.append({"texto": texto, "inicio": ini, "fim": fim})

inicio = lambda i: posicoes[i][0]
fim = lambda i: posicoes[i][1]
duracao_fala = sum(c["ate"] - c["de"] for c in cortes) / velocidade

etapas = [
    {"numero": e["numero"], "titulo": e["titulo"], "de": inicio(e["de"]), "ate": fim(e["ate"]), "tela": e.get("tela")}
    for e in roteiro.get("etapas", [])
]
escala = None
if roteiro.get("escala"):
    e = roteiro["escala"]
    escala = {
        "titulo": e["titulo"],
        "de": inicio(e["de"]),
        "ate": fim(e["ate"]) + 0.8,
        "faixas": [
            {"graus": f["graus"], "numero": f["numero"], "texto": f["texto"], "em": inicio(f["em"])}
            for f in e["faixas"]
        ],
    }

edicao = {
    "fps": 30,
    "fonte": roteiro.get("fonte", "media/fonte.mp4"),
    "velocidade": velocidade,
    "cortes": cortes,
    "legendas": legendas,
    "palavrasChave": roteiro["palavrasChave"],
    "gancho": roteiro["gancho"],
    "apoio": [
        {"arquivo": a["arquivo"], "em": inicio(a["palavra"]), "duracao": a["duracao"], "area": a.get("area", "cheia")}
        for a in roteiro.get("apoio", [])
    ],
    "telas": [
        {"tipo": t["tipo"], "de": inicio(t["de"]), "ate": fim(t["ate"]) + 0.3, "titulo": t["titulo"], "numero": t.get("numero")}
        for t in roteiro.get("telas", [])
    ],
    "cta": roteiro["cta"],
    "capa": roteiro["capa"],
    "musica": roteiro.get("musica"),
    "etapas": etapas,
    "escala": escala,
    "enfase": [inicio(i) for i in roteiro.get("enfase", [])],
    "transicoes": [inicios_intervalo[i] for i in roteiro.get("transicoes", [])],
    "efeitos": True,
}
(dados / "edicao.json").write_text(json.dumps(edicao, ensure_ascii=False, indent=1))
print(f"{len(cortes)} cortes, fala {duracao_fala:.1f} s + chamada {edicao['cta']['duracao']} s (velocidade {velocidade}x)")
print(" ".join(p["texto"] for p in legendas))
