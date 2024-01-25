/// <reference lib="WebWorker" />

import type { ChannelMessage, RequestData } from '../src/types';

// @ts-ignore
const sw = self as unknown as ServiceWorkerGlobalScope;

const servers: Map<string, MessagePort> = new Map();
sw.addEventListener('message', (e) => {
  const data: ChannelMessage = e.data;
  if (data.type == 'server/create') {
    const port = e.ports[0];
    console.log(port);
    servers.set(data.id, port);
    port.start();
    console.log('create server with id of', data.id);
  } else if (data.type === 'server/shutdown') {
    console.log('thing shut down');
  }
});

sw.addEventListener('error', (e) => {
  e.preventDefault();
  console.log('[Service worker]: ', e.error);
});

sw.addEventListener('install', (event) => {
  sw.skipWaiting();
});

sw.addEventListener('activate', () => console.log('activated'));

sw.addEventListener('fetch', (event) => {
  const serverId = 'test';
  const requestURL = new URL(event.request.url);
  if (requestURL.pathname.startsWith('/localfs-internal-server-provider/')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);

          // If the request was successful, cache the response for future use
          await caches.open('internal-server-provider-cache').then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });

          return networkResponse;
        } catch (error) {
          // If the request fails, try to retrieve the response from the cache
          const cacheResponse = await caches.match(event.request);
          if (cacheResponse) {
            return cacheResponse;
          }

          throw error;
        }
      })()
    );

    return;
  } else {
    console.log('request incoming');
    const id = Date.now();
    const server = servers.get(serverId);
    console.log('no server found');
    if (!server) {
      event.respondWith(
        new Response(
          "Error: no server is running with id of '" + serverId + "'",
          { status: 404 }
        )
      );
      return;
    }
    const r: Omit<
      Request,
      | 'clone'
      | 'arrayBuffer'
      | 'blob'
      | 'json'
      | 'text'
      | 'formData'
      | 'signal'
      | 'mode'
    > = event.request.clone();
    delete r['arrayBuffer'];
    delete r['blob'];
    delete r['json'];
    delete r['text'];
    delete r['formData'];
    delete r['mode'];
    delete r['signal'];
    // @ts-ignore
    const req = {
      cache: r.cache,
      credentials: r.credentials,
      destination: r.destination,
      headers: Array.from(r.headers.entries()),
      integrity: r.integrity,
      keepalive: r.keepalive,
      method: r.method,
      redirect: r.redirect,
      referrer: r.referrer,
      referrerPolicy: r.referrerPolicy,
      url: r.url,
      body: r.body,
      bodyUsed: r.bodyUsed,
    };

    const data: RequestData = {
      type: 'sw/request',
      id,
      data: req,
    };

    event.respondWith(
      new Promise((resolve) => {
        function handleServerResponse({ data }: MessageEvent<ChannelMessage>) {
          console.log('message from server', data.type);
          if (data.type === 'error' && data.id === id) {
            resolve(new Response('internal server error', { status: 500 }));
          } else if (data.type === 'server/shutdown' && data.id === serverId) {
            resolve(new Response('Error: Server shut down'));
          } else if (data.type === 'server/response' && data.id === id) {
            console.log('response recived!');
            const { body, ...rest } = data.data;
            if (body) resolve(new Response(body, rest));
          } else {
            console.log(data.type, data.id);
          }
          server?.removeEventListener('message', handleServerResponse);
          console.log('event listener removed');
        }

        server.addEventListener('message', handleServerResponse);
        server.postMessage(data, data.data.body ? [data.data.body] : []);
      })
    );
  }
});
