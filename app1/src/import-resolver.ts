import { dirname, resolve } from 'path-browserify';
import type { FsFile } from './fileTypes';

const extensionPriority = {
  default: '',
  js: ['.ts', '.tsx', '.js', '.jsx'],
  mjs: ['.mts', '.mjs'],
  cjs: ['.cts', '.cjs'],
};

function isURL(urlString: string) {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
}

function ESM_RESOLVE(specifier: string, parentURL: string) {
  let resolved = undefined;

  if (isURL(specifier)) {
  }
}

export default ESM_RESOLVE;
