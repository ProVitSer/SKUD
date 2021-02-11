let socket;

const socketMessageListener = (event) => {
    console.log(event);
};

const socketOpenListener = (event) => {
    console.log("Соединение установлено.");
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

const officeForm = document.getElementById('office');
officeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    let inputForm = document.getElementsByTagName("input");
    socket.send(JSON.stringify({ 'office': { ip: inputForm[0].value, sn: inputForm[1].value, pass: inputForm[2].value, name: inputForm[3].value } }));
    for (let i = 0; i < 4; i++) {
        document.getElementsByTagName("input")[i].value = "";
    }
});