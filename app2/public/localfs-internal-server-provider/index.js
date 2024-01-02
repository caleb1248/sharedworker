// @ts-check
/**@typedef {import('../../src/types').ChannelMessage} ChannelMessage*/

function generateRandomId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let id = '';

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    id += alphabet.charAt(randomIndex);
  }

  return id;
}

const worker = navigator.serviceWorker.controller;
const messageChannel = new MessageChannel();
worker?.postMessage(
  { type: 'server/create', id: 'test', port: messageChannel.port2 },
  [messageChannel.port2]
);

window.addEventListener('beforeunload', (e) => {
  e.preventDefault();
});

messageChannel.port1.addEventListener('message', (e) => console.log(e.data));
