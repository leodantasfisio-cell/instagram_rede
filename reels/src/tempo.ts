import {Easing, interpolate} from 'remotion';
import type {Corte, Edicao, Palavra, Tela} from './tipos';

export type Trecho = Corte & {inicioNoReel: number; duracaoNoReel: number};

// Coloca os cortes em sequência na linha do tempo do Reel.
export const montarTrechos = (cortes: Corte[], velocidade = 1): Trecho[] => {
  let t = 0;
  return cortes.map((c) => {
    const duracaoNoReel = (c.ate - c.de) / velocidade;
    const trecho = {...c, inicioNoReel: t, duracaoNoReel};
    t += duracaoNoReel;
    return trecho;
  });
};

export const duracaoFala = (e: Edicao) =>
  e.cortes.reduce((s, c) => s + (c.ate - c.de), 0) / (e.velocidade || 1);

export const duracaoTotal = (e: Edicao) => duracaoFala(e) + e.cta.duracao;

// 0 = tela cheia, 1 = tela dividida; com transição suave nas pontas.
export const divisao = (telas: Tela[], t: number, transicao = 0.35) => {
  let v = 0;
  for (const tela of telas) {
    v = Math.max(
      v,
      interpolate(t, [tela.de - transicao, tela.de, tela.ate, tela.ate + transicao], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      }),
    );
  }
  return v;
};

export const telaAtual = (telas: Tela[], t: number, transicao = 0.35) =>
  telas.find((tela) => t >= tela.de - transicao && t < tela.ate + transicao) ?? null;

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
