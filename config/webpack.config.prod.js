const path = require('path'),
      { CleanWebpackPlugin } = require('clean-webpack-plugin'), // 每次打包清除之前的打包文件
      MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 抽离css

module.exports = {
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, "../lib"),
    libraryTarget: 'commonjs2',
  },

  externals: {
    'react': {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react',
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom',
    }
  },

  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }),
    require('autoprefixer'),
  ],
}
