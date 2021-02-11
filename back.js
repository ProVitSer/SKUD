'use strict';
const express = require("express"),
    app = express(),
    moment = require('moment'),
    WebSocket = require('ws'),
    logger = require("./logger/logger"),
    axios = require('./src/axios'),
    config = require("./config/config"),
    DB = require("./src/db");

const dbSkud = new DB();
const ws = new WebSocket.Server({ port: 7777 });
const clients = [];



app.post(`/${config.server.route}`, (req, res) => {
    logger.info(req.query);
    updateControlInformation(req.query, res);
    sendResponce(res, 1, true);
});

const sendResponce = (res, result, status) => {
    res.set('Content-Type', 'application/json');
    res.json({ "result": result, "success": status });
};

const sendAll = (personalId, status, time, ) => {
    let ids = Object.keys(clients);
    ids.forEach((id) => {
        clients[id].send(JSON.stringify({ 'userStatus': { "personalId": personalId, "status": status, "time": time } }));
    });
}





async function getRange(startDate, endDate, type) {
    let fromDate = moment(startDate)
    let toDate = moment(endDate)
    let diff = toDate.diff(fromDate, 'day') + 1;
    let range = []
    for (let i = 0; i < diff; i++) {
        range.push(moment(startDate).add(i, type))
    }
    return range;
}

async function getRangeHoliday(holiday, type) {
    let b = holiday.split(',');
    let range = [];
    b.forEach(item => {
        if (item.includes('-')) {
            let sliceFromDate = `${moment().format('YYYY')}-${item.replace(/\./g, "-" ).slice(0, 5)}`
            let sliceToDate = `${moment().format('YYYY')}-${item.replace(/\./g, "-" ).slice(6,11)}`
            let fromDate = moment(sliceFromDate);
            let toDate = moment(sliceToDate);
            let diff = toDate.diff(fromDate, 'day') + 1;

            for (let i = 0; i < diff; i++) {
                range.push(moment(sliceFromDate).add(i, type))
            }

        } else {
            console.log(item.replace(/\./g, "-").slice(0, 5));
            range.push(moment(`${moment().format('YYYY')}-${item.replace(/\./g, "-" ).slice(0, 5)}`));
        }

    });
    return range;
}

async function start(data) {
    let workDay = [];
    for (let key in data) {
        if (data[key] == true && key != 'id_template') {
            console.log(`${key} ${data[key]}`);
            let date = moment(key, 'dd').format('YYYY-MM-DD');
            workDay.push(moment(date).weekday());
        }
    }
    return workDay;
};

async function searchWorkDayAndDayOff(reportRange, weekRange, holidayRange) {
    let workDay = [];
    let dayOff = [];


    function a(a1, a2) {
        return a1.filter(i => !a2.includes(i))
            .concat(a2.filter(i => !a1.includes(i)))
    };

    reportRange.forEach(item => {
        for (let i = 0; i < weekRange.length; i++) {
            if (weekRange[i] == moment(item).weekday()) {
                console.log(`  123123123   ${item}`);
                workDay.push(item);

            }
        }


    });


    let fromatHoliday = holidayRange.map(item => moment(item).format('YYYY-MM-DD'))
    let formatWorkDay = workDay.map(item => moment(item).format('YYYY-MM-DD'));
    console.log(fromatHoliday);
    console.log(formatWorkDay);
    fromatHoliday.map(element => {
        formatWorkDay.map((item, index, array) => {
            if (item == element) {
                formatWorkDay.splice(index, 1);

            }
        })
    })
    dayOff = a(reportRange, workDay);
    let formatDayOff = dayOff.map(item => moment(item).format('YYYY-MM-DD'))
    return { workDay: formatWorkDay, dayOff: formatDayOff, holiday: fromatHoliday };
};

