const path = require('path');

const underSrc = (dir) => path.resolve(__dirname, './src', dir);

module.exports = {
  siteMetadata: {
    siteUrl: 'https://dingziqi.github.io',
    title: 'www',
  },
  plugins: [
    {
      resolve: `gatsby-plugin-alias-imports`,
      options: {
        alias: {
          '@/': underSrc(''),
          '@components': underSrc('components'),
        },
        extensions: ['js'],
      },
    },
  ],
};
