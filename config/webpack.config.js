const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    popup: './src/js/popup.js',
    content: './src/js/content.js',
    background: './src/js/background.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  optimization: {
    minimize: false // Keeping code readable for review
  }
};
