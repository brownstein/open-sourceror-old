const path = require("path");
const webpack = require("webpack");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

// build variant for electron renderer
module.exports = (env, argv) => {
  const isDev = (
    argv.mode === "development" ||
    process.env.NODE_ENV === "development"
  );

  return {
    mode: isDev ? "development" : "production",
    entry: {
      // slurp up index.js as "index", so we get "index" out
      index: path.join(__dirname, "src", "index.js")
    },
    output: {
      path: path.join(__dirname, "electron", "dist"),
      filename: "[name].js",
      chunkFilename: "[name].bundle.js",
      publicPath: "dist/",
      library: "OpenSourceror",
      libraryExport: "default",
      libraryTarget: "commonjs2"
    },
    target: "electron-renderer",
    externals: isDev ? {
      // we don't need to re-bundle everything, electron's renderer can require
      react: "react",
      "react-redux": "react-redux",
      three: "three",
      "@babel/core": "@babel/core",
      "@babel/plugin-transform-arrow-functions": "@babel/plugin-transform-arrow-functions",
      "@babel/plugin-transform-block-scoping": "@babel/plugin-transform-block-scoping",
      "babel-plugin-transform-async-to-promises": "babel-plugin-transform-async-to-promises",
    } : {},
    resolve: {
      alias: {
        entities: path.resolve(__dirname, "src/entities"),
        components: path.resolve(__dirname, "src/components"),
        engine: path.resolve(__dirname, "src/engine"),
        "p2-utils": path.resolve(__dirname, "src/p2-utils"),
        "script-runner": path.resolve(__dirname, "src/script-runner"),
        src: path.resolve(__dirname, "src"),
      }
    },
    devtool: isDev ? "cheap-source-map" : "cheap-module-source-map",
    module: {
      rules: [
        {
          exclude: /node_modules/,
          test: /(\.jsx$|\.js$)/,
          use: {
            loader: "babel-loader"
          }
        },
        {
          exclude: /node_modules/,
          test: /\.worker\.js$/,
          use: [
            {
              loader: "worker-loader"
            },
            {
              loader: "babel-loader"
            }
          ]
        },
        {
          test: /\.less$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader
            },
            {
              loader: "css-loader",
            },
            {
              loader: "less-loader",
              options: {
                lessOptions: {
                  strictMath: true,
                  noIeCompat: true,
                },
              },
            },
          ],
        },
        {
          test: /(-sdf|.*)\.(fnt|png)$/,
          loader: "file-loader",
          options: {
            publicPath: 'dist/'
          }
        },
        {
          test: /\.(woff|woff2)$/,
          loader: "file-loader",
          options: {
            outputPath: "css/"
          }
        },
        {
          test: /\.(glsl|frag|vert)$/,
          loader: "raw-loader",
          exclude: /node_modules/
        },
        {
          test: /\.(glsl|frag|vert)$/,
          loader: "glslify-loader",
          exclude: /node_modules/
        },
        {
          test: /\.(tsx|txt)$/,
          use: "raw-loader",
        },
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin(),
      new webpack.ProvidePlugin({
        React: "react",
        THREE: "three"
      }),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
        "process.env.DEBUG": `(process ? process.env.DEBUG : null) || ${JSON.stringify(process.env.DEBUG)}`,
        "window.__DEV__": isDev ? "true" : "false"
      }),
      !isDev && new UglifyJSPlugin({
        include: /\.min\.js$/
      })
    ]
    .filter(p => p),
    optimization: {
      splitChunks: {}
    }
  }
};
