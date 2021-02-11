'use strict';
const axios = require('axios'),
    qs = require('qs'),
    util = require('util'),
    logger = require(`../logger/logger`),
    appConfig = require(`../config/config`);

const header = { 'Content-Type': 'application/x-www-form-urlencoded' }

async function getUsers(ip, pass) {
    let config = {
        method: 'get',
        url: `http://${ip}/person/find?pass=${pass}&id=-1`,
        headers: header
    };

    const res = await axios(config);
    const result = await res;
    if (!result) {
        logger.info(`Отсутствует результат на запрос ${config}`);
        return [];
    }
    return result.data.data;
}

async function setUrlCallback(ip, pass) {

    let data = qs.stringify({
        'pass': pass,
        'callbackUrl': `http://${appConfig.server.host}:${appConfig.server.port}/${appConfig.server.route}`
    });
    let config = {
        method: 'post',
        url: `http://${ip}/setIdentifyCallBack`,
        headers: header,
        data: data
    };

    const res = await axios(config);
    const result = await res;
    if (!result) {
        console.log('Отсутствует результат');
        return [];
    }
    return result.data;
}

module.exports = { getUsers, setUrlCallback };