const BASE_CONFIG = require('./config/webpack.config.base'),
      DEV_CONFIG = require('./config/webpack.config.dev'),
      PROD_CONFIG = require('./config/webpack.config.prod');

const NODE_ENV = process.env.NODE_ENV;
const CONFIG_MAP = {
  'development': DEV_CONFIG,
  'production': PROD_CONFIG,
};
const TARGET_CONFIG = CONFIG_MAP?.[NODE_ENV] || {};

module.exports = {
  mode: NODE_ENV, // development/production

  ...BASE_CONFIG,

  ...TARGET_CONFIG,
}
