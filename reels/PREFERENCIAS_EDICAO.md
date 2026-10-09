# Preferências de edição — Rede Escoliose RN

O que a equipe já escolheu nas edições. Vale para todo Reel novo, a menos que
peçam diferente. **Atualize este arquivo sempre que uma escolha nova for feita**
(o que mudou, em qual vídeo, e o motivo quando houver), com a mais recente
valendo sobre as anteriores.

Tom, público e o que nunca dizer: `instagram/voice.md`.

## Processo

- **Sempre mandar prévia para aprovação** antes da versão final: vídeo em meia
  resolução (`--scale=0.5`) mais uma folha de imagens dos momentos principais.
  Só gerar a versão final 1080×1920 depois do "aprovado".
- Antes de propor a edição, mostrar o roteiro de cortes e o que sai.
- Conferir o vídeo final transcrevendo o áudio (nenhuma palavra cortada no meio).

## Abertura e ritmo

- **Sem título/texto de gancho na abertura.** O gancho é a própria fala: abrir
  com 2–3 s da frase mais curiosa do vídeo (ex.: "1 mais 1 não é 2, é 11") e
  depois voltar ao início normal.
- Reels de **~75–85 s**: cortar repetições, frases de transição e explicações
  longas. Fala acelerada **1,1x**. Respiros entre frases curtos.
- Cortes secos dentro do assunto; nas viradas de assunto, clarão branco curto
  com "soco" de zoom e um whoosh discreto.

## Visual

- **Fundo original, sem desfoque** (a equipe não vê problema no mural de fotos).
- Identidade azul e branca, fonte Montserrat.
- Aprovado e mantido: cartões numerados das etapas (1, 2, 3), **tela dividida**
  quando há explicação visual (gráfico em cima, fala embaixo), coluna 3D girando
  no escaneamento, ilustração do ângulo de Cobb, escala das diretrizes com
  números em 3D, aproximação lenta da câmera e close nos momentos de ênfase,
  barra de progresso azul no topo.
- Ilustrações próprias levam a marca "Ilustração"; nunca alterar radiografias
  ou medidas reais.
- **Legendas: desligadas** (escolha mais recente, vídeo da avaliação, v3).
  Quando usadas, eram karaokê com palavras-chave em faixa azul.

## Imagens de apoio

- Fonte: Drive `MARKETING / GESTÃO DE CANAIS / MÍDIAS REDE ESCOLIOSE` (subpastas
  `COLETES 3D`, `DESTAQUES RESULTADOS`, `AGOSTO/26 midias`). Gerar imagem com IA
  só se não houver material real.
- Preferidos: escaneamento com tablet (`20260415_115948.mp4`), modelagem 3D do
  colete no software (`20260622_091611.mp4`), explicação do raio-X ao paciente,
  medição na radiografia, colocação e ajuste do colete.
- **Não usar a impressora 3D (Bambu Lab)** como imagem de apoio (removida na v3).
- Pacientes só de costas ou de lado, sem rosto, nome ou dado legível; confirmar
  autorização de imagem.

## Final

- Tela final **sem resumo das etapas**: só "Agende sua avaliação gratuita",
  botão "pelo WhatsApp" e @rede_escoliose_rn.
- Remover frases que soem como promessa (ex.: "evite a cirurgia"), mesmo que
  ditas no vídeo.

## Som

- Áudio da fala limpo e nivelado (-14 LUFS). Efeitos sonoros sintetizados e
  discretos (whoosh, pop). Sem música até a equipe mandar um arquivo de uso livre.

## Notas técnicas

- `ffmpeg`/`ffprobe` em URLs precisam de `http_proxy=$HTTPS_PROXY`.
- O Drive bloqueia downloads anônimos repetidos ("Quota exceeded") por até 24 h;
  baixar só os vídeos escolhidos, uma vez, e evitar varreduras completas.
  Copiar o arquivo no Drive não contorna o bloqueio.

## Histórico

- **2026-10-09 — `video_avaliacao_reels.MOV` (avaliação):** v1 com legendas e
  sem animações → pediram animações; v2 com 3D, tela dividida e imagens de
  apoio; v3 sem título de gancho, sem Bambu Lab, sem resumo final e sem
  legendas; desfoque do fundo testado e descartado.
