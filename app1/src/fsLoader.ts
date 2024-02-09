/// <reference lib="WebWorker"/>
import type { FsFolder } from './fileTypes';

declare var self: DedicatedWorkerGlobalScope;
self.addEventListener('message', async (e) => {
  const buffersToTransfer: ArrayBuffer[] = [];

  async function getContents(folder: FileSystemDirectoryHandle) {
    const dir: FsFolder = { type: 'folder', contents: {} };
    for await (const value of folder.values()) {
      if (value.kind == 'directory') {
        dir.contents[value.name] = await getContents(value);
      } else if (value.kind == 'file') {
        const buffer = await (await value.getFile()).arrayBuffer();
        buffersToTransfer.push(buffer);
        dir.contents[value.name] = {
          type: 'file',
          contents: new Uint8Array(buffer),
        };
      }
    }

    return dir;
  }

  const output = await getContents(e.data);

  self.postMessage(output, buffersToTransfer);
});
