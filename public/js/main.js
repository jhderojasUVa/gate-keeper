const ws = new WebSocket('ws://localhost:9001');

const statusDiv = document.getElementById('status');
const logDiv = document.getElementById('log');

ws.onopen = () => {
    statusDiv.innerHTML = 'Connected to the WebSocket';
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    statusDiv.innerHTML = `Last message type: ${message.typeMessage}`;
    logDiv.innerHTML += `<p>${event.data}</p>`;
};

ws.onclose = () => {
    statusDiv.innerHTML = 'Disconnected from the WebSocket';
};