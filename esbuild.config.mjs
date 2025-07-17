import path from 'path';
import fs from 'fs';
import * as esbuild from 'esbuild';
//import _package from './package.json' assert { type: "json" };



const distDir = './dist/huggingface/';
const _package = JSON.parse(fs.readFileSync('./package.json'))
const entryPoints = Object.keys(_package.dependencies).map(dep =>
  path.resolve('node_modules', dep)
);

esbuild.build({
  entryPoints,
  target: 'ES2021',
  bundle: true,
  minify: false,  // mantém o código legível
  format: 'cjs',
  outdir: distDir + 'lib',
  keepNames: true, // preserva nomes de variáveis/funções
  platform: 'node',
  external: ['fsevents', 'node:*'], // Evita que o esbuild tente resolver alguns imports problemáticos

  //sourcemap: true, 
  //splitting: true, 
}).then(() => {
    const files = [
        { src: './package.json', dest: distDir + 'package.json' },
        { src: './icon.png', dest: distDir + 'icon.png' },
    ];

    files.forEach(file => {
        fs.copyFile(path.resolve(file.src), path.resolve(file.dest), (err) => { 
           if (err) { console.error(err) }
        });
    });
});