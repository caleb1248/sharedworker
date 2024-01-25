// @ts-check

import { createServer } from 'node:http';
import { readFile, existsSync } from 'node:fs';
import path from 'path';
import chalk from 'chalk';

import ts from 'typescript';
const server = createServer((req, res) => {
  if (!req.url) throw 'req.url is undefined';
  /**@type {string} */
  const url = req.url.replace(/^\//, '');
  if (url === '') {
    readFile('index.html', (_err, data) => {
      res
        .writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        .write(data);
      res.end();
    });
  } else if (url.endsWith('.js') && existsSync(url.replace(/\.js$/, '.ts'))) {
    const path = url.replace(/\.js$/, '.ts');
    readFile(path, (err, data) => {
      if (err) {
        res.writeHead(500, JSON.stringify(err)).end();
      } else {
        const output = ts.transpileModule(data.toString('utf-8'), {
          compilerOptions: {
            module: ts.ModuleKind.ES2020,
            target: ts.ScriptTarget.ES2020,
          },
        });

        if (output.diagnostics)
          for (const diagnostic of output.diagnostics) console.log(diagnostic);
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
        });
        res.write(output.outputText);
        res.end();
      }
    });
  } else {
    readFile(url, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.write('Error: file not found');
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(data);
      res.end;
    });
  }
});

server.listen(3000);
console.clear();
console.log(
  '\n\n    Server:    ',
  chalk.cyan('http://localhost:' + chalk.bold(3000))
);
