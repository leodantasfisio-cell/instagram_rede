"""Limpa o áudio dos clipes de um projeto e troca a trilha nos .mp4 de public/.

Para cada clipe: extrai o áudio do arquivo bruto, tira o ruído de fundo
(noisereduce, não estacionário), e aplica EQ de voz, compressão, de-esser e
nivelamento em -16 LUFS. Mais forte (>= 0,8) = fala, com gate mais firme. O vídeo não é recodificado.

Uso: python3 scripts/limpar_audio.py <pasta_brutos> <pasta_public> nome=ARQUIVO_BRUTO[:forca] ...
     forca de 0 a 1 (padrão 0.85); use menos em som ambiente para não "engolir" a cena.
"""
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import noisereduce as nr
import numpy as np

brutos, publico = Path(sys.argv[1]), Path(sys.argv[2])
TAXA = 48000
# O gate abaixa o fundo nas pausas; em som ambiente ele é mais leve (range maior).
CADEIA = (
    "highpass=f=90,lowpass=f=13000,"
    "equalizer=f=300:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=3,"
    "deesser=i=0.4,"
    "agate=threshold=0.015:ratio=4:range={range}:attack=5:release=150,"
    "acompressor=threshold=-20dB:ratio=2.5:attack=5:release=90,"
    "loudnorm=I=-16:TP=-1.5:LRA=9,aformat=channel_layouts=stereo"
)


def roda(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


for item in sys.argv[3:]:
    nome, resto = item.split("=")
    bruto, _, forca = resto.partition(":")
    forca = float(forca or 0.85)
    with tempfile.TemporaryDirectory() as tmp:
        cru, limpo, final = Path(tmp, "cru.wav"), Path(tmp, "limpo.wav"), Path(tmp, "final.wav")
        roda("-i", str(brutos / bruto), "-vn", "-ac", "1", "-ar", str(TAXA), str(cru))
        with wave.open(str(cru)) as w:
            sinal = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        reduzido = nr.reduce_noise(y=sinal, sr=TAXA, stationary=False, prop_decrease=forca, n_jobs=2)
        with wave.open(str(limpo), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(TAXA)
            w.writeframes((np.clip(reduzido, -1, 1) * 32767).astype(np.int16).tobytes())
        faixa = 0.08 if forca >= 0.8 else 0.3
        roda("-i", str(limpo), "-af", CADEIA.format(range=faixa), "-ar", str(TAXA), str(final))
        destino = publico / f"{nome}.mp4"
        novo = Path(tmp, "novo.mp4")
        roda("-i", str(destino), "-i", str(final), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
             "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(novo))
        novo.replace(destino)
    print(f"{nome}: ok (força {forca})", flush=True)
