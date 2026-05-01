async function updateStatus(serviceName) {
    const status = await window.electronAPI.getStatus(serviceName);
    const ring = document.getElementById(`ring-${serviceName}`);
    const text = document.getElementById(`status-${serviceName}`);
    const info = document.getElementById(`info-${serviceName}`);
    const buttons = document.querySelectorAll(`#card-${serviceName} .action-btn`);
    const logButton = document.getElementById(`${serviceName}-log-btn`);

    ring.classList.remove('active', 'inactive');
    
    if (status === 'active') {
        ring.classList.add('active');
        text.innerText = 'ACTIVE';
        text.style.fontSize = '0.75rem';
        info.innerText = 'Running smoothly | Uptime: Healthy';
        // Enable buttons
        buttons.forEach(btn => btn.disabled = false);
        if (logButton) {
            logButton.disabled = false;
            logButton.textContent = 'Refresh Logs';
        }
    } else if (status === 'not-installed') {
        ring.classList.add('inactive');
        text.innerText = 'NOT\nINSTALLED';
        text.style.fontSize = '0.6rem';
        text.style.lineHeight = '1.1';
        info.innerText = `Install ${serviceName}-gateway service`;
        // Disable buttons
        buttons.forEach(btn => btn.disabled = true);
        if (logButton) {
            logButton.disabled = true;
            logButton.textContent = 'Refresh Logs';
        }
    } else if (status === 'error') {
        ring.classList.add('inactive');
        text.innerText = 'ERROR';
        text.style.fontSize = '0.75rem';
        info.innerText = 'Failed to check service status';
        // Disable buttons
        buttons.forEach(btn => btn.disabled = true);
        if (logButton) {
            logButton.disabled = true;
            logButton.textContent = 'Refresh Logs';
        }
    } else {
        ring.classList.add('inactive');
        text.innerText = 'STOPPED';
        text.style.fontSize = '0.75rem';
        info.innerText = 'Service is currently offline';
        // Enable buttons
        buttons.forEach(btn => btn.disabled = false);
        if (logButton) {
            logButton.disabled = false;
            logButton.textContent = 'Refresh Logs';
        }
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

// Service identifiers (these are fixed identifiers, not the actual service names)
const SERVICE_IDENTIFIERS = ['openclaw', 'hermes'];

// Initial check
SERVICE_IDENTIFIERS.forEach(updateStatus);

// Poll for status updates every 10 seconds
let pollInterval = 10000; // Default 10 seconds
let pollIntervalId = setInterval(() => {
    SERVICE_IDENTIFIERS.forEach(updateStatus);
}, pollInterval);

// Function to update polling interval
function updatePollInterval(newInterval) {
    clearInterval(pollIntervalId);
    pollInterval = newInterval * 1000; // Convert seconds to milliseconds
    pollIntervalId = setInterval(() => {
        SERVICE_IDENTIFIERS.forEach(updateStatus);
    }, pollInterval);
}

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
function switchTab(tabName, event) {
    // Hide all tabs
    document.getElementById('tab-overview').style.display = 'none';
    document.getElementById('tab-logs').style.display = 'none';
    document.getElementById('tab-settings').style.display = 'none';
    
    // Show selected tab
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    // Update nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Logs functionality
async function refreshLogs(serviceName) {
    const logArea = document.getElementById(`${serviceName}-logs`);
    const logButton = document.getElementById(`${serviceName}-log-btn`);
    
    // Check if service is installed
    const status = document.getElementById(`status-${serviceName}`);
    if (status && status.innerText.includes('NOT')) {
        alert(`Cannot fetch logs: ${serviceName}-gateway is not installed.`);
        return;
    }
    
    logArea.value = 'Loading logs...\n';
    logButton.disabled = true;
    logButton.textContent = 'Loading...';
    
    try {
        const result = await window.electronAPI.getLogs(serviceName, 50);
        
        if (result.success === false) {
            logArea.value = `Error fetching logs:\n${result.error}\n\nMake sure the service is installed and journalctl is available.`;
        } else {
            logArea.value = result.logs;
        }
    } catch (error) {
        logArea.value = `Error fetching logs:\n${error.message}\n\nMake sure the service is installed and journalctl is available.`;
    } finally {
        logButton.disabled = false;
        logButton.textContent = 'Refresh Logs';
    }
}

// Settings functionality
async function saveSettings() {
    const openclawService = document.getElementById('openclaw-service').value;
    const hermesService = document.getElementById('hermes-service').value;
    const pollInterval = document.getElementById('poll-interval').value;
    
    // Save to localStorage
    localStorage.setItem('openclaw-service', openclawService);
    localStorage.setItem('hermes-service', hermesService);
    localStorage.setItem('poll-interval', pollInterval);
    
    // Update service mapping in service manager
    try {
        const newMapping = {
            'openclaw': openclawService,
            'hermes': hermesService
        };
        const result = await window.electronAPI.updateServiceMapping(newMapping);
        
        if (result.success) {
            // Update polling interval
            updatePollInterval(parseInt(pollInterval, 10));
            alert('Settings saved successfully! Service mapping updated.');
        } else {
            alert(`Failed to update service mapping: ${result.error}`);
        }
    } catch (error) {
        alert(`Error updating service mapping: ${error.message}`);
    }
}

// Load settings on startup
async function loadSettings() {
    const openclawService = localStorage.getItem('openclaw-service') || 'openclaw-gateway';
    const hermesService = localStorage.getItem('hermes-service') || 'hermes-gateway';
    const pollInterval = localStorage.getItem('poll-interval') || '10';
    
    document.getElementById('openclaw-service').value = openclawService;
    document.getElementById('hermes-service').value = hermesService;
    document.getElementById('poll-interval').value = pollInterval;
    
    // Update service mapping in service manager
    try {
        const newMapping = {
            'openclaw': openclawService,
            'hermes': hermesService
        };
        const result = await window.electronAPI.updateServiceMapping(newMapping);
        
        if (result.success) {
            console.log('Service mapping updated on startup');
        } else {
            console.error(`Failed to update service mapping: ${result.error}`);
        }
    } catch (error) {
        console.error(`Error updating service mapping: ${error.message}`);
    }
    
    // Update polling interval
    updatePollInterval(parseInt(pollInterval, 10));
}

// Load settings when app starts
loadSettings();