async function getReport(w, getReportInfo) {
    let resultSelectHourTemplate = await dbSkud.selectHourTemplateByIdInDB(getReportInfo.idUser);
    if (resultSelectHourTemplate.length == 0 || resultSelectHourTemplate.id_template == 2) { return; }
    let resultСonvertWeek = await start(resultSelectHourTemplate);
    let resultConvertReportRange = await getRange(getReportInfo.reportWithTime, getReportInfo.reportBeforeTime, 'days');
    console.log(resultConvertReportRange);
    let resultConvertHolidayRange = await getRangeHoliday('01.01-01.05,02.23', 'days');
    let { workDay, dayOff, holiday } = await searchWorkDayAndDayOff(resultConvertReportRange, resultСonvertWeek, resultConvertHolidayRange);
    let modifyWorkDay = '';
    workDay.forEach(item => {
        modifyWorkDay += `'${item}',`
    })

    let finalyAccessInformFroUser = await dbSkud.selectUserAccessInformByIdAndDateInDB(modifyWorkDay.slice(0, -1), getReportInfo.idUser);
    w.send(JSON.stringify({
        report: {
            accessInfo: finalyAccessInformFroUser,
            userTemplate: resultSelectHourTemplate
        }
    }));
    //report(resultSelectHourTemplate, finalyAccessInformFroUser)
}

async function updateControlInformation(information, res) {
    try {
        let resultSearchOfficeIdBySN = await dbSkud.searchOfficeIdBySN(information.deviceKey);
        if (resultSearchOfficeIdBySN.length == 0) {
            sendResponce(res, 1, true);
            return;
        }

        let userId = resultSearchOfficeIdBySN + information.personId;
        let resultSearchIdStatusInDB = await dbSkud.searchIdStatusInDB(userId);
        let resultInsertControlInformationInDB = await dbSkud.insertControlInformationInDB(information, resultSearchIdStatusInDB, userId);
        let status;
        if (resultSearchIdStatusInDB.length == 0) {
            status = true;
        } else {
            status = (resultSearchIdStatusInDB.status) ? false : true;
        }
        sendAll(information.personId, status, moment.unix(information.time.slice(0, 10)).format("HH:mm:ss"));
        sendResponce(res, resultInsertControlInformationInDB.result, resultInsertControlInformationInDB.status);
    } catch (err) {
        logger.error(err);
    };

};


async function addOffice(mac, ip, pass, name) {
    try {
        let resultSearchOffice = await dbSkud.searchOfficeInformByMacInDB(mac);
        if (resultSearchOffice != '') {
            logger.info(`Такой офис уже был добавлен в базу ${mac}, ${ip}, ${pass}, ${name}`);
            return;
        }
        let resultSetUrlCallBack = await axios.setUrlCallback(ip, pass);
        logger.info(resultSetUrlCallBack);
        let resultInsertInDB = await dbSkud.insertOfficeInDB(mac, ip, pass, name);
        logger.info(resultInsertInDB);
    } catch (err) {
        logger.error(err);
    };

};

async function updateUsers() {
    try {
        let resultSearchOffice = await dbSkud.searchAllOfficeIdInDB();
        for (let office of resultSearchOffice) {
            let resultGetUsers = await axios.getUsers(office.ip, office.password);
            let resultSearchUserById = await dbSkud.searchUserByIdInDB(office.id, resultGetUsers);
            for (let user in resultSearchUserById) {
                if (resultSearchUserById[user].db.length == '0') {
                    dbSkud.insertUsersInDB(office.id, resultSearchUserById[user].device);
                } else {
                    dbSkud.updateUserInDB(office.id, resultSearchUserById[user].device)
                }
            }
        }
    } catch (err) {
        logger.error(err);
    };
};

async function selectAllUsersInDB(w) {
    let resultSearchAllUsers = await dbSkud.searchAllUsersInDB();
    w.send(JSON.stringify({ users: resultSearchAllUsers }));

}

async function selectUsersAccessInfoInDB(w) {
    let resultSearchUsersAccessInfo = await dbSkud.selectUsersAccessInfoInDB();
    w.send(resultSearchUsersAccessInfo[0]['select_user_access_info']);

}



