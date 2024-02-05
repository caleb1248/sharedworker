import { ChannelMessage, ResponseData } from '../../app2/src/types';
import path from 'path-browserify';
import esbuild from 'esbuild-wasm';
import wasmURL from 'esbuild-wasm/esbuild.wasm?url';

await esbuild.initialize({ wasmURL });

declare global {
  var process: object;
}
globalThis.process = { cwd: () => '/' };

let handle: FileSystemDirectoryHandle;

document
  .querySelector('#directory-picker')
  ?.addEventListener(
    'click',
    async () => (window.handle = handle = await showDirectoryPicker())
  );

document.querySelector('#run')?.addEventListener('click', async () => {
  const ctx = esbuild.build({
    entryPoints: ['src/main.ts'],
    bundle: true,
    plugins: [
      {
        name: 'thing',
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            return {
              path: path.resolve(path.dirname(args.importer), args.path),
              namespace: 'e',
            };
          });
          build.onLoad({ filter: /.*/, namespace: 'e' }, async (args) => {
            const output: esbuild.OnLoadResult = { errors: [] };
            if (!handle)
              output.errors?.push({ text: "directory handle doesn't exist" });
            const segments = args.path
              .replace(/$.\//, '')
              .split('/')
              .filter((v) => v.length > 0);
            const fileName = segments.pop();
            if (!fileName) output.errors?.push({ text: 'file name is empty' });
            let currentDir = handle;
            console.log(segments);
            try {
              for (const segment of segments) {
                console.log(segment);
                currentDir = await currentDir.getDirectoryHandle(segment, {
                  create: false,
                });
              }

              output.contents = new Uint8Array(
                await (
                  await (await currentDir.getFileHandle(fileName!)).getFile()
                ).arrayBuffer()
              );
            } catch {
              output.errors?.push({
                text: 'File not found: ' + args.path,
              });
            }
            if (output.errors?.length == 0) delete output.errors;
            return output;
          });
        },
      },
    ],
  });
});

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
const iframe = document
  .querySelector('#app')!
  .appendChild(document.createElement('iframe'));
iframe.src =
  'http://localhost:4000/localfs-internal-server-provider/index.html';
iframe.title = 'no touchy touchy';

iframe.addEventListener('load', () => {
  const channel = new MessageChannel();

  iframe.contentWindow?.postMessage(channel.port2, '*', [channel.port2]);
  console.log('message sent');
  const port = channel.port1;
  port.start();

  port.addEventListener('message', (e: MessageEvent<ChannelMessage>) => {
    console.log('message');
    if (e.data.type === 'sw/request') {
      console.log('incoming request');
      const r: PartialBy<
        Response,
        'clone' | 'arrayBuffer' | 'blob' | 'json' | 'text' | 'formData'
      > = new Response('hi', {
        headers: { 'Content-type': 'text/html' } as Record<string, string>,
      });
      console.log(Object.getPrototypeOf(r));

      delete r['clone'];
      delete r['arrayBuffer'];
      delete r['blob'];
      delete r['json'];
      delete r['text'];
      delete r['formData'];

      const resp: ResponseData['data'] = {
        body: r.body,
        bodyUsed: r.bodyUsed,
        headers: Array.from(r.headers.entries()),
        ok: r.ok,
        redirected: r.redirected,
        status: r.status,
        statusText: r.statusText,
        type: r.type,
        url: r.url,
      };

      const respData: ResponseData = {
        type: 'server/response',
        id: e.data.id,
        data: resp,
      };

      port.postMessage(
        respData,
        respData.data.body ? [respData.data.body] : []
      );
    }
  });
});
