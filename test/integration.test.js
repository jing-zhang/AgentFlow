/**
 * Integration Tests - AgentFlow Service Control
 * 
 * Tests for complete workflows and end-to-end scenarios
 */

// Mock child_process.exec
jest.mock('child_process', () => ({
    exec: jest.fn()
}));

const { exec } = require('child_process');
const ServiceManager = require('../service-manager');

describe('Integration Tests: Service Control Workflows', () => {
    let serviceManager;
    
    beforeEach(() => {
        // Clear the require cache to get a fresh instance
        jest.resetModules();
        serviceManager = require('../service-manager');
        jest.clearAllMocks();
    });
    
    /**
     * Test 1: Full workflow: check status, control service, check updated status
     */
    test('Full workflow: check status → control service → check updated status', async () => {
        // Mock: First status check returns inactive
        exec.mockImplementationOnce((command, callback) => {
            expect(command).toBe('systemctl --user is-active openclaw-gateway');
            const error = new Error('Command failed');
            error.code = 3;
            callback(error, 'inactive\n', '');
        });
        
        // Mock: Control service succeeds
        exec.mockImplementationOnce((command, callback) => {
            expect(command).toBe('systemctl --user start openclaw-gateway');
            callback(null, '', '');
        });
        
        // Mock: Second status check returns active
        exec.mockImplementationOnce((command, callback) => {
            expect(command).toBe('systemctl --user is-active openclaw-gateway');
            callback(null, 'active\n', '');
        });
        
        // Execute workflow
        const initialStatus = await serviceManager.getStatus('openclaw');
        expect(initialStatus).toBe('inactive');
        
        await serviceManager.controlService('openclaw', 'start');
        
        const finalStatus = await serviceManager.getStatus('openclaw');
        expect(finalStatus).toBe('active');
        
        expect(exec).toHaveBeenCalledTimes(3);
    });
    
    /**
     * Test 2: Service name mapping can be updated dynamically
     */
    test('Service name mapping can be updated and used', async () => {
        // Update service mapping
        serviceManager.updateServiceMapping({
            'openclaw': 'custom-openclaw-service',
            'hermes': 'custom-hermes-service'
        });
        
        // Mock exec to verify custom service name is used
        exec.mockImplementation((command, callback) => {
            expect(command).toBe('systemctl --user is-active custom-openclaw-service');
            callback(null, 'active\n', '');
        });
        
        const status = await serviceManager.getStatus('openclaw');
        expect(status).toBe('active');
        expect(exec).toHaveBeenCalledTimes(1);
    });
    
    /**
     * Test 3: Service mapping preserves defaults when partially updated
     */
    test('Service mapping preserves defaults when partially updated', () => {
        // Update only openclaw
        serviceManager.updateServiceMapping({
            'openclaw': 'custom-openclaw-service'
        });
        
        const mapping = serviceManager.getServiceMapping();
        expect(mapping.openclaw).toBe('custom-openclaw-service');
        expect(mapping.hermes).toBe('hermes-gateway'); // Default preserved
    });
    
    /**
     * Test 4: Log fetching workflow with custom service names
     */
    test('Log fetching uses updated service names', async () => {
        // Update service mapping
        serviceManager.updateServiceMapping({
            'openclaw': 'custom-openclaw-service'
        });
        
        // Mock journalctl with custom service name
        exec.mockImplementation((command, callback) => {
            expect(command).toBe('journalctl --user -u custom-openclaw-service -n 50 --no-pager -o short-precise');
            callback(null, 'Custom service logs\n', '');
        });
        
        const logs = await serviceManager.getLogs('openclaw', 50);
        expect(logs).toBe('Custom service logs');
        expect(exec).toHaveBeenCalledTimes(1);
    });
    
    /**
     * Test 5: Error recovery workflow
     */
    test('Error recovery workflow: failed control → error handling → retry', async () => {
        // Mock: First control attempt fails
        exec.mockImplementationOnce((command, callback) => {
            const error = new Error('Service not found');
            callback(error, '', 'Unit not found');
        });
        
        // Mock: Second control attempt succeeds
        exec.mockImplementationOnce((command, callback) => {
            callback(null, '', '');
        });
        
        // First attempt should fail
        await expect(serviceManager.controlService('hermes', 'start'))
            .rejects.toThrow('Failed to start hermes: Unit not found');
        
        // Second attempt should succeed
        await serviceManager.controlService('hermes', 'start');
        
        expect(exec).toHaveBeenCalledTimes(2);
    });
    
    /**
     * Test 6: Multiple service control in sequence
     */
    test('Multiple service control in sequence', async () => {
        const commands = [];
        
        exec.mockImplementation((command, callback) => {
            commands.push(command);
            callback(null, '', '');
        });
        
        await serviceManager.controlService('openclaw', 'start');
        await serviceManager.controlService('hermes', 'stop');
        await serviceManager.controlService('openclaw', 'restart');
        
        expect(commands).toEqual([
            'systemctl --user start openclaw-gateway',
            'systemctl --user stop hermes-gateway',
            'systemctl --user restart openclaw-gateway'
        ]);
    });
    
    /**
     * Test 7: Status check for both services with different outcomes
     */
    test('Status check for both services with different outcomes', async () => {
        let callCount = 0;
        
        exec.mockImplementation((command, callback) => {
            callCount++;
            
            if (command.includes('openclaw-gateway')) {
                callback(null, 'active\n', '');
            } else if (command.includes('hermes-gateway')) {
                const error = new Error('Command failed');
                error.code = 3;
                callback(error, 'inactive\n', '');
            } else {
                // Default callback for unexpected commands
                callback(new Error('Unexpected command'), '', '');
            }
        });
        
        const openclawStatus = await serviceManager.getStatus('openclaw');
        const hermesStatus = await serviceManager.getStatus('hermes');
        
        expect(openclawStatus).toBe('active');
        expect(hermesStatus).toBe('inactive');
        expect(callCount).toBe(2);
    }, 10000); // 10 second timeout
    
    /**
     * Test 8: Log fetching with different line counts
     */
    test('Log fetching with different line counts', async () => {
        exec.mockImplementation((command, callback) => {
            if (command.includes('-n 20')) {
                callback(null, '20 lines of logs\n', '');
            } else if (command.includes('-n 100')) {
                callback(null, '100 lines of logs\n', '');
            }
        });
        
        const shortLogs = await serviceManager.getLogs('openclaw', 20);
        const longLogs = await serviceManager.getLogs('hermes', 100);
        
        expect(shortLogs).toBe('20 lines of logs');
        expect(longLogs).toBe('100 lines of logs');
        expect(exec).toHaveBeenCalledTimes(2);
    });
    
    /**
     * Test 9: Unknown service identifier throws error
     */
    test('Unknown service identifier throws error in mapServiceName', () => {
        expect(() => serviceManager.mapServiceName('unknown-service'))
            .toThrow('Unknown service: unknown-service');
    });
    
    /**
     * Test 10: Service manager handles platform detection
     */
    test('Service manager handles non-linux platform', async () => {
        // Mock platform to be non-linux
        const originalPlatform = serviceManager.platform;
        Object.defineProperty(serviceManager, 'platform', { value: 'darwin' });
        
        const status = await serviceManager.getStatus('openclaw');
        const controlResult = await serviceManager.controlService('openclaw', 'start');
        const logs = await serviceManager.getLogs('openclaw', 50);
        
        expect(status).toBe('inactive');
        expect(controlResult).toEqual({ success: false });
        expect(logs).toBe('Log fetching not supported on darwin');
        
        // Restore original platform
        Object.defineProperty(serviceManager, 'platform', { value: originalPlatform });
    });
});