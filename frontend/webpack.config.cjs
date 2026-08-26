var path = require('path');
const reactMatch = /\.(ts|js)x?$/
require('dotenv').config();
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { watch } = require('fs');

module.exports = {
    context: __dirname,
    entry: {
        main:'./src/index.tsx'
    },
    output: {
        path: path.join(__dirname, "/dist"),
        filename: '[name].js',
        publicPath: '/'
    },
    resolve: {
        alias: {
            src: path.resolve(__dirname, './src'),
            static: path.resolve(__dirname, './static/'),
            images: path.resolve(__dirname, './static/images/')
        },
        extensions: ['.ts', '.tsx', '.js', '.css']
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
        ],
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
            target: process.env.BACKEND_ADDRESS,
            changeOrigin: true,
            secure: false
        }],
        static: {
            directory: path.join(__dirname, 'static'),
            watch: {
                poll: 500, // Check for changes every second
                ignored: /node_modules/, // Omit node_modules to save CPU
            }
        },
        compress: true,
    }
}