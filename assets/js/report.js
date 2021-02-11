let users = document.getElementById("usersReport");
let userFinalyReport = document.getElementById("userFinalyReport");
let textReport = document.getElementById("h4Text");
textReport.innerHTML = "";
let userReport;

let statusInfo = {
    true: "Пришел",
    false: "Ушел"
}

let textStatusIncoming = {
    true: 'Пришел вовремя',
    false: 'Опоздал на работу'
}

let textStatusOutgoing = {
    true: 'Ушел вовремя',
    false: 'Ушел раньше'
}

let statusColor = {
    true: '#18a809',
    false: '#e80707'
}


const formReport = document.getElementById('formReport');
formReport.addEventListener('submit', (event) => {
    event.preventDefault();
    let sel = document.getElementById("userId").options;
    let userId = document.getElementById("userId").options[sel.selectedIndex].id;
    userReport = document.getElementById("userId").options[sel.selectedIndex].text;
    let reportWithTime = document.getElementById('reportWithTime').value;
    let reportBeforeTime = document.getElementById('reportBeforeTime').value;
    textReport.innerHTML = "";
    socket.send(JSON.stringify({ 'report': { idUser: userId, reportWithTime: reportWithTime, reportBeforeTime: reportBeforeTime } }));
    let frm = document.getElementsByName('contact-form-report')[0];
    frm.reset();

});

let socket;
const socketMessageListener = (event) => {
    console.log(event);
    let data = JSON.parse(event.data);
    if (data.users) {
        setUsers(data.users)
    } else {
        console.log(`asdjahsdkljhasdkjhas ${event}`);
        let accessInfo = JSON.parse(data.report.accessInfo[0]['info']);
        report(data.report.userTemplate, accessInfo);
        // console.log(data.report.accessInfo[0]['info'], data.report.userTemplate);
    }

};

const socketOpenListener = (event) => {
    console.log("Соединение установлено.");
    socket.send(JSON.stringify({ 'usersGet': 'get' }));

};

const socketErrorListener = (event) => {
    console.log("Ошибка " + error.message);
};

const socketCloseListener = (event) => {
    if (socket) {
        console.error('Disconnected.');
    }
    socket = new WebSocket("ws://localhost:7777");
    socket.addEventListener('open', socketOpenListener);
    socket.addEventListener('message', socketMessageListener);
    socket.addEventListener('error', socketErrorListener);
    socket.addEventListener('close', socketCloseListener);
};

socketCloseListener();

// <select multiple size="1" class="form-control form-control-lg" id="userId">

const setUsers = (usersInformation) => {
    let html = `<div class="form-group" style="text-align: center">
    <label>ФИО</label>

    <select class="form-control form-control-lg" id="userId">
    <option value="" disabled selected hidden>Выберите</option>`
    for (let i = 0; i < usersInformation.length; i++) {
        html += `<option id=${usersInformation[i].id}>${usersInformation[i].name}  -  ${usersInformation[i].office_name}</option>`
    }
    html += `</select>
    </div>`
    users.innerHTML = html;
};



const report = (userTemplate, userAccessControlInfo) => {
    textReport.innerHTML = `Отчет по сотруднику ${userReport}`;
    let data = userAccessControlInfo;
    let html = `<tbody>`
    for (let key in data) {
        if (data[key][0].length == 0) {
            html += `
        <tr>
            <td>${key}</td>
            <td></td>
            <td></td>
            <td style="background-color: #e80707">Отсутствовал на работе</td>
        </tr>`
        } else {
            let startIndex = 1;
            let endIndex = data[key][0].length - 2;
            let fisrtPassage = data[key][0][0].time.slice(0, 5);
            let lastPassage = data[key][0][data[key][0].length - 1].time.slice(0, 5);
            let tdTextStatusIncoming, tdTextStatusOutgoing, tdStyleIncoming, tdStyleOutgoing;

            console.log(`${fisrtPassage}  ${userTemplate.before_start_work_time.slice(0, 5)}`);
            console.log(`${lastPassage}  ${userTemplate.with_end_work_time.slice(0, 5)}`);





            if (fisrtPassage > '00:00' && fisrtPassage <= userTemplate.before_start_work_time.slice(0, 5)) {
                tdTextStatusIncoming = textStatusIncoming[true];
                tdStyleIncoming = statusColor[true];
            } else {
                tdTextStatusIncoming = textStatusIncoming[false];
                tdStyleIncoming = statusColor[false];
            }

            if (lastPassage >= userTemplate.with_end_work_time.slice(0, 5) && lastPassage < '23:00') {
                tdTextStatusOutgoing = textStatusOutgoing[true];
                tdStyleOutgoing = statusColor[true];

            } else {
                tdTextStatusOutgoing = textStatusOutgoing[false];
                tdStyleOutgoing = statusColor[false];

            }

            console.log(tdTextStatusIncoming, tdTextStatusOutgoing)
            html += `
            <tr>
                <td>${key}</td>
                <td>${userTemplate.with_start_work_time}</td>
                <td>${userTemplate.before_start_work_time}</td>
                <td style="background-color: ${tdStyleIncoming}">${tdTextStatusIncoming}</td>
            </tr>`

            while (startIndex < endIndex) {
                html += `<tr>
                  <td></td>
                  <td>${data[key][0][startIndex].time}</td>
                  <td>${data[key][0][startIndex + 1].time}</td>
                  <td></td>
              </tr>`
                startIndex = startIndex + 2;
            }

            html += `
            <tr>
                <td></td>
                <td>${userTemplate.with_end_work_time}</td>
                <td>${userTemplate.before_end_work_time}</td>
                <td style="background-color: ${tdStyleOutgoing}">${tdTextStatusOutgoing}</td>
            </tr>`


        }
    }
    html += `</tbody>`
    userFinalyReport.innerHTML = html;
};