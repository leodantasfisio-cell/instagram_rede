#!/usr/bin/env bash
# Prepara o vídeo bruto para a edição:
#  - public/media/fonte.mp4: 1080x1920, 30 fps, H.264, áudio limpo e nivelado (-14 LUFS)
#  - data/fonte.wav: áudio mono 16 kHz para a transcrição
# Uso: scripts/preparar.sh caminho/do/video.MOV
set -euo pipefail
cd "$(dirname "$0")/.."
entrada="$1"
mkdir -p public/media data

# Filtro de áudio: corta graves de fundo, reduz ruído e nivela o volume.
audio="highpass=f=80,afftdn=nf=-25,loudnorm=I=-14:TP=-1.5:LRA=11"
# Preenche 9:16 cortando as sobras (vídeo deitado vira recorte central).
video="scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p"

ffmpeg -hide_banner -loglevel warning -stats -y -i "$entrada" \
  -vf "$video" -af "$audio" \
  -c:v libx264 -preset medium -crf 18 -g 30 -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 \
  public/media/fonte.mp4

ffmpeg -hide_banner -loglevel warning -y -i public/media/fonte.mp4 -vn -ac 1 -ar 16000 data/fonte.wav

# Pausas maiores que 0,4 s, para guiar os cortes.
ffmpeg -hide_banner -nostats -i data/fonte.wav -af silencedetect=noise=-35dB:d=0.4 -f null - 2>&1 \
  | grep -oE "silence_(start|end): [0-9.]+" > data/pausas.txt || true

echo "Pronto: public/media/fonte.mp4, data/fonte.wav, data/pausas.txt"
