import type { FsFile, FsFolder } from './fileTypes';
// import type { ChannelMessage, ResponseData } from '../../app2/src/types';
import path from 'path-browserify';
import FsWorker from './fsLoader?worker';
import * as esbuild from 'esbuild-wasm';
import wasmURL from 'esbuild-wasm/esbuild.wasm?url';
import './style.css';

await esbuild.initialize({ wasmURL });

const fsLoader = new FsWorker();

declare global {
  var process: object;
  var handle: FileSystemDirectoryHandle | undefined;
}
globalThis.process = { cwd: () => '/' };

let cwd: FsFolder;

function fileExists(path: string) {
  if (!cwd) return false;
  const segments = path
    .replace(/^\//, '')
    .split('/')
    .filter((v) => v.length > 0);
  const fileName = segments.pop();
  if (!fileName) return false;
  let currentDir = cwd;
  for (const segment of segments) {
    const newDir = currentDir.contents[segment];
    if (!newDir || newDir.type === 'file') return false;
    currentDir = newDir;
  }
  const file = currentDir.contents[fileName];
  if (!file || file.type !== 'file') return false;
  return true;
}

function getFile(path: string) {
  if (!cwd) return null;
  const segments = path
    .replace(/^\//, '')
    .split('/')
    .filter((v) => v.length > 0);

  const fileName = segments.pop();
  if (!fileName) return null;

  let currentDir = cwd;
  for (const segment of segments) {
    const newDir = currentDir.contents[segment];
    if (!newDir || newDir.type === 'file') return null;
    currentDir = newDir;
  }

  const file = currentDir.contents[fileName];
  if (!file || file.type !== 'file') return null;
  return file;
}

function isNodeModule(importPath: string) {
  return !importPath.startsWith('.') && !importPath.startsWith('/');
}

document
  .querySelector('#directory-picker')
  ?.addEventListener('click', async () => {
    const handle = await showDirectoryPicker();
    fsLoader.postMessage(handle);
    cwd = await new Promise((resolve, reject) => {
      fsLoader.addEventListener('message', (e) => resolve(e.data), {
        once: true,
      });
      fsLoader.addEventListener('error', ({ error }) => reject(error), {
        once: true,
      });
    });
    alert('yayy');
  });

function resolve() {}

document.querySelector('#run')?.addEventListener('click', async () => {
  console.log('eee');
  const ctx = await esbuild.build({
    format: 'esm',
    bundle: false,
    write: false,
    entryPoints: ['/src/main.ts'],
    plugins: [
      {
        name: 'thing',
        setup(build) {
          console.log('build setup');
          build.onResolve({ filter: /.*/ }, async (args) => {
            console.log('build resolve');
            if (isNodeModule(args.path)) {
              const pathSegments = args.path.split('/');
              if (pathSegments.length == 0) return null;
              let nodeModule = pathSegments.splice(0, 1)[0];
              if (nodeModule.startsWith('@'))
                if (pathSegments[0].startsWith('@')) {
                  nodeModule = `/node_modules/${pathSegments[0]}/${pathSegments[1]}`;
                } else {
                  nodeModule;
                }
            }
            const resolvedPath =
              args.importer.length == 0
                ? args.path
                : path.resolve(path.dirname(args.importer), args.path);

            const extensions = ['.tsx', '.ts', '.jsx', '.js'];

            for (const extension of extensions) {
              const filePath = resolvedPath + extension;
              if (fileExists(filePath)) {
                return { path: filePath, namespace: 'e' };
              }
            }

            return { path: resolvedPath, namespace: 'e' };
          });

          build.onLoad({ filter: /.*/, namespace: 'e' }, async (args) => {
            console.log('build.load');
            const output: esbuild.OnLoadResult = { errors: [] };
            console.log('yay');
            if (args.path.endsWith('.tsx')) output.loader = 'tsx';
            if (args.path.endsWith('.ts')) output.loader = 'ts';
            if (args.path.endsWith('.jsx')) output.loader = 'jsx';
            if (args.path.endsWith('.js')) output.loader = 'js';
            if (args.path.endsWith('.css')) output.loader = 'css';
            if (args.path.endsWith('.json')) output.loader = 'json';

            if (!cwd)
              output.errors?.push({ text: "directory handle doesn't exist" });
            const file = getFile(args.path);

            if (file == null) {
              output.errors?.push({ text: 'File not found: ' + args.path });
            } else {
              output.contents = file.contents;
            }

            if (output.errors?.length == 0) delete output.errors;
            return output;
          });
        },
      },
    ],
  });
  console.log(ctx.outputFiles[0].text);
});

// type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
// const iframe = document
//   .querySelector('#app')!
//   .appendChild(document.createElement('iframe'));
// iframe.src =
//   'http://localhost:4000/localfs-internal-server-provider/index.html';
// iframe.title = 'no touchy touchy';

// iframe.addEventListener('load', () => {
//   const channel = new MessageChannel();

//   iframe.contentWindow?.postMessage(channel.port2, '*', [channel.port2]);
//   console.log('message sent');
//   const port = channel.port1;
//   port.start();

//   port.addEventListener('message', (e: MessageEvent<ChannelMessage>) => {
//     console.log('message');
//     if (e.data.type === 'sw/request') {
//       console.log('incoming request');
//       const r: PartialBy<
//         Response,
//         'clone' | 'arrayBuffer' | 'blob' | 'json' | 'text' | 'formData'
//       > = new Response('hi', {
//         headers: { 'Content-type': 'text/html' } as Record<string, string>,
//       });
//       console.log(Object.getPrototypeOf(r));

//       delete r['clone'];
//       delete r['arrayBuffer'];
//       delete r['blob'];
//       delete r['json'];
//       delete r['text'];
//       delete r['formData'];

//       const resp: ResponseData['data'] = {
//         body: r.body,
//         bodyUsed: r.bodyUsed,
//         headers: Array.from(r.headers.entries()),
//         ok: r.ok,
//         redirected: r.redirected,
//         status: r.status,
//         statusText: r.statusText,
//         type: r.type,
//         url: r.url,
//       };

//       const respData: ResponseData = {
//         type: 'server/response',
//         id: e.data.id,
//         data: resp,
//       };

//       port.postMessage(
//         respData,
//         respData.data.body ? [respData.data.body] : []
//       );
//     }
//   });
// });
