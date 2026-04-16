module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        chrome: '109'
      }
    }],
    ['@babel/preset-typescript']
  ]
};
