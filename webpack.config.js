var path = require('path');
var nodeEnv = process.env.NODE_ENV || 'development';
var isDev = (nodeEnv !== 'production');

var config = {
  entry: {
    dist: './src/entries/dist.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        include: path.resolve(__dirname, 'src'),
        use: ['style-loader', 'css-loader']
      },
       {
       test: /\.tsx?$/,
       use: 'ts-loader',
       exclude: /node_modules/
     }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  }
};

if (isDev) {
  config.devtool = 'inline-source-map';
}

module.exports = config;
