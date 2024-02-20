import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';
import wasmURL from 'esbuild-wasm/esbuild.wasm?url';

let initalized = false;

export const bundler = async (rawCode: string) => {
  if (!initalized) {
    await esbuild.initialize({ wasmURL });
    initalized = true;
  }

  const result = await esbuild.build({
    entryPoints: ['index.js'],
    // bundle: true,
    write: false,
    plugins: [unpkgPathPlugin(rawCode), fetchPlugin(rawCode)],
    // define: {
    //   'process.env.NODE_ENV': '"production"',
    //   global: 'window',
    // },
  });
  console.log(result.outputFiles[0].text);

  return result.outputFiles[0].text;
};
