let socket = new WebSocket(`ws://${location.host}`);

let shouldRebuild = false;
let pageActive = true;
const setState = (active) => {
    pageActive = active;
    if (active && shouldRebuild) {
        socket.send("rebuild");
        shouldRebuild = false;
    }
};

document.addEventListener("visibilitychange", setState(!document.hidden), false);
window.addEventListener("focus", () => setState(true), false);
window.addEventListener("blur", () => setState(false), false);

// socket.onopen = () => console.log("[open] Соединение установлено");
// socket.onclose = () => console.log("[close] Соединение закрыто");
socket.onerror = () => console.error("[error] вебсокет сломался");
socket.onmessage = (evt) => {
    if (evt.data === "refresh") document.location.reload();
    if (evt.data === "changed") {
        if (pageActive) socket.send("rebuild");
        shouldRebuild = !pageActive;
    }
};

// socket.onmessage = function (event) {
//     alert(`[message] Данные получены с сервера: ${event.data}`);
// };

// socket.onclose = function (event) {
//     if (event.wasClean) {
//         alert(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
//     } else {
//         // например, сервер убил процесс или сеть недоступна
//         // обычно в этом случае event.code 1006
//         alert("[close] Соединение прервано");
//     }
// };

// socket.onerror = function (error) {
//     alert(`[error] ${error.message}`);
// };

// // (async function () {
// //     while (true) {
// //         await new Promise((res) => setTimeout(res, 500));
// //         const res = await fetch("http://localhost:3000/refreshPage");
// //         if (res.status === 301) document.location.reload();
// //     }
// // })();
