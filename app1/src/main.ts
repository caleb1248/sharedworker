import { ChannelMessage, ResponseData } from '../../app2/src/types';
import esbuild from 'esbuild-wasm';

let handle: FileSystemDirectoryHandle;

document
  .querySelector('#directory-picker')
  ?.addEventListener(
    'click',
    async () => (handle = await showDirectoryPicker())
  );

esbuild.context({
  plugins: [
    {
      name: 'thing',
      setup(build) {
        build.onLoad({ filter: /.*/ }, (args) => {
          if (!handle) {
            return {
              errors: [{ text: 'file not found' }],
            };
          }

          const segments = '';
        });
      },
    },
  ],
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