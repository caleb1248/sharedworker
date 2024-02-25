import { dirname, resolve } from 'path-browserify';

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

function resolveImport(
  source: string,
  importer: string,
  readFileSync: (fileName: string) => string | null,
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

  if (source.startsWith('#')) {
    // Go through the parent folders to find a package.json
    let currentDir = resolve('/', importer);
    while (
      currentDir !== '/' ||
      !fileExists(resolve(currentDir, 'package.json'))
    ) {
      currentDir = resolve(currentDir, '../');
    }
  }
}
