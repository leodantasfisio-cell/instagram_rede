# Reels da Rede Escoliose RN (Remotion)

Edição de Reels 9:16 com legendas sincronizadas, palavras-chave em azul,
gancho, tela final com chamada para o WhatsApp e capa.

## Passo a passo

1. **Preparar o vídeo bruto** (corta para 1080x1920, limpa e nivela o áudio):
   `scripts/preparar.sh caminho/video.MOV`
2. **Transcrever** (português, tempo por palavra; precisa de acesso a huggingface.co
   na primeira vez): `python3 scripts/transcrever.py`
3. **Montar o plano de edição** em `data/edicao.json`: os trechos que ficam
   (`cortes`, em segundos do vídeo preparado), a transcrição, as palavras-chave,
   o gancho, as imagens de apoio, a chamada final e a capa. Os tipos estão em
   `src/tipos.ts`.
4. **Conferir** no navegador: `npm run studio`
5. **Gerar**: `npm run render` (vídeo em `out/reel.mp4`) e `npm run capa`
   (capa em `out/capa.png`).

O `data/edicao.json` versionado é só um exemplo de teste.

## Regras

- Vídeos de pacientes ficam em `public/media/`, que não vai para o Git.
- Nenhuma radiografia ou medida é alterada; não há texto que prometa resultado.
- Música de fundo só com arquivo de uso livre fornecido pela equipe (`musica`).
- Fonte Montserrat (SIL Open Font License), em `public/fontes/`.
