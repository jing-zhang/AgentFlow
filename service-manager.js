const { exec } = require('child_process');
const os = require('os');

class ServiceManager {
    constructor() {
        this.platform = os.platform();
        // Default service name mapping: convert identifiers to correct systemd service names
        this.defaultServiceNameMap = {
            'openclaw': 'openclaw-gateway',
            'hermes': 'hermes-gateway'
        };
        // Current service name mapping (can be updated from settings)
        this.serviceNameMap = { ...this.defaultServiceNameMap };
    }

    /**
     * Update service name mapping from settings
     * @param {Object} newMapping - New service name mapping
     */
    updateServiceMapping(newMapping) {
        if (newMapping && typeof newMapping === 'object') {
            this.serviceNameMap = { ...this.defaultServiceNameMap, ...newMapping };
        }
    }

    /**
     * Get current service name mapping
     * @returns {Object} Current service name mapping
     */
    getServiceMapping() {
        return { ...this.serviceNameMap };
    }

    /**
     * Maps a service identifier to the correct systemd service name
     * @param {string} serviceName - The service identifier
     * @returns {string} The correct systemd service name
     * @throws {Error} If the service name is not recognized
     */
    mapServiceName(serviceName) {
        if (!(serviceName in this.serviceNameMap)) {
            throw new Error(`Unknown service: ${serviceName}`);
        }
        return this.serviceNameMap[serviceName];
    }

    async getStatus(serviceName) {
        if (this.platform === 'linux') {
            return new Promise((resolve) => {
                try {
                    const mappedName = this.mapServiceName(serviceName);
                    // Use systemctl --user for user-level services
                    // Note: systemctl is-active returns exit code 3 for inactive services, which exec treats as error
                    exec(`systemctl --user is-active ${mappedName}`, (error, stdout, stderr) => {
                        const output = stdout.trim();
                        
                        // Check the actual output, not just the error code
                        if (output === 'active') {
                            resolve('active');
                        } else if (output === 'inactive' || (error && error.code === 3)) {
                            // Exit code 3 means service is inactive (not an error)
                            resolve('inactive');
                        } else if (error && error.code === 4) {
                            // Exit code 4 means service not found
                            console.error(`Service not found: ${mappedName}`);
                            resolve('not-installed');
                        } else {
                            // Other errors
                            console.error(`Error checking status: ${stderr || error?.message}`);
                            resolve('error');
                        }
                    });
                } catch (error) {
                    console.error(`Error mapping service name: ${error.message}`);
                    resolve('error');
                }
            });
        }
        // Future: Add mac/windows logic here
        return 'inactive';
    }

    async controlService(serviceName, action) {
        if (this.platform === 'linux') {
            return new Promise((resolve, reject) => {
                try {
                    const mappedName = this.mapServiceName(serviceName);
                    // Use systemctl --user without sudo for user-level services
                    const command = `systemctl --user ${action} ${mappedName}`;
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            // Provide descriptive error message
                            const errorMsg = stderr || error.message;
                            console.error(`Service control error: ${errorMsg}`);
                            reject(new Error(`Failed to ${action} ${serviceName}: ${errorMsg}`));
                        } else {
                            resolve({ success: true });
                        }
                    });
                } catch (error) {
                    console.error(`Error mapping service name: ${error.message}`);
                    reject(error);
                }
            });
        }
        return { success: false };
    }

    /**
     * Get recent logs for a service using journalctl
     * @param {string} serviceName - The service identifier
     * @param {number} lines - Number of log lines to fetch (default: 50)
     * @returns {Promise<string>} The log output
     */
    async getLogs(serviceName, lines = 50) {
        if (this.platform === 'linux') {
            return new Promise((resolve, reject) => {
                try {
                    const mappedName = this.mapServiceName(serviceName);
                    // Use journalctl to fetch logs for user-level services
                    // --user: user-level services
                    // -u: unit name
                    // -n: number of lines
                    // --no-pager: don't use a pager
                    // -o: output format (short-precise includes timestamp)
                    const command = `journalctl --user -u ${mappedName} -n ${lines} --no-pager -o short-precise`;
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            // If service doesn't exist or has no logs, return empty string
                            if (error.code === 1) {
                                resolve(`No logs found for ${mappedName}\n\nTry starting the service first.`);
                            } else {
                                console.error(`Error fetching logs: ${stderr || error.message}`);
                                reject(new Error(`Failed to fetch logs for ${serviceName}: ${stderr || error.message}`));
                            }
                        } else {
                            const output = stdout.trim();
                            if (output) {
                                resolve(output);
                            } else {
                                resolve(`No recent logs for ${mappedName}\n\nService may be stopped or has no recent activity.`);
                            }
                        }
                    });
                } catch (error) {
                    console.error(`Error mapping service name: ${error.message}`);
                    reject(error);
                }
            });
        }
        return `Log fetching not supported on ${this.platform}`;
    }
}

module.exports = new ServiceManager();
