import { defineConfig } from 'vite';
import ts from 'typescript';
import { readFile } from 'fs';
export default defineConfig({
  server: {
    port: 4000,
  },

  plugins: [
    {
      name: 'sw-typescript-transformer',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/sw.js') {
            readFile('./public/sw.ts', (err, data) => {
              if (err) throw err;
              const result = ts.transpile(data.toString('utf-8'), {
                target: 99,
              });

              res.write(result);
              res.end();
            });
          } else {
            next();
          }
        });
      },
    },
  ],
});
