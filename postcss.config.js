module.exports = ({ file, options, env }) => ({
  parser: file.extname === '.css' ? 'sugarss' : require('postcss-scss'),
  plugins: {
    'postcss-import': {},
    'postcss-cssnext': {
      warnForDuplicates: false,
      features: {
        customProperties: false
      }
    },
    'cssnano': {}
  },
  sourceMap: options.sourceMap
});
