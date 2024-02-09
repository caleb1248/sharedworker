interface FsFile {
  type: 'file';
  contents: string | Uint8Array;
}

interface FsFolder {
  type: 'folder';
  contents: {
    [K: string]: FsFile | FsFolder | undefined;
  };
}

export type { FsFolder, FsFile };
