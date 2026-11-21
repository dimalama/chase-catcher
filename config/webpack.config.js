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
        // Options come from the root babel.config.js
        use: {
          loader: 'babel-loader',
          options: { rootMode: 'upward' }
        }
      }
    ]
  },
  optimization: {
    minimize: false // Keeping code readable for review
  }
};
