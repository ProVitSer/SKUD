const qs = require('qs'),
    moment = require('moment'),
    logger = require("../logger/logger"),
    config = require("../config/config"),
    promise = require('bluebird'),
    initOptions = {
        promiseLib: promise
    },
    pgp = require("pg-promise")(initOptions),
    db = pgp(`postgres://${config.pg.username}:${config.pg.secret}@${config.pg.host}/${config.pg.db}`);

class DB {
    constructor() {

    }

    async searchOfficeIdBySN(sn) {
        let resultSearchOfficeId = await db.any(`select id from public.office where serial_number = '${sn}'`)
            .then(
                result => {
                    if (result.length == 0) {
                        logger.info(`Нет такого офиса ${information.deviceKey}`);
                        return [];
                    } else {
                        return result[0].id;
                    }

                }
            )
            .catch(error => {
                logger.error(error);
            });
        return resultSearchOfficeId;
    };

    async searchIdStatusInDB(userId) {
        let searchIdStatusInDB = await db.any(`SELECT id,status FROM public.access_control where user_id = ${userId} ORDER BY id DESC LIMIT 1`)
            .then(
                result => {
                    if (result.length == 0) {
                        return userId;
                    } else {
                        return result[0];
                    }

                }
            )
            .catch(error => {
                logger.error(error);
            });
        return searchIdStatusInDB;
    };

    async insertControlInformationInDB(information, userInformation, userId) {
        console.log(information, userInformation, userId)
        let status;
        if (userInformation.length == 0) {
            status = true;
        } else {
            status = (userInformation.status) ? false : true;
        }
        let resultInsertInDB = await db.any(`INSERT INTO public.access_control(user_id, date, "time", status) VALUES ( ${userId}, '${moment.unix(information.time.slice(0,10)).format("YYYY-MM-DD")}', '${moment.unix(information.time.slice(0,10)).format("HH:mm:ss")}', ${status});`)
            .then(
                result => {
                    return { "result": 1, "success": true }
                }
            )
            .catch(error => {
                logger.error(error);
            });
        return resultInsertInDB;
    };

    async searchOfficeInformByMacInDB(mac) {
        const resultSelectInDB = await db.any(`SELECT * from public.office where serial_number = '${mac}';`)
            .then(
                result => {
                    return result;
                }
            )
            .catch(error => {
                logger.error(error);
            });
        return resultSelectInDB;
    };

    async insertOfficeInDB(mac, ip, pass, name) {
        let resultInsertInDB = await db.any(`INSERT INTO office("ip","serial_number", "name","password") VALUES ('${ip}','${mac}','${name}','${pass}')`)
            .then(
                result => {
                    return result;
                }
            )
            .catch(error => {
                logger.error(error);
            });
        return resultInsertInDB;
    };

    async searchUserByIdInDB(officeId, users) {
        let resultSearchUserById = {};
        for (let user of users) {
            let result = await db.any(`select * from public.users where id = ${Number(officeId + user.id)}`)
                .then(
                    result => {
                        return result;
                    }
                )
                .catch(error => {
                    logger.error(error);
                });
            resultSearchUserById[user.id] = {
                "device": user,
                "db": result
            }
        }
        return resultSearchUserById;
    };

    async insertUsersInDB(officeId, user) {
        db.any(`INSERT INTO public.users(id,id_skud, id_office, id_template, id_number, id_card_number, name, phone, tag, is_active)
             VALUES (${Number(officeId + user.id)},${user.id},${Number(officeId)},null,${Number(user.iDNumber)}, ${Number(user.idcardNum)}, '${user.name}','${user.phone}', '${user.tag}', true);`)
            .then(
                result => {
                    logger.info(`Добавлен новый пользователь ${officeId} ${user}`);
                }
            )
            .catch(error => {
                logger.error(error);
            });
    };

    async updateUserInDB(officeId, user) {
        let updateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        db.any(`UPDATE public.users SET id_number=${Number(user.iDNumber)}, id_card_number=${Number(user.idcardNum)}, name='${user.name}', phone='${user.phone}', tag='${user.tag}',last_update='${updateTime}' where id = ${Number(officeId + user.id)}`)
            .then(
                result => {
                    logger.info(`Обновлены данные по пользователю ${officeId} ${user}`);
                }
            )
            .catch(error => {
                logger.error(error);
            });

    };

    async searchAllOfficeIdInDB() {
        let result = await db.any(`SELECT * from public.office`)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };

    async searchAllUsersInDB() {
        //let result = await db.any(`SELECT * from public.users`)
        let result = await db.any(`SELECT users.id, id_skud, id_office, id_template, id_number, id_card_number, users.name, phone, tag, is_active, last_update, last_template_update,office.id as office_id,office.name as office_name
        FROM public.users, public.office where users.id_office = office.id`)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };

