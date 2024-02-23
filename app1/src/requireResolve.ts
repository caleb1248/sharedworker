import { sync } from 'browser-resolve';
import { dirname, resolve } from 'path-browserify';

interface ResolveOptions {
  id: string;
  importer: string;
  readFileSync: (fileName: string) => string;
  fileExists: (fileName: string) => boolean;
  directoryExists: (folderName: string) => boolean;
}

export function requireResolve({
  id,
  importer,
  readFileSync,
  fileExists,
  directoryExists,
}: ResolveOptions) {
  // If the path is relative, use resolve from path-browserify
  if (id.startsWith('/') || id.startsWith('.')) {
    return resolve(dirname(importer), id);
  }
  return sync(id, {
    readFileSync,
    realpathSync(file) {
      return file;
    },

    isFile: fileExists,
    isDirectory: directoryExists,
  });
}
