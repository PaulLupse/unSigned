var path = require('path');
const reactMatch = /\.(ts|js)x?$/
require('dotenv').config();
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    context: __dirname,
    entry: {
        main:'./src/frontend/index.tsx'
    },
    output: {
        path: path.join(__dirname, "/dist"),
        filename: '[name].js',
        publicPath: '/'
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devtool:"source-map",
    module: {
        rules: [
            {
                test: reactMatch,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-env",
                                "@babel/preset-react",
                                "@babel/preset-typescript",
                            ],
                        },
                    },
                ],
            },
            {
                test: /\.css$/i,
                use: [
                  "style-loader", // Injects CSS into the DOM
                  {
                    loader: "css-loader",
                    options: {
                      // Enables CSS Modules for files ending in .module.css
                      modules: {
                        auto: true,
                        localIdentName: "[name]__[local]--[hash:base64:5]",
                      },
                    },
                  },
                ],
              },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: "asset/resource",
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./static/html/index.html",
            filename:'index.html'
        })
    ],
    devServer: {
        port: process.env.FRONTEND_PORT,
        hot: true,
        historyApiFallback: true,
        proxy: [{
            context: ['/api'],
            target: process.env.FASTAPI_SERVER_ADDRESS,
            changeOrigin: true,
            secure: false
        }]
    }
}