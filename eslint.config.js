import antfu from '@antfu/eslint-config'

export default antfu(
  {
    unocss: true,
    ignores: [
      // eslint ignore globs here
    ],
  },
  {
    rules: {
      // Disable forcing interface instead of type
      'ts/ban-types': 'off',
      // Allow trailing space in comments, for possible JSDoc formattings
      'style/no-trailing-spaces': ['error', { ignoreComments: true }],
      // Relaxes inline statements a bit
      'style/max-statements-per-line': ['error', { max: 2 }],
    },
  },
  // Allow trailing space for markdown formatting
  {
    files: ['**/*.md'],
    rules: {
      'style/no-trailing-spaces': 'off',
    },
  },
)
