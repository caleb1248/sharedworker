import { defineConfig } from 'vite';
import ts from 'typescript';
import { existsSync, readFile } from 'fs';
export default defineConfig({
  server: {
    port: 4000,
  },

  plugins: [
    {
      name: 'sw-typescript-transformer',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (
            req.url &&
            !/^(node_modules|src)$/.test(req.url) &&
            /.js/.test(req.url) &&
            existsSync('./public' + req.url.replace(/\.js$/, '.ts'))
          ) {
            readFile(
              './public' + req.url.replace(/\.js$/, '.ts'),
              (err, data) => {
                if (err) throw err;
                const result = ts
                  .transpile(data.toString('utf-8'), { target: 99 })
                  .replace(/export(.*)/, '');

                res.setHeader('Content-Type', 'application/javascript');
                res.write(result);
                res.end();
              }
            );
          } else next();
        });
      },
    },
  ],
});
