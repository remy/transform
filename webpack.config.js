const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'production',
  plugins: [new CopyWebpackPlugin([{ from: 'src' }])],
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'), // string
    filename: 'bundle.js'
  }
};
