// eslint-disable-next-line import/no-extraneous-dependencies
const esbuild = require('esbuild');
// eslint-disable-next-line import/no-extraneous-dependencies
const {swcPlugin} = require('esbuild-plugin-swc');

const config = {
  entryPoints: ['./scripts/app.ts'],
  bundle: true,
  outdir: './dist',
  sourcemap: 'inline',
  platform: 'node',
  plugins: [swcPlugin()]
};

exports.config = config;

esbuild.build(config);
