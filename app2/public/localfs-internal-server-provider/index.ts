function generateRandomId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let id = '';

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    id += alphabet.charAt(randomIndex);
  }

  return id;
}

console.log('attaching message');
window.addEventListener('message', (e: MessageEvent<MessagePort>) => {
  console.log('yes sir');
  const port = e.data;

  if (!(port instanceof MessagePort)) {
    throw new TypeError('Expected a MessagePort, but recived something else.');
  }

  navigator.serviceWorker.controller?.postMessage(
    { type: 'server/create', id: 'test' },
    [port]
  );

  window.addEventListener('beforeunload', (e) => {
    navigator.serviceWorker.controller?.postMessage({
      type: 'server/shutdown',
      id: 'test',
    });
  });

  port.start();
});
