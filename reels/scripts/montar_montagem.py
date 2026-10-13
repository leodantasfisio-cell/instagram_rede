"""Gera a linha do tempo de um Reel montado a partir de vários clipes.

Uso: python3 scripts/montar_montagem.py projetos/<nome>
Lê <projeto>/roteiro.json e grava <projeto>/edicao.json com:
- video: trechos em sequência (arquivo, início no clipe, velocidade, volume)
- audio: narração colocada sobre as imagens
- textos: destaques e pílulas, com o tempo em que entram no Reel
"""
import json
import sys
from pathlib import Path

projeto = Path(sys.argv[1])
r = json.loads((projeto / "roteiro.json").read_text())
pasta = r["pasta"]
vf = r.get("velocidadeFala", 1.0)
arq = lambda nome: f"{pasta}/{nome}.mp4"

transcricoes = json.loads((projeto / "transcricoes.json").read_text()) if r.get("legendas") else {}
correcoes = r.get("correcoes", {})


def legendar(clipe, de, ate, vel, em):
    # Palavras ditas no trecho do clipe, no tempo do Reel.
    saida = []
    for p in transcricoes.get(r["clipes"].get(clipe, ""), []):
        meio = (p["inicio"] + p["fim"]) / 2
        if de <= meio < ate:
            saida.append({"texto": correcoes.get(p["texto"], p["texto"]),
                          "inicio": round(em + (max(p["inicio"], de) - de) / vel, 3),
                          "fim": round(em + (min(p["fim"], ate) - de) / vel, 3)})
    return saida


def no_reel(src, de, vel, em):
    return em + (src - de) / vel


video, audio, textos, blocos, legendas = [], [], [], [], []
t = 0.0
for b in r["blocos"]:
    inicio = t
    origem = None  # (clipe, de, ate, velocidade) do áudio do bloco
    if "fala" in b:
        f = b["fala"]
        dur = (f["ate"] - f["de"]) / vf
        origem = (f["arquivo"], f["de"], f["ate"], vf)
        video.append({"arquivo": arq(f["arquivo"]), "de": f["de"], "velocidade": vf, "em": t, "duracao": dur, "volume": 1})
    elif "voz" in b:
        v = b["voz"]
        dur = (v["ate"] - v["de"]) / vf
        origem = (v["arquivo"], v["de"], v["ate"], vf)
        audio.append({"arquivo": arq(v["arquivo"]), "de": v["de"], "velocidade": vf, "em": t, "duracao": dur})
        imgs = b["imagens"]
        parte = dur / len(imgs)
        for k, im in enumerate(imgs):
            video.append({"arquivo": arq(im["arquivo"]), "de": im["de"], "velocidade": b.get("velocidadeImagens", 1.0),
                          "em": t + k * parte, "duracao": parte, "volume": 0})
    else:
        a = b["ambiente"]
        vel = a.get("velocidade", 1.0)
        dur = (a["ate"] - a["de"]) / vel
        origem = (a["arquivo"], a["de"], a["ate"], vel)
        video.append({"arquivo": arq(a["arquivo"]), "de": a["de"], "velocidade": vel, "em": t, "duracao": dur,
                      "volume": a.get("volume", 1)})
    if "destaque" in b:
        textos.append({"tipo": "destaque", "em": inicio, "duracao": dur, **b["destaque"]})
    for k, p in enumerate(b.get("pilulas", [])):
        # Pílula com "em" (segundos do clipe) entra junto com a palavra; sem, entra escalonada.
        if isinstance(p, dict):
            em_p = no_reel(p["em"], origem[1], origem[3], inicio)
            texto = p["texto"]
        else:
            em_p, texto = inicio + 0.25 + k * 0.6, p
        textos.append({"tipo": "pilula", "em": round(em_p, 3), "duracao": round(inicio + dur - em_p, 3), "texto": texto, "ordem": k})
    if r.get("legendas") and b.get("legenda", True) and origem:
        legendas += legendar(origem[0], origem[1], origem[2], origem[3], inicio)
    blocos.append({"id": b["id"], "em": inicio, "duracao": dur, "painel": b.get("painel")})
    t += dur

edicao = {"fps": 30, "marca": r["marca"], "video": video, "audio": audio, "textos": textos,
          "blocos": blocos, "cta": r["cta"], "duracaoFala": round(t, 3),
          "legendas": legendas, "palavrasChave": r.get("palavrasChave", [])}
(projeto / "edicao.json").write_text(json.dumps(edicao, ensure_ascii=False, indent=1))
print(f"{len(blocos)} blocos, {len(video)} trechos de vídeo, {t:.1f} s + tela final {r['cta']['duracao']} s")
for b in blocos:
    print(f"  {b['em']:5.1f}s  {b['id']} ({b['duracao']:.1f}s)")
