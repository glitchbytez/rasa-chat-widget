import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

export default {
  input: 'src/index.js',
  output: [
    {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
      name: 'react-chat-widget'
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      browser: true,
      dedupe: ['react', 'react-dom']
    }),
    babel({
      babelHelpers: 'bundled',
      presets: [
        ['@babel/preset-env', { modules: false }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      exclude: 'node_modules/**'
    }),
    commonjs(),
    postcss({
      inject: true,
      minimize: true,
      config: {
        path: './postcss.config.js'
      }
    }),
    terser()
  ]
}; 