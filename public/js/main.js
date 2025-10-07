// Get the WebSocket port from the server
const getWsPort = async () => {
    const response = await fetch('/ws-port');
    const data = await response.json();
    return data.port;
};

// Connect to the WebSocket
const connectToWs = async () => {
    const port = await getWsPort();
    const ws = new WebSocket(`ws://localhost:${port}`);

    const statusDiv = document.getElementById('status');
    const logDiv = document.getElementById('log');

    // Handle the connection opening
    ws.onopen = () => {
        statusDiv.innerHTML = 'Connected to the WebSocket';
    };

    // Handle messages from the server
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        statusDiv.innerHTML = `Last message type: ${message.typeMessage}`;
        logDiv.innerHTML += `<p>${event.data}</p>`;
    };

    // Handle the connection closing
    ws.onclose = () => {
        statusDiv.innerHTML = 'Disconnected from the WebSocket';
    };
};

// Start the connection
connectToWs();