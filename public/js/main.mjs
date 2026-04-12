// Get the WebSocket port from the server
export const getWsPort = async () => {
    try {
        const response = await fetch('/ws-port');
        const data = await response.json();
        return data.port;
    } catch (e) {
        console.error('Failed to get ws port', e);
        return 8080; // Fallback or handle later
    }
};

export const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }) + '.' + now.getMilliseconds().toString().padStart(3, '0');
};

export const createLogElement = (messageObj) => {
    const logEl = document.createElement('div');
    
    // Check if error
    const isError = messageObj.success === false || messageObj.type === 'ERROR' || messageObj.type === 'FATAL_ERROR';
    const msgType = messageObj.type || 'UNKNOWN';
    let dataContent = '';

    if (typeof messageObj.data === 'object') {
        dataContent = JSON.stringify(messageObj.data, null, 2);
    } else {
        dataContent = messageObj.data || '';
    }
    
    logEl.className = `log-entry ${isError ? 'log-error' : 'log-info'}`;
    
    logEl.innerHTML = `
        <div class="log-meta">
            <span class="log-time">[${formatTime()}]</span>
            <span class="log-pill ${isError ? 'pill-error' : 'pill-success'}">${msgType}</span>
        </div>
        <div class="log-content">
            ${isError ? '<strong>⚠️ ' + (messageObj.success === false ? 'Action Failed:<br/>' : 'Error:<br/>') + '</strong>' : ''}
            <span>${dataContent}</span>
        </div>
    `;
    return logEl;
};

// Connect to the WebSocket
export const connectToWs = async () => {
    const port = await getWsPort();
    const wsUrl = `ws://${window.location.hostname}:${port}`;
    let ws;
    
    const wsStatusDiv = document.getElementById('ws-status');
    const wsStatusText = wsStatusDiv.querySelector('.ws-text');
    const logWindow = document.getElementById('log-window');
    const msgTypeBadge = document.getElementById('msg-type');
    const commitStatusDiv = document.getElementById('commit-status');

    const updateWsStatus = (status) => {
        wsStatusDiv.className = `ws-badge ${status}`;
        if (status === 'connected') wsStatusText.textContent = 'Connected (Live)';
        if (status === 'disconnected') wsStatusText.textContent = 'Disconnected';
        if (status === 'connecting') wsStatusText.textContent = 'Connecting...';
    };

    const initReconnect = () => {
        updateWsStatus('disconnected');
        setTimeout(() => connectToWs(), 5000);
    };

    try {
        ws = new WebSocket(wsUrl);
    } catch {
        initReconnect();
        return;
    }

    // Handle the connection opening
    ws.onopen = () => {
        updateWsStatus('connected');
        msgTypeBadge.textContent = 'Listening...';
        msgTypeBadge.className = 'badge-type live';
        // Check commit right after connection
        updateCommitStatus(commitStatusDiv);
    };

    // Handle messages from the server
    ws.onmessage = async (event) => {
        try {
            const message = JSON.parse(event.data);
            
            msgTypeBadge.textContent = `Last Event: ${message.type || 'UNKNOWN'}`;
            msgTypeBadge.className = 'badge-type active-pulse';
            setTimeout(() => {
                if (msgTypeBadge.className.includes('active-pulse')) {
                    msgTypeBadge.className = 'badge-type live';
                }
            }, 1000);

            // Handle STATUS_UPDATE messages specially
            if (message.type === 'STATUS_UPDATE' && message.data) {
                updateCommitStatus(commitStatusDiv, message.data.canCommit);
                // Also log the scripts if available
                if (message.data.scripts) {
                    message.data.scripts.forEach(script => {
                        const scriptLog = createLogElement({
                            success: script.result ? true : false,
                            type: 'SCRIPT_RESULT',
                            data: `${script.name}: ${script.result || 'Failed'}`
                        });
                        logWindow.appendChild(scriptLog);
                    });
                    logWindow.scrollTop = logWindow.scrollHeight;
                }
            } else {
                // For other messages, create log entry
                const logEl = createLogElement(message);
                logWindow.appendChild(logEl);
                // auto-scroll
                logWindow.scrollTop = logWindow.scrollHeight;

                // After processing the message, check if user can commit again
                await updateCommitStatus(commitStatusDiv);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            // Non-JSON or other error
            const errEl = createLogElement({ success: false, type: 'PARSE_ERROR', data: 'Failed to parse message: ' + event.data });
            logWindow.appendChild(errEl);
            logWindow.scrollTop = logWindow.scrollHeight;
        }
    };

    ws.onclose = () => {
        initReconnect();
        msgTypeBadge.textContent = 'Offline';
        msgTypeBadge.className = 'badge-type offline';
    };
    
    ws.onerror = () => {
        ws.close();
    };
};

// Check if user can commit and update the UI
export const updateCommitStatus = async (commitStatusDiv, canCommitOverride) => {
    const titleObj = document.getElementById('commit-status-title');
    const descObj = document.getElementById('commit-status-desc');

    try {
        let canCommit;
        if (canCommitOverride !== undefined) {
            canCommit = canCommitOverride;
        } else {
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
            canCommit = result.cancommit;
        }
        
        if (canCommit) {
            commitStatusDiv.className = 'commit-status card success';
            titleObj.textContent = 'Ready to Commit';
            descObj.textContent = 'All checks passed. You can commit safely.';
        } else {
            commitStatusDiv.className = 'commit-status card error';
            titleObj.textContent = 'Commit Blocked';
            descObj.textContent = 'Gates are currently closed. Check logs.';
        }
    } catch (error) {
        console.error('Error checking commit status:', error);
        commitStatusDiv.className = 'commit-status card error';
        titleObj.textContent = 'Status Unknown';
        descObj.textContent = 'Failed to verify commit permission.';
    }
};

// Start the connection, but skip in test environment
if (typeof window !== 'undefined' && typeof document !== 'undefined' && !(typeof process !== 'undefined' && process.env.VITEST)) {
    connectToWs();
}