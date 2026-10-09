"""Gera data/edicao.json a partir de data/transcricao.json e data/roteiro.json.

roteiro.json diz quais palavras ficam (intervalos de índices, inclusivos), as
correções de texto das legendas e os textos de gancho, chamada final e capa.
As pausas internas maiores que `pausaMax` (data/pausas.txt) são removidas.

Uso: python3 scripts/montar_edicao.py
"""
import json
import re
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent
dados = raiz / "data"
palavras = json.loads((dados / "transcricao.json").read_text())
roteiro = json.loads((dados / "roteiro.json").read_text())

FOLGA_INICIO, FOLGA_FIM = 0.08, 0.15
pausa_max = roteiro.get("pausaMax", 0.45)

valores = [float(v) for v in re.findall(r"[0-9.]+", (dados / "pausas.txt").read_text())]
silencios = list(zip(valores[0::2], valores[1::2]))

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
    # Tira as pausas longas de dentro do trecho, deixando um respiro curto.
    trechos = [[ini, fim]]
    for s_ini, s_fim in silencios:
        if s_fim - s_ini <= pausa_max:
            continue
        ultimo = trechos[-1]
        if ultimo[0] < s_ini and s_fim < ultimo[1]:
            trechos[-1] = [ultimo[0], s_ini + 0.12]
            trechos.append([s_fim - 0.10, ultimo[1]])
    cortes += [{"de": round(a, 3), "ate": round(b, 3)} for a, b in trechos if b - a > 0.15]
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