    async checkIdUserInHourTemplate(userId) {
        console.log(userId);
        let result = await db.any(`SELECT * from public.hour_template where id_user = ${userId}`)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };

    async checkIdUserInTimeTemplate(userId) {
        let result = await db.any(`SELECT * from public.time_template where id_user = ${userId}`)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };

    async updateUserInfoInTimeTemplate(...params) {
        let result = await db.any(`UPDATE public.time_template
        SET mon=${params[0].mon}, tue=${params[0].tue}, wed=${params[0].wed}, thu=${params[0].thu}, fri=${params[0].fri}, sat=${params[0].sat}, sun=${params[0].sun}, holiday='${params[0].inputHoliday}', close_work='${params[0].selectCloseWorkDayBeforeTime}', start_break='${params[0].startBreakTime}', end_break='${params[0].endBreakTime}', '${params[0].hoursWorked}'
        WHERE id_user = ${params[0].idUser};`)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };

    async updateUserInfoInHourTemplate(...params) {
        let result = await db.any(`UPDATE public.hour_template
        SET with_start_work_time='${params[0].withStartWorkTime}', before_start_work_time='${params[0].beforeStartWorkTime}', with_end_work_time='${params[0].withEndWorkTime}', before_end_work_time='${params[0].beforeEndWorkTime}', mon=${params[0].mon}, tue=${params[0].tue}, wed=${params[0].wed}, thu=${params[0].thu}, fri=${params[0].fri}, sat=${params[0].sat}, sun=${params[0].sun}, holiday='${params[0].inputHoliday}', close_work='${params[0].selectCloseWorkDayBeforeTime}', start_break='${params[0].startBreakTime}', end_break='${params[0].endBreakTime}'
        WHERE id_user = ${params[0].idUser};`)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };

    async insertUserInfoToTimeTemplate(idTemplate, ...params) {
        let result = await db.any(`INSERT INTO public.time_template(
            id_template, id_user, mon, tue, wed, thu, fri, sat, sun, holiday, close_work, start_break, end_break,hours_worked)
             VALUES (${idTemplate}, ${params[0].idUser}, ${params[0].mon}, ${params[0].tue}, ${params[0].wed}, ${params[0].thu}, ${params[0].fri}, ${params[0].sat}, ${params[0].sun}, '${params[0].inputHoliday}', ${params[0].selectCloseWorkDayBeforeTime}, '${params[0].startBreakTime}', '${params[0].endBreakTime}', '${params[0].hoursWorked}');`)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };

    async insertUserInfoToHourTemplate(idTemplate, ...params) {
        let result = await db.any(`INSERT INTO public.hour_template(
            id_template, id_user, with_start_work_time, before_start_work_time, with_end_work_time, before_end_work_time, mon, tue, wed, thu, fri, sat, sun, holiday, close_work, start_break, end_break)
             VALUES (${idTemplate}, ${params[0].idUser}, '${params[0].withStartWorkTime}', '${params[0].beforeStartWorkTime}', '${params[0].withEndWorkTime}', '${params[0].beforeEndWorkTime}', ${params[0].mon}, ${params[0].tue}, ${params[0].wed}, ${params[0].thu}, ${params[0].fri}, ${params[0].sat}, ${params[0].sun}, '${params[0].inputHoliday}', ${params[0].selectCloseWorkDayBeforeTime}, '${params[0].startBreakTime}', '${params[0].endBreakTime}');
           `)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };

    async deleteUserInfoInTemplate(table, userId) {
        let result = await db.any(`DELETE FROM public.${table}_template WHERE id_user = ${userId};`)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };

    async updateUserInfoInUsers(templateId, userId) {
        let result = await db.any(`UPDATE public.users SET id_template = ${templateId}, last_template_update = '${moment().format('YYYY-MM-DD HH:mm:ss')}'   WHERE id = ${userId};`)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };


    async selectUsersAccessInfoInDB() {
        let result = await db.any(`select select_user_access_info();`)
            .then(
                result => {
                    logger.info(result)
                    return result;
                }
            )
            .catch(err => {
                logger.error(err);
            });
        return result;
    };




    async selectUserAccessInformByIdAndDateInDB(range, userId) {
        console.log(range, userId);
        let resultSelectUserAccessInform = await db.any(`select info(ARRAY [${range}],${userId})`)
            .then(
                result => {
                    if (result.length == 0) {
                        return [];
                    } else {
                        return result;
                    }
                }
            )
            .catch(error => {
                console.log(error);
            });
        return resultSelectUserAccessInform;
    };

    async selectHourTemplateByIdInDB(userId) {
        let resultSelectHourTemplate = await db.any(`select * from public.hour_template where id_user = ${userId}`)
            .then(
                result => {
                    if (result.length == 0) {
                        return [];
                    } else {
                        return result[0];
                    }
                }
            )
            .catch(error => {
                console.log(error);
            });
        return resultSelectHourTemplate;

    }



}

module.exports = DB;