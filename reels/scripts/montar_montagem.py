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


video, audio, textos, blocos, legendas, impactos = [], [], [], [], [], []
# Trilha de etapas (opcional): marcos = quando cada passo acende; mapa = tela com o caminho todo.
trilha = {"passos": r["trilha"]["passos"], "marcos": [], "mapa": None, "gancho": None} if "trilha" in r else None
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
        # Imagens com "duracao" fixa; o resto do tempo é dividido igualmente entre as outras.
        imgs = b["imagens"]
        fixo = sum(im.get("duracao", 0) for im in imgs)
        livres = [im for im in imgs if "duracao" not in im]
        parte = (dur - fixo) / len(livres) if livres else 0
        cursor = t
        for im in imgs:
            d = im.get("duracao", parte)
            video.append({"arquivo": arq(im["arquivo"]), "de": im["de"],
                          "velocidade": im.get("velocidade", b.get("velocidadeImagens", 1.0)),
                          "em": cursor, "duracao": d, "volume": 0, "congelar": im.get("congelar", False)})
            cursor += d
    elif "trechos" in b["ambiente"]:
        # Vários cortes com velocidades diferentes (câmera lenta, aceleração).
        a = b["ambiente"]
        cursor = t
        for tr in a["trechos"]:
            vel = tr.get("velocidade", 1.0)
            d = (tr["ate"] - tr["de"]) / vel
            video.append({"arquivo": arq(tr["arquivo"]), "de": tr["de"], "velocidade": vel, "em": cursor,
                          "duracao": d, "volume": a.get("volume", 1)})
            cursor += d
        dur = cursor - t
    else:
        a = b["ambiente"]
        vel = a.get("velocidade", 1.0)
        dur = (a["ate"] - a["de"]) / vel
        origem = (a["arquivo"], a["de"], a["ate"], vel)
        video.append({"arquivo": arq(a["arquivo"]), "de": a["de"], "velocidade": vel, "em": t, "duracao": dur,
                      "volume": a.get("volume", 1)})
    if trilha is not None and origem:
        no = lambda src: round(no_reel(src, origem[1], origem[3], inicio), 3)
        for m in b.get("marcos", []):
            trilha["marcos"].append({"passo": m["passo"], "em": no(m["em"])})
        if "mapa" in b:
            mp = b["mapa"]
            trilha["mapa"] = {"em": no(mp["de"]), "duracao": round(no(mp["ate"]) - no(mp["de"]), 3),
                              "antes": round(no(mp["antes"]) - no(mp["de"]), 3), "foco": round(no(mp["foco"]) - no(mp["de"]), 3)}
        if "gancho" in b:
            g = b["gancho"]
            trilha["gancho"] = {"linha1": g["linha1"], "linha2": g["linha2"], "em": no(g["em"]),
                                "em2": round(no(g["em2"]) - no(g["em"]), 3), "duracao": round(no(g["ate"]) - no(g["em"]), 3)}
        for k, ic in enumerate(b.get("icones", [])):
            em_i = no(ic["em"])
            textos.append({"tipo": "icone", "em": em_i, "duracao": round(inicio + dur - em_i, 3), "texto": ic["texto"],
                           "icone": ic["tipo"], "ordem": k})
    if "destaque" in b:
        atraso = b["destaque"].get("atraso", 0)
        textos.append({"tipo": "destaque", "em": inicio + atraso, "duracao": dur - atraso, **b["destaque"]})
    if "impacto" in b:
        impactos.append(round(inicio + b["impacto"], 3))
    for k, sx in enumerate(b.get("setas", [])):
        em_s = no_reel(sx["em"], origem[1], origem[3], inicio)
        textos.append({"tipo": "seta", "em": round(em_s, 3), "duracao": round(inicio + dur - em_s, 3), "texto": sx["texto"],
                       "x": sx["x"], "y": sx["y"], "rotulo": sx["rotulo"], "ordem": k})
    for k, p in enumerate(b.get("pilulas", [])):
        # Pílula com "em" (segundos do clipe) entra junto com a palavra; sem, entra escalonada.
        if isinstance(p, dict) and "emBloco" in p:
            em_p, texto = inicio + p["emBloco"], p["texto"]
        elif isinstance(p, dict):
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
          "legendas": legendas, "palavrasChave": r.get("palavrasChave", []), "impactos": impactos, "trilha": trilha}
(projeto / "edicao.json").write_text(json.dumps(edicao, ensure_ascii=False, indent=1))
print(f"{len(blocos)} blocos, {len(video)} trechos de vídeo, {t:.1f} s + tela final {r['cta']['duracao']} s")
for b in blocos:
    print(f"  {b['em']:5.1f}s  {b['id']} ({b['duracao']:.1f}s)")
