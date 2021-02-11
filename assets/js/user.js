let users = document.getElementById("usersHour");
let time = document.getElementById("usersTime");
let socket;

// let hourTemplate = document.getElementById("hour");
// hourTemplate.addEventListener('submit', (event) => {
//     // let value = select.options[select.selectedIndex].value;
//     console.log(event);
// });


let select = document.getElementById("selectUserTemplate");
select.addEventListener('change', (event) => {
    let value = select.options[select.selectedIndex].value;
    if (value == '1') {
        document.getElementById("hour").removeAttribute('style');
        document.getElementById("time").style.display = 'none';
    } else {
        document.getElementById("time").removeAttribute('style');
        document.getElementById("hour").style.display = 'none';
    }
});

const hourForm = document.getElementById('formHour');
hourForm.addEventListener('submit', (event) => {

    event.preventDefault();
    let userId = document.getElementById("userId").options;
    userId = document.getElementById("userId").options[userId.selectedIndex].id;
    let withStartWorkTime = document.getElementById('withStartWorkTime').value;
    let beforeStartWorkTime = document.getElementById('beforeStartWorkTime').value;
    let withEndWorkTime = document.getElementById('withEndWorkTime').value;
    let beforeEndWorkTime = document.getElementById('beforeEndWorkTime').value;
    let mon = document.getElementById("Mon").checked
    let tue = document.getElementById("Tue").checked
    let wed = document.getElementById("Wed").checked
    let thu = document.getElementById("Thu").checked
    let fri = document.getElementById("Fri").checked
    let sat = document.getElementById("Sat").checked
    let sun = document.getElementById("Sun").checked
    let inputHoliday = document.getElementById('inputHoliday').value;
    let selectCloseWorkDayBeforeTime = document.getElementById("selectCloseWorkDayBeforeTime").options.selectedIndex;
    let startBreakTime = document.getElementById('startBreakTime').value;
    let endBreakTime = document.getElementById('endBreakTime').value;
    socket.send(JSON.stringify({ 'hourTemplate': { idUser: userId, idTemplate: "hour", withStartWorkTime: withStartWorkTime, beforeStartWorkTime: beforeStartWorkTime, withEndWorkTime: withEndWorkTime, beforeEndWorkTime: beforeEndWorkTime, mon: mon, tue: tue, wed: wed, thu: thu, fri: fri, sat: sat, sun: sun, inputHoliday: inputHoliday, selectCloseWorkDayBeforeTime: selectCloseWorkDayBeforeTime, startBreakTime: startBreakTime, endBreakTime: endBreakTime } }));
    let frm = document.getElementsByName('contact-form-hour')[0];
    frm.reset();
});

const timeForm = document.getElementById('formTime');
timeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    let userId = document.getElementById("userId").options;
    userId = document.getElementById("userId").options[userId.selectedIndex].id;

    let hoursWorked = document.getElementById('hoursWorked').value;
    let mon = document.getElementById("MonTime").checked
    let tue = document.getElementById("TueTime").checked
    let wed = document.getElementById("WedTime").checked
    let thu = document.getElementById("ThuTime").checked
    let fri = document.getElementById("FriTime").checked
    let sat = document.getElementById("SatTime").checked
    let sun = document.getElementById("SunTime").checked
    let inputHoliday = document.getElementById('inputHolidayTime').value;
    let selectCloseWorkDayBeforeTime = document.getElementById("selectCloseWorkDayBefore").options.selectedIndex;
    let startBreakTime = document.getElementById('startBreak').value;
    let endBreakTime = document.getElementById('endBreak').value;
    socket.send(JSON.stringify({ 'hourTemplate': { idUser: userId, idTemplate: "time", hoursWorked: hoursWorked, mon: mon, tue: tue, wed: wed, thu: thu, fri: fri, sat: sat, sun: sun, inputHoliday: inputHoliday, selectCloseWorkDayBeforeTime: selectCloseWorkDayBeforeTime, startBreakTime: startBreakTime, endBreakTime: endBreakTime } }));
    let frm = document.getElementsByName('contact-form-time')[0];
    frm.reset();

});

const socketMessageListener = (event) => {
    let usersList = JSON.parse(event.data);
    console.log(usersList.users);
    setUsers(usersList.users);

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


const setUsers = (usersInformation) => {
    console.log(usersInformation);
    let html = `<div class="form-group">
    <label for="exampleFormControlSelect1">ФИО</label>
    <select class="form-control form-control-lg" id="userId">`
    for (let i = 0; i < usersInformation.length; i++) {
        html += `<option id=${usersInformation[i].id}>${usersInformation[i].name}  -  ${usersInformation[i].office_name}</option>`
    }
    html += `</select>
    </div>`
    users.innerHTML = html;
    time.innerHTML = html;

}