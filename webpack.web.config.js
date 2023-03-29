const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'web'),
    filename: 'scout.web.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules', path.resolve(__dirname, './src')],
    fallback: {
      fs: false,
      path: false,
      process: false,
      child_process: false
    }
  },
  mode: 'none',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.build.json',
        },
      },
    ],
  },
};
