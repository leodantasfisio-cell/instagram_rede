// Formato do plano de edição (data/edicao.json).
// Todos os tempos em segundos. `cortes` e `transcricao` usam o tempo do vídeo
// original; `apoio` e `capa.frame` usam o tempo do Reel já editado.

export type Corte = {de: number; ate: number};

export type Palavra = {texto: string; inicio: number; fim: number};

export type Apoio = {
  arquivo: string; // caminho dentro de public/
  em: number; // quando entra no Reel
  duracao: number;
  inicioNoArquivo?: number;
};

export type Edicao = {
  fps: number;
  fonte: string; // vídeo preparado, dentro de public/
  cortes: Corte[];
  transcricao: Palavra[];
  palavrasChave: string[];
  gancho: {texto: string; duracao: number};
  apoio: Apoio[];
  cta: {titulo: string; subtitulo: string; duracao: number};
  capa: {titulo: string; subtitulo?: string; frame: number};
  musica: {arquivo: string; volume: number} | null;
};
