// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

var path = require("path")
var webpack = require("webpack")
var CompressionPlugin = require("compression-webpack-plugin")
var HtmlWebPackPlugin = require("html-webpack-plugin")
var EventHooksPlugin = require("event-hooks-webpack-plugin")
var CopyPlugin = require("copy-webpack-plugin")
var TerserPlugin = require("terser-webpack-plugin")
var BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin
var mri = require("mri")
var glob = require("glob")
var fs = require("fs")
var dotenv = require("dotenv")

dotenv.config()

// CLI commands for deploying built artefact.
var argv = process.argv.slice(2)
var cliArgs = mri(argv)

var enableTwitterWidgets = process.env.ENABLE_TWITTER_WIDGETS === "true"

var embedServiceHostname = process.env.EMBED_SERVICE_HOSTNAME || "metropolis.vote"

module.exports = (env, options) => {
  var isDevBuild = options.mode === "development"
  var isDevServer = process.env.WEBPACK_SERVE
  var chunkHashFragment = isDevBuild || isDevServer ? "" : ".[chunkhash:8]"
  return {
    stats: { errorDetails: true },
    entry: ["./src/index"],
    output: {
      publicPath: "/",
      filename: `static/js/client_bundle${chunkHashFragment}.js`,
      path: path.resolve(__dirname, "build"),
      clean: true,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".css", ".png", ".svg"],
    },
    devServer: {
      historyApiFallback: true,
      proxy: {
        "/api": {
          target: "http://localhost:8040",
          secure: false,
        },
      },
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: "public",
            globOptions: { ignore: ["**/index.ejs"] },
          },
        ],
      }),
      new HtmlWebPackPlugin({
        template: path.resolve(__dirname, "public/index.ejs"),
        filename: "index.html",
        inject: "body",
        templateParameters: {
          enableTwitterWidgets: enableTwitterWidgets,
        },
      }),
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify(options.mode),
          ENABLE_TWITTER_WIDGETS: JSON.stringify(enableTwitterWidgets),
          FIP_REPO_OWNER: JSON.stringify(process.env.FIP_REPO_OWNER),
          FIP_REPO_NAME: JSON.stringify(process.env.FIP_REPO_NAME),
          EMBED_SERVICE_HOSTNAME: JSON.stringify(embedServiceHostname),
        },
      }),
      // Only run analyzer when specified in flag.
      ...(cliArgs.analyze ? [new BundleAnalyzerPlugin({ defaultSizes: "gzip" })] : []),
    ],
    optimization: {
      minimize: !isDevBuild,
      minimizer: [new TerserPlugin()],
    },
    module: {
      rules: [
        {
          test: /\.(d.ts)$/,
          use: ["null-loader"],
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.tsx?$/,
          exclude: [/node_modules|\.d\.ts$/, path.resolve(__dirname, "build")],
          use: "ts-loader",
        },
        {
          test: /\.m?js$/,
          exclude: [/node_modules/, path.resolve(__dirname, "build")],
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
            },
          },
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          loader: "file-loader",
        },
        {
          test: /\.mdx?$/,
          use: [
            "babel-loader",
            {
              loader: "@mdx-js/loader",
              /** @type {import('@mdx-js/loader').Options} */
              options: {
                providerImportSource: "@mdx-js/react",
              },
            },
          ],
        },
      ],
    },
  }
}