async function updateUserInfoInTimeTemplate(templateInformation) {
    if (templateInformation.idTemplate == 'hour') {
        let resultCheckUserInHourTemplate = await dbSkud.checkIdUserInHourTemplate(templateInformation.idUser);
        let resultCheckUserInTimeTemplate = await dbSkud.checkIdUserInTimeTemplate(templateInformation.idUser);
        if (resultCheckUserInHourTemplate.length == 0 && resultCheckUserInTimeTemplate.length == 0) {


            let resultInsertUserInfoToHourTemplate = await dbSkud.insertUserInfoToHourTemplate('1', templateInformation);
            let resultUpdateUserInfoInUsers = await dbSkud.updateUserInfoInUsers('1', templateInformation.idUser);
        } else if (resultCheckUserInTimeTemplate.length != 0) {
            let resultDeleteUserInfoInTemplate = await dbSkud.deleteUserInfoInTemplate('time', templateInformation.idUser);
            let resultInsertUserInfoToHourTemplate = await dbSkud.insertUserInfoToHourTemplate('1', templateInformation);
            let resultUpdateUserInfoInUsers = await dbSkud.updateUserInfoInUsers('1', templateInformation.idUser);
        } else if (resultCheckUserInHourTemplate.length != 0) {
            let resultUpdateUserInfoInHourTemplate = await dbSkud.updateUserInfoInHourTemplate(templateInformation);
        }

    } else if (templateInformation.idTemplate == 'time') {
        let resultCheckUserInHourTemplate = await dbSkud.checkIdUserInHourTemplate(templateInformation.idUser);
        let resultCheckUserInTimeTemplate = await dbSkud.checkIdUserInTimeTemplate(templateInformation.idUser);

        if (resultCheckUserInHourTemplate.length == 0 && resultCheckUserInTimeTemplate.length == 0) {
            console.log(resultCheckUserInHourTemplate);
            console.log(resultCheckUserInTimeTemplate);
            let resultInsertUserInfoToTimeTemplate = await dbSkud.insertUserInfoToTimeTemplate('2', templateInformation);
            let resultUpdateUserInfoInUsers = await dbSkud.updateUserInfoInUsers('2', templateInformation.idUser);
        } else if (resultCheckUserInHourTemplate.length != 0) {


            let resultDeleteUserInfoInTemplate = await dbSkud.deleteUserInfoInTemplate('hour', templateInformation.idUser);
            let resultInsertUserInfoToTimeTemplate = await dbSkud.insertUserInfoToTimeTemplate('2', templateInformation);
            let resultUpdateUserInfoInUsers = await dbSkud.updateUserInfoInUsers('2', templateInformation.idUser);
        } else if (resultCheckUserInTimeTemplate.length != 0) {


            let resultUpdateUserInfoInTimeTemplate = await dbSkud.updateUserInfoInTimeTemplate(templateInformation);
        }
    }
}

ws.on('connection', function connection(w) {
    let id = Math.random();
    clients[id] = w;
    console.log("новое соединение " + id);

    w.on('message', function(message) {
        let data = JSON.parse(message);
        console.log(data);
        if (data.office) {
            console.log(data.office);
            addOffice(data.office.sn, data.office.ip, data.office.pass, data.office.name);
        } else if (data.usersGet) {
            selectAllUsersInDB(w);
        } else if (data.hourTemplate) {
            updateUserInfoInTimeTemplate(data.hourTemplate);
            //console.log(data.hourTemplate);
        } else if (data.usersAccess) {
            selectUsersAccessInfoInDB(w)
        } else if (data.report) {
            getReport(w, data.report);
        }
    });

    w.on('close', function() {
        console.log(`Close ${id}`);
        delete clients[id];
    });

});

app.listen(config.server.port, config.server.host);

//setTimeout(updateControlInformation, 20000, a);
//setTimeout(addOffice, 6000, '84E0F4251DA31590', '192.168.88.119:8090', '111111', 'Home');
setInterval(updateUsers, 10000);