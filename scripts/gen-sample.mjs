// Regenera js/sample-data.js a partir de data/sample.json.
import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../data/sample.json', import.meta.url), 'utf8'));
writeFileSync(new URL('../js/sample-data.js', import.meta.url),
  '// Gerado a partir de data/sample.json (npm run sample). Dados de exemplo para o modo demonstração.\nwindow.SAMPLE = ' + JSON.stringify(data, null, 2) + ';\n');
console.log('js/sample-data.js atualizado');
