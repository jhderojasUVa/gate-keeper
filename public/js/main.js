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
    const commitStatusDiv = document.getElementById('commit-status');

    // Handle the connection opening
    ws.onopen = () => {
        statusDiv.innerHTML = 'Connected to the WebSocket';
    };

    // Handle messages from the server
    ws.onmessage = async (event) => {
        try {
            const message = JSON.parse(event.data);
            statusDiv.innerHTML = `Last message type: ${message.typeMessage}`;
            logDiv.innerHTML += `<p>${event.data}</p>`;

            // After processing the message, check if user can commit
            await updateCommitStatus(commitStatusDiv);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    };

    // Handle the connection closing
    ws.onclose = () => {
        statusDiv.innerHTML = 'Disconnected from the WebSocket';
    };
};

// Check if user can commit and update the UI
const updateCommitStatus = async (commitStatusDiv) => {
    try {
        const response = await fetch('/cancommit', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        commitStatusDiv.textContent =
            result.canCommit ? 'You can commit' : 'Cannot commit';
        commitStatusDiv.className = result.canCommit
            ? 'can-commit'
            : 'cannot-commit';
    } catch (error) {
        console.error('Error checking commit status:', error);
        commitStatusDiv.textContent = 'Error checking status';
        commitStatusDiv.className = 'cannot-commit';
    }
};

// Start the connection
connectToWs();