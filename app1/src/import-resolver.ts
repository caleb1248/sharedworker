import { dirname, resolve } from 'path-browserify';
import type { FsFile } from './fileTypes';

const fileExtensions = [
  'mts',
  'cts',
  'tsx',
  'ts',
  'mjs',
  'cjs',
  'jsx',
  'js',
  'json',
];

function loadRelativePath(
  path: string,
  importer: string,
  getFile: (fileName: string) => FsFile | null
) {}

function UintArrayToString(arr: Uint8Array | string) {
  if (typeof arr === 'string') {
    return arr;
  }

  let str = '';
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return str;
}

interface ResolveResult {
  path: string;
  loader: string;
}

function resolveFromImports(
  source: string,
  importer: string,
  getFile: (fileName: string) => FsFile | null
) {
  // Go through the parent folders to find a package.json
  let currentDir = resolve('/', importer);
  let file: FsFile | null = null;
  while (currentDir !== '/') {
    file = getFile(resolve(currentDir, 'package.json'));
    if (file) {
      break;
    }

    currentDir = dirname(currentDir);
  }

  if (!file) {
    throw new Error(
      `Could not resolve import '${source}' from '${importer}': no package.json found`
    );
  }

  const packageJson = JSON.parse(UintArrayToString(file.contents));

  if (!packageJson.imports) {
    throw new Error(
      `Could not resolve import '${source}' from '${importer}', imports not defined in ${resolve(
        currentDir,
        'package.json'
      )}`
    );
  }

  if (!packageJson.imports[source]) {
    throw new Error(
      `Could not resolve import '${source}' from '${importer}', import not found`
    );
  }

  return resolve(currentDir, packageJson.imports[source]);
}

function resolveImport(
  source: string,
  importer: string,
  getFile: (fileName: string) => FsFile | null,
  fileExists: (fileName: string) => boolean,
  directoryExists: (directoryName: string) => boolean
) {
  if (source.startsWith('node:')) {
    return source;
  }

  if (
    source.startsWith('./') ||
    source.startsWith('../') ||
    source.startsWith('/')
  ) {
    return resolve(importer, source);
  }

  if (source.startsWith('#'))
    return resolveFromImports(source, importer, getFile);
}

export default resolveImport;
