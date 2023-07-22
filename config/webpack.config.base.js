const path = require('path');

module.exports = {
  target: ['web', 'es5'], // 编译后的代码指定成es5，不然还是会有箭头函数
  
  entry: {
    index: './src/index.tsx',
  },

  module: {
    rules: [
      {
        test: /\.css|.s[ac]ss$/, 
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader', // 不同浏览器CSS3特性编译时自动添加前缀
          'sass-loader',
        ]
      },
      {
        test: /\.(jpg|png|jpeg|gif)$/, // 配置图片静态资源的打包信息
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 1024,
              fallback: {
                loader: 'file-loader',
                options: {
                  name: 'img/[name].[hash:8].[ext]',
                },
              },
            },
          },
        ],
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav)$/, // 配置多媒体资源的打包信息
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 1024,
              fallback: {
                loader: 'file-loader',
                options: {
                  name: 'media/[name].[hash:8].[ext]',
                },
              },
            },
          },
        ],
      },
      {
        test: /(\.js(x?))|(\.ts(x?))$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
          },
          /* {
            loader: 'esbuild-loader', // ts用这个也能编译
            options: {
              loader: 'tsx',
              target: 'es2015',
            },
          }, */
        ],
        // include: path.join(__dirname, '../src'),
        exclude: /node_modules/,
      },
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, '../src'), // @符号表示src这一层路径
    }, 
  },

  optimization: { // 添加抽离公共代码插件的配置
    splitChunks: {
      cacheGroups: {
        // 打包公共模块
        commons: {
          chunks: 'initial', // initial表示提取入口文件的公共部分
          minChunks: 2, // 表示提取公共部分最少的文件数
          minSize: 0, // 表示提取公共部分最小的大小
          name: 'commons', // 提取出来的文件命名
        },
      },
    },
  },
}
