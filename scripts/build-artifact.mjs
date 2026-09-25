// Junta index.html + css + js num único ficheiro para publicar como artefacto Claude.
// Uso: node scripts/build-artifact.mjs  ->  dist/frotamz-artifact.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const r = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const html = r('index.html');
const head = html.split('<head>')[1].split('</head>')[0]
  .replace(/<meta[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="css\/styles.css">/, '');
const body = html.split('<body>')[1].split('</body>')[0]
  .replace(/<script src="js\/sample-data.js"><\/script>/, `<script>\n${r('js/sample-data.js')}</script>`)
  .replace(/<script src="js\/app.js"><\/script>/, `<script>\n${r('js/app.js')}</script>`);
const out = `${head.trim()}\n<style>\n${r('css/styles.css')}</style>\n${body.trim()}\n`;
mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist/frotamz-artifact.html', import.meta.url), out);
console.log('dist/frotamz-artifact.html criado (' + out.length + ' bytes)');
