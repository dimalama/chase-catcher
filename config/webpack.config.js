const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    popup: './src/js/popup.ts',
    content: './src/js/content.ts',
    background: './src/js/background.ts'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist')
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.[jt]s$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-typescript']
          }
        }
      }
    ]
  },
  optimization: {
    minimize: false // Keeping code readable for review
  }
};
