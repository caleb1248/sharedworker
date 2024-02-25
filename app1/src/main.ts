import './style.css';
import * as babel from '@babel/standalone';
import './layout';
import FsWorker from './fsLoader?worker';
import type { FsFolder } from './fileTypes';
// import { resolveImport } from 'resolve-import';
import isCore from 'is-core-module';
console.log(isCore('fs'));
// resolveImport;
// import type { ChannelMessage, ResponseData } from '../../app2/src/types';
// console.log(
//   babel.transform('import * as fs from "../lol/thing.ts";', {
//     root: '/',
//     cwd: '/',
//     filename: '/hello world/hi/index.js',
//     plugins: [
//       importRewrite((source, file) => {
//         return requireResolve({
//           id: source,
//           importer: file,
//           readFileSync: (fileName) => getFile(fileName)?.contents as string,
//           fileExists: (fileName) => fileExists(fileName),
//           directoryExists: (directoryName) => directoryExists(directoryName),
//         });
//       }),
//     ],
//   }).code
// );

const fsLoader = new FsWorker();

declare global {
  var process: object;
  var handle: FileSystemDirectoryHandle | undefined;
}

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

function directoryExists(path: string) {
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
  if (!file || file.type !== 'folder') return false;
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

document.querySelector('#run')?.addEventListener('click', async () => {
  console.log(
    babel.transform('import * as fs from "../lol/thing.ts";', {
      root: '/',
      cwd: '/',
      filename: '/hello world/hi/index.js',
      plugins: [
        // importRewrite((source, file) => {
        //   return requireResolve({
        //     id: source,
        //     importer: file,
        //     readFileSync: (fileName) => getFile(fileName)?.contents as string,
        //     fileExists: (fileName) => fileExists(fileName),
        //     directoryExists: (directoryName) => directoryExists(directoryName),
        //   });
        // }),
      ],
    }).code
  );
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
