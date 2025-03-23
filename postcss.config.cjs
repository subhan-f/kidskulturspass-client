// Simplified temporary configuration to avoid dependency errors
module.exports = {
  plugins: {
    autoprefixer: {},
    cssnano: {
      preset: ['default', {
        discardComments: {
          removeAll: true
        },
        normalizeWhitespace: false
      }]
    }
  }
};
