async function updateStatus(serviceName) {
    const status = await window.electronAPI.getStatus(serviceName);
    const ring = document.getElementById(`ring-${serviceName}`);
    const text = document.getElementById(`status-${serviceName}`);
    const info = document.getElementById(`info-${serviceName}`);
    const buttons = document.querySelectorAll(`#card-${serviceName} .action-btn`);

    ring.classList.remove('active', 'inactive');
    
    if (status === 'active') {
        ring.classList.add('active');
        text.innerText = 'ACTIVE';
        text.style.fontSize = '0.75rem';
        info.innerText = 'Running smoothly | Uptime: Healthy';
        // Enable buttons
        buttons.forEach(btn => btn.disabled = false);
    } else if (status === 'not-installed') {
        ring.classList.add('inactive');
        text.innerText = 'NOT\nINSTALLED';
        text.style.fontSize = '0.6rem';
        text.style.lineHeight = '1.1';
        info.innerText = `Install ${serviceName}-gateway service`;
        // Disable buttons
        buttons.forEach(btn => btn.disabled = true);
    } else if (status === 'error') {
        ring.classList.add('inactive');
        text.innerText = 'ERROR';
        text.style.fontSize = '0.75rem';
        info.innerText = 'Failed to check service status';
        // Disable buttons
        buttons.forEach(btn => btn.disabled = true);
    } else {
        ring.classList.add('inactive');
        text.innerText = 'STOPPED';
        text.style.fontSize = '0.75rem';
        info.innerText = 'Service is currently offline';
        // Enable buttons
        buttons.forEach(btn => btn.disabled = false);
    }
}

async function control(serviceName, action) {
    const info = document.getElementById(`info-${serviceName}`);
    const text = document.getElementById(`status-${serviceName}`);
    const buttons = document.querySelectorAll(`#card-${serviceName} .action-btn`);
    
    // Check if service is installed
    if (text.innerText === 'NOT INSTALLED') {
        alert(`Cannot ${action} service: ${serviceName}-gateway is not installed.`);
        return;
    }
    
    info.innerText = `Executing ${action}...`;
    text.innerText = 'PENDING';

    const result = await window.electronAPI.controlService(serviceName, action);
    
    if (result.error) {
        alert(`Error: ${result.error}`);
        info.innerText = `Failed to ${action}`;
    }
    
    // Small delay to let system update
    setTimeout(() => updateStatus(serviceName), 1000);
}

// Initial check
['openclaw', 'hermes'].forEach(updateStatus);

// Poll for status updates every 10 seconds
setInterval(() => {
    ['openclaw', 'hermes'].forEach(updateStatus);
}, 10000);

// Randomize chart bars for visual effect
function updateChart() {
    const bars = document.querySelectorAll('.bar');
    bars.forEach(bar => {
        const height = Math.floor(Math.random() * 70) + 20;
        bar.style.height = `${height}%`;
    });
}

setInterval(updateChart, 3000);
updateChart();


// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.getElementById('tab-overview').style.display = 'none';
    document.getElementById('tab-logs').style.display = 'none';
    document.getElementById('tab-settings').style.display = 'none';
    
    // Show selected tab
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    // Update nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// Logs functionality
function refreshLogs(serviceName) {
    const logArea = document.getElementById(`${serviceName}-logs`);
    logArea.value = 'Loading logs...\n';
    
    // Simulate fetching logs (in a real app, this would call the backend)
    setTimeout(() => {
        logArea.value = `Recent logs for ${serviceName}:\n\n`;
        logArea.value += `[2026-04-30 10:15:23] Service started\n`;
        logArea.value += `[2026-04-30 10:15:24] Initializing connections\n`;
        logArea.value += `[2026-04-30 10:15:25] Ready to accept requests\n`;
        logArea.value += `[2026-04-30 10:20:15] Processing request #1\n`;
        logArea.value += `[2026-04-30 10:20:16] Request completed successfully\n`;
    }, 500);
}

// Settings functionality
function saveSettings() {
    const openclawService = document.getElementById('openclaw-service').value;
    const hermesService = document.getElementById('hermes-service').value;
    const pollInterval = document.getElementById('poll-interval').value;
    
    // Save to localStorage
    localStorage.setItem('openclaw-service', openclawService);
    localStorage.setItem('hermes-service', hermesService);
    localStorage.setItem('poll-interval', pollInterval);
    
    alert('Settings saved successfully!');
}

// Load settings on startup
function loadSettings() {
    const openclawService = localStorage.getItem('openclaw-service') || 'openclaw-gateway';
    const hermesService = localStorage.getItem('hermes-service') || 'hermes-gateway';
    const pollInterval = localStorage.getItem('poll-interval') || '10';
    
    document.getElementById('openclaw-service').value = openclawService;
    document.getElementById('hermes-service').value = hermesService;
    document.getElementById('poll-interval').value = pollInterval;
}

// Load settings when app starts
loadSettings();
