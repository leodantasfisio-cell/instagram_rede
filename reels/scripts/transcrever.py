"""Transcreve data/fonte.wav em português com tempo por palavra.

Saída: data/transcricao.json no formato [{"texto", "inicio", "fim"}], em segundos
do vídeo preparado. Precisa de: pip install faster-whisper (baixa o modelo do
huggingface.co na primeira vez).

Uso: python3 scripts/transcrever.py [modelo]   # padrão: medium
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

raiz = Path(__file__).resolve().parent.parent
modelo = sys.argv[1] if len(sys.argv) > 1 else "medium"

whisper = WhisperModel(modelo, device="cpu", compute_type="int8")
# Lê o WAV direto (mono, 16 kHz) para não depender da versão do PyAV.
with wave.open(str(raiz / "data" / "fonte.wav")) as w:
    audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768

segmentos, _ = whisper.transcribe(
    audio,
    language="pt",
    word_timestamps=True,
    vad_filter=True,
    condition_on_previous_text=False,
)

palavras = []
for seg in segmentos:
    for p in seg.words:
        texto = p.word.strip()
        if texto:
            palavras.append({"texto": texto, "inicio": round(p.start, 2), "fim": round(p.end, 2)})

saida = raiz / "data" / "transcricao.json"
saida.write_text(json.dumps(palavras, ensure_ascii=False, indent=1))
print(f"{len(palavras)} palavras em {saida}")
print(" ".join(p["texto"] for p in palavras))
