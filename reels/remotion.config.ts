import {Config} from '@remotion/cli/config';
import {existsSync, readdirSync} from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setConcurrency(2);
Config.setChromiumOpenGlRenderer('angle');

// Nas sessões na nuvem o Chromium já vem instalado e o download do Remotion é bloqueado.
const candidatos = readdirSync('/opt/pw-browsers', {withFileTypes: true})
  .filter((d) => d.name.startsWith('chromium_headless_shell'))
  .flatMap((d) => ['chrome-linux', 'chrome-headless-shell-linux64'].map((s) => `/opt/pw-browsers/${d.name}/${s}/`))
  .flatMap((p) => [p + 'headless_shell', p + 'chrome-headless-shell']);
const chromiumLocal = existsSync('/opt/pw-browsers') ? candidatos.find((c) => existsSync(c)) : undefined;
if (chromiumLocal) Config.setBrowserExecutable(chromiumLocal);
