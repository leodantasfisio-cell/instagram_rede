import type {Corte, Edicao, Palavra} from './tipos';

export type Trecho = Corte & {inicioNoReel: number};

// Coloca os cortes em sequência na linha do tempo do Reel.
export const montarTrechos = (cortes: Corte[]): Trecho[] => {
  let t = 0;
  return cortes.map((c) => {
    const trecho = {...c, inicioNoReel: t};
    t += c.ate - c.de;
    return trecho;
  });
};

export const duracaoFala = (cortes: Corte[]) =>
  cortes.reduce((s, c) => s + (c.ate - c.de), 0);

export const duracaoTotal = (e: Edicao) => duracaoFala(e.cortes) + e.cta.duracao;

// Converte as palavras do tempo original para o tempo do Reel.
// Palavras fora dos cortes são descartadas.
export const palavrasNoReel = (palavras: Palavra[], trechos: Trecho[]): Palavra[] => {
  const saida: Palavra[] = [];
  for (const p of palavras) {
    const meio = (p.inicio + p.fim) / 2;
    const t = trechos.find((c) => meio >= c.de && meio < c.ate);
    if (!t) continue;
    const desloc = t.inicioNoReel - t.de;
    saida.push({
      texto: p.texto,
      inicio: Math.max(p.inicio, t.de) + desloc,
      fim: Math.min(p.fim, t.ate) + desloc,
    });
  }
  return saida;
};

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

export const ehPalavraChave = (texto: string, chaves: string[]) => {
  const n = normalizar(texto);
  return n.length > 0 && chaves.some((c) => normalizar(c) === n);
};

// Agrupa as palavras em blocos curtos de legenda.
export const agruparLegendas = (palavras: Palavra[], maxPalavras = 4, maxPausa = 0.45) => {
  const grupos: Palavra[][] = [];
  let atual: Palavra[] = [];
  for (const p of palavras) {
    const anterior = atual[atual.length - 1];
    const quebra =
      atual.length >= maxPalavras ||
      (anterior && p.inicio - anterior.fim > maxPausa) ||
      (anterior && /[.!?]$/.test(anterior.texto));
    if (quebra && atual.length) {
      grupos.push(atual);
      atual = [];
    }
    atual.push(p);
  }
  if (atual.length) grupos.push(atual);
  return grupos;
};
