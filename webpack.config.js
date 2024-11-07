import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodeExternals from 'webpack-node-externals';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

dotenv.config();
export default {
    entry: './src/index.ts',
    output: {
        path: path.join(path.dirname(fileURLToPath(import.meta.url)), 'build'),
        filename: 'index.cjs',
        assetModuleFilename: 'static/[name].[hash:8][ext]',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
            {
                exclude: [/\.(js|jsx|mjs|ts|tsx)$/, /\.(html|ejs)$/, /\.json$/],
                type: 'asset/resource',
                generator: {
                    outputPath: '',
                    publicPath: '',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        plugins: [new TsconfigPathsPlugin({})],
    },
    externals: [nodeExternals()],
    externalsPresets: { node: true },
    node: {
        __dirname: false,
    },
    // eslint-disable-next-line no-undef
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
};
