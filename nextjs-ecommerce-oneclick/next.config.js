// next.config.js
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  future: {
    webpack5: true,
  },
  webpack: function (config) {
    Object.assign(config.optimization, {
      minimize: false,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_fnames: true, // don't strip function names in production
          },
        }),
      ],
    });

    return config;
  },
};
