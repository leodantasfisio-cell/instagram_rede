import {Config} from '@remotion/cli/config';
import {existsSync} from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setConcurrency(2);

// Nas sessões na nuvem o Chromium já vem instalado e o download do Remotion é bloqueado.
const chromiumLocal = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (existsSync(chromiumLocal)) Config.setBrowserExecutable(chromiumLocal);
