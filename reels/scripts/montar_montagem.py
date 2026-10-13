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

video, audio, textos, blocos = [], [], [], []
t = 0.0
for b in r["blocos"]:
    inicio = t
    if "fala" in b:
        f = b["fala"]
        dur = (f["ate"] - f["de"]) / vf
        video.append({"arquivo": arq(f["arquivo"]), "de": f["de"], "velocidade": vf, "em": t, "duracao": dur, "volume": 1})
    elif "voz" in b:
        v = b["voz"]
        dur = (v["ate"] - v["de"]) / vf
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
        video.append({"arquivo": arq(a["arquivo"]), "de": a["de"], "velocidade": vel, "em": t, "duracao": dur,
                      "volume": a.get("volume", 1)})
    if "destaque" in b:
        textos.append({"tipo": "destaque", "em": inicio, "duracao": dur, **b["destaque"]})
    for k, p in enumerate(b.get("pilulas", [])):
        textos.append({"tipo": "pilula", "em": inicio + 0.25 + k * 0.6, "duracao": dur - 0.25 - k * 0.6, "texto": p, "ordem": k})
    blocos.append({"id": b["id"], "em": inicio, "duracao": dur, "painel": b.get("painel")})
    t += dur

edicao = {"fps": 30, "marca": r["marca"], "video": video, "audio": audio, "textos": textos,
          "blocos": blocos, "cta": r["cta"], "duracaoFala": round(t, 3)}
(projeto / "edicao.json").write_text(json.dumps(edicao, ensure_ascii=False, indent=1))
print(f"{len(blocos)} blocos, {len(video)} trechos de vídeo, {t:.1f} s + tela final {r['cta']['duracao']} s")
for b in blocos:
    print(f"  {b['em']:5.1f}s  {b['id']} ({b['duracao']:.1f}s)")
