/// <reference lib="WebWorker" />

import type { ChannelMessage, RequestData } from '../src/types';

// @ts-ignore
const sw = self as unknown as ServiceWorkerGlobalScope;

const channel = new BroadcastChannel('request-proxy');

const servers: Map<string, MessagePort> = new Map();

function log(...data: any[]) {
  console.log('[Service worker]:', ...data);
}

sw.addEventListener('message', (e) => {
  const data: ChannelMessage = e.data;
  if (data.type == 'server/create') {
    const port = data.port;
    servers.set(data.id, port);
    console.log(data.id);
    log('create server');
    port.postMessage('hello world');
  }
});

sw.addEventListener('error', (e) => {
  e.preventDefault();
  console.log('[Service worker]: ', e.error);
});

sw.addEventListener('install', (event) => {
  log('installing');
  event.waitUntil(
    caches
      .open('interal-server-provider-cache')
      .then((cache) =>
        cache.addAll([
          '/localfs-internal-server-provider/index.html',
          'localfs-internal-server-provider/index.js',
        ])
      )
  );
});

sw.addEventListener('activate', () => log('activated'));

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
    const id = Date.now();
    const server = servers.get(serverId);
    if (!server) {
      event.respondWith(
        new Response(
          "Error: no server is running with id of '" + serverId + "'",
          { status: 404 }
        )
      );
      return;
    }
    const { clone, arrayBuffer, blob, formData, json, text, ...req } =
      event.request;

    const data: RequestData = {
      type: 'sw/request',
      id,
      data: req,
    };

    server.postMessage(data, data.data.body ? [data.data.body] : []);
  }
});
