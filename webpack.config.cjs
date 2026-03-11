var path = require('path');
var glob = require('glob')
const reactMatch = /\.(ts|js)x$/

module.exports = {
    context: __dirname,
    entry: {
        main:'./src/UI/main.tsx',
        // login:'./src/UI/user/login.tsx',
        // register:'./src/UI/user/register.tsx',
        create_new:'./src/UI/user/create-new-item.tsx'
    },
    output: {
        path: path.join(__dirname, "/dist"),
        filename: '[name].js'
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
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader"
                }
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: "asset/resource",
            },
        ]
    }
}