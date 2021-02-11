let socket;
let userTable = document.getElementById('userTable');

const userTemplate = {
    '1': 'Шаблон по часам',
    '2': 'Шаблон по отработанному времени'
}

let statusClass = {
    "true": "success",
    "false": "danger",
};

let workClass = {
    "true": "На работе",
    "false": "Отсутствует",
};

const socketMessageListener = (event) => {
    console.log(event);
    let data = JSON.parse(event.data);
    if (data.userStatus) {
        modifyStatus(data.userStatus);
    } else {
        setUsers(data);
    }
    // let usersAccessInfo = JSON.parse(event.data);
    // console.log(usersAccessInfo);
    // setUsers(usersAccessInfo);

};

const socketOpenListener = (event) => {
    console.log("Соединение установлено.");
    socket.send(JSON.stringify({ 'usersAccess': 'get' }));

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
    let html = '';
    for (let key in usersInformation) {
        if (usersInformation[key][0] != null) {
            html += `<tr>
            <td class="py-1">
                <img src="images/faces-clipart/pic-1.png" alt="image" />
            </td>
            <td> ${usersInformation[key][1].name} </td>
            <td>
                <label class="badge badge-${statusClass[usersInformation[key][0].status]}" id="lable-${usersInformation[key][1].id_skud}" style="font-size: 90%;">${workClass[usersInformation[key][0].status]}</label>
            </td>
            <td> ${usersInformation[key][1].office_name} </td>
            <td> ${userTemplate[usersInformation[key][1].id_template]} </td>
            <td id="transit-time-${usersInformation[key][1].id_skud}"> ${usersInformation[key][0].time} </td>
        </tr>`
        } else {
            html += `<tr>
            <td class="py-1">
                <img src="images/faces-clipart/pic-1.png" alt="image" />
            </td>
            <td> ${usersInformation[key][1].name} </td>
            <td>
                <label class="badge badge-warning" style="font-size: 90%;">Неизвестно</label>
            </td>
            <td> ${usersInformation[key][1].office_name} </td>
            <td> ${userTemplate[usersInformation[key][1].id_template]} </td>
            <td></td>
        </tr>`
        }
    }

    userTable.innerHTML = html;
};

const modifyStatus = ({ personalId, status, time }) => {
    let personalIdTable = document.getElementById(`lable-${personalId}`);
    let personalTime = document.getElementById(`transit-time-${personalId}`);

    personalIdTable.removeAttribute('class');
    personalIdTable.textContent = workClass[status];
    personalIdTable.setAttribute('class', `badge badge-${statusClass[status]}`);
    personalTime.textContent = time;

}