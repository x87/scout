const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'scout.js',
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules', path.resolve(__dirname, './src')],
  },
  mode: 'none',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
      },
      {
        test: /\.ts$/,
        loader: 'tslint-loader',
        enforce: 'pre',
        exclude: /node_modules/,
        options: {
          configFile: 'tslint.json',
          emitErrors: true,
        },
      },
    ],
  },
};
