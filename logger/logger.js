"use strict";
const log4js = require(`log4js`);

log4js.configure({
    appenders: {
        skud: {
            type: `file`,
            filename: `logs/debug.log`,
            maxLogSize: 10485760,
            backups: 3,
            compress: true
        }
    },
    categories: {
        default: {
            appenders: [`skud`],
            level: `debug`
        }
    }
});
const logger = log4js.getLogger(`skud`);
module.exports = logger;