// Formato do plano de edição (data/edicao.json), gerado por scripts/montar_edicao.py.
// `cortes` usa segundos do vídeo original; todo o resto já está em segundos
// do Reel, com a velocidade aplicada.

export type Corte = {de: number; ate: number};

export type Palavra = {texto: string; inicio: number; fim: number};

export type Apoio = {
  arquivo: string; // caminho dentro de public/
  em: number;
  duracao: number;
  area: 'cheia' | 'baixo'; // tela inteira ou só a metade de baixo da tela dividida
};

export type Etapa = {numero: number; titulo: string; de: number; ate: number; tela?: string | null};

export type Escala = {
  titulo: string;
  de: number;
  ate: number;
  faixas: {graus: string; numero: string; texto: string; em: number}[];
};

// Trechos com a tela dividida: gráfico em cima, fala embaixo.
export type Tela = {
  tipo: 'escaneamento' | 'cobb' | 'escala';
  de: number;
  ate: number;
  titulo: string;
  numero?: number | null;
};

export type Edicao = {
  fps: number;
  fonte: string; // vídeo preparado, dentro de public/
  velocidade: number;
  cortes: Corte[];
  legendas: Palavra[];
  palavrasChave: string[];
  gancho: {texto: string; subtexto?: string; duracao: number} | null;
  apoio: Apoio[];
  cta: {titulo: string; subtitulo: string; duracao: number; resumo?: string[]};
  capa: {titulo: string; subtitulo?: string; frame: number};
  musica: {arquivo: string; volume: number} | null;
  etapas: Etapa[];
  escala: Escala | null;
  telas: Tela[];
  enfase: number[];
  transicoes: number[];
  efeitos: boolean;
  mostrarLegendas?: boolean;
};
