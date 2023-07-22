const path = require('path'),
      HtmlWebPackPlugin = require('html-webpack-plugin'), // 引入html模板插件
      { CleanWebpackPlugin } = require('clean-webpack-plugin'), // 每次打包清除之前的打包文件
      MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 抽离css

//创建一个插件的实例
const htmlPlugin = new HtmlWebPackPlugin({
  template: path.join(__dirname, '../public/index.html'), // 源文件
  filename: 'index.html', // 生成内存中的首页名称
  favicon: '',
});

module.exports = {
  devServer: {
    hot: true,
    open: true,
    port: 8000,
    compress: true, // gzip压缩
    historyApiFallback: true, // 解决启动后刷新404
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        pathRewrite: {
          '^/api': '/api',
        },
        changeOrigin: true, // 让target参数是域名
        secure: false, // 是否支持https协议代理
      },
    },
  },

  plugins: [
    htmlPlugin,
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }),
    require('autoprefixer'),
  ],
}
