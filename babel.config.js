// Single Babel config shared by webpack (babel-loader) and Jest (babel-jest).
// Targets match the minimum browser versions the extension supports.
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: 'chrome >= 109, firefox >= 128, safari >= 16.4, ios_saf >= 16.4',
      },
    ],
    '@babel/preset-typescript',
  ],
};
