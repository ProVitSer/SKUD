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

// function change() {
//     select = document.getElementById("select");
//     value = select.options[select.selectedIndex].value;
//     if (value == '1') {
//         document.getElementById("hour").removeAttribute('style');
//         document.getElementById("time").style.display = 'none';
//         console.log('asdasdsdf');
//     } else {
//         document.getElementById("time").removeAttribute('style');
//         document.getElementById("hour").style.display = 'none';
//         console.log('23423423');
//     }

// }