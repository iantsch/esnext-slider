let webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env, argv) => {
  const DEBUG = argv.mode === 'development';
  let optimization = {};
  return {
    entry: {
      '/docs/dist/main': './docs/src/main.js',
      '/docs/dist/style': './docs/src/style.scss',
      '/dist/css/esnext-slider': './src/scss/esnext-slider.scss',
      '/dist/esnext-slider': './src/esnext-slider.js'
    },
    output: {
      path: path.resolve(__dirname),
      filename: '[name].js'
    },
    devtool: DEBUG ? 'source-map' : 'none',
    module: {
      rules: [{
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: '/node_modules/',
        options: {
          presets: ['env']
        }
      }, {
        test: /\.scss$/,
        use: [{
          loader: MiniCssExtractPlugin.loader
        },
          {
            loader: 'css-loader',
            options: {
              sourceMap: DEBUG,
              importLoaders: 2
            }
          }, {
            loader: 'postcss-loader',
            options: {
              sourceMap: DEBUG
            }
          }, {
            loader: 'resolve-url-loader'
          }, {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }]
      }]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].css"
      }),
      new CleanWebpackPlugin([
        './dist',
        './docs/dist',
      ], {
        root: __dirname,
        verbose: true,     //WRITE CONSOLE LOGS
        dry: false     //TEST EMULATE DELETE - ONLY CONSOLE LOGS WHAT SHOULD BE DELETED
      }),

    ]
  };
}
