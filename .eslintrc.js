module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true
  },
  'extends': 'airbnb-base',
  'plugins': [
    'json'
  ],
  'parserOptions': {
    'sourceType': 'module'
  },
  'rules': {
    'arrow-body-style': 'warn',
    'comma-dangle': 'off',
    'consistent-return': 'warn',
    'dot-notation': 'off',
    'eqeqeq': 'off',
    'import/newline-after-import': 'off',
    'import/no-dynamic-require': 'warn',
    'max-len': 'warn',
    'no-else-return': 'warn',
    'no-lonely-if': 'off',
    'no-param-reassign': 'off',
    'no-sequences': 'off',
    'no-throw-literal': 'warn',
    'no-underscore-dangle': 'off',
    'no-unneeded-ternary': 'warn',
    'no-unused-expressions': 'off',
    'no-unused-vars': 'warn',
    'no-useless-escape': 'off',
    'object-curly-newline': 'off',
    'object-curly-spacing': 'off',
    'prefer-arrow-callback': 'off',
    'prefer-destructuring': 'warn',
    'prefer-template': 'warn',
    'quote-props': 'off',
    'semi': 'error',
    'valid-jsdoc': 'off',
    'object-shorthand': 'off',
    'no-console': 'off',
    'no-loop-func': 'off',
    'no-await-in-loop': 'off',
    'no-restricted-syntax': 'warn'
  }
};
