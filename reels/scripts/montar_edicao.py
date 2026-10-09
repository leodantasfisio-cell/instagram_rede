"""Gera data/edicao.json a partir de data/transcricao.json e data/roteiro.json.

roteiro.json diz quais palavras ficam (intervalos de índices, inclusivos), as
correções de texto das legendas e os textos de gancho, chamada final e capa.
As pausas internas maiores que `pausaMax` (data/pausas.txt) são removidas.

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


cortes = []
legendas = []
for de_i, ate_i in roteiro["manter"]:
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
    for a, b in trechos:
        if b - a <= 0.15:
            continue
        # Trechos que se encostam viram um só, sem repetir áudio.
        if cortes and a <= cortes[-1]["ate"] + 0.05:
            cortes[-1]["ate"] = round(max(b, cortes[-1]["ate"]), 3)
        else:
            cortes.append({"de": round(a, 3), "ate": round(b, 3)})
    legendas += [i for i in range(de_i, ate_i + 1)]

correcoes = {int(k): v for k, v in roteiro.get("correcoes", {}).items()}
transcricao = []
for i in legendas:
    p = dict(palavras[i])
    texto = correcoes.get(i, p["texto"])
    if texto == "":  # palavra juntada à anterior
        transcricao[-1]["fim"] = p["fim"]
        continue
    p["texto"] = texto
    transcricao.append(p)

edicao = {
    "fps": 30,
    "fonte": "media/fonte.mp4",
    "cortes": cortes,
    "transcricao": transcricao,
    "palavrasChave": roteiro["palavrasChave"],
    "gancho": roteiro["gancho"],
    "apoio": roteiro.get("apoio", []),
    "cta": roteiro["cta"],
    "capa": roteiro["capa"],
    "musica": roteiro.get("musica"),
}
(dados / "edicao.json").write_text(json.dumps(edicao, ensure_ascii=False, indent=1))
total = sum(c["ate"] - c["de"] for c in cortes)
print(f"{len(cortes)} cortes, fala {total:.1f} s + chamada {edicao['cta']['duracao']} s")
print(" ".join(p["texto"] for p in transcricao))
