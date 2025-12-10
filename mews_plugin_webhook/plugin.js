'use strict';

/**
 * Plugin entry point for mews_plugin_webhook connector
 * This file is required by Appmixer to register plugin routes
 * 
 * Based on Appmixer Line connector example:
 * https://github.com/Appmixer-ai/appmixer-connectors/blob/7144c5ea801869ea8cdf7818458e153e89b89b36/src/appmixer/line/plugin.js
 */

module.exports = async context => {
    require('./routes')(context);
};
