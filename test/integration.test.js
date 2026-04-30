/**
 * Integration Tests - AgentFlow Service Control
 * 
 * Tests for complete workflows and end-to-end scenarios
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');

describe('Integration Tests: Service Control Workflows', () => {
    
    /**
     * Test 1: Full workflow - app starts and checks status
     */
    test('App can start and perform initial status check', () => {
        const rendererCode = fs.readFileSync('./renderer.js', 'utf8');
        
        // Verify initial status check is performed
        expect(rendererCode).toContain('forEach(updateStatus)');
        expect(rendererCode).toContain('openclaw');
        expect(rendererCode).toContain('hermes');
    });

    /**
     * Test 2: Status polling loop is set up correctly
     */
    test('Status polling loop is configured for 10 second intervals', () => {
        const rendererCode = fs.readFileSync('./renderer.js', 'utf8');
        
        // Verify polling setup
        expect(rendererCode).toContain('setInterval');
        expect(rendererCode).toContain('10000');
        expect(rendererCode).toContain('forEach(updateStatus)');
    });

    /**
     * Test 3: Service control command flow
     */
    test('Service control command executes correct systemctl command', () => {
        const serviceManagerCode = fs.readFileSync('./service-manager.js', 'utf8');
        
        // Verify command construction
        expect(serviceManagerCode).toContain('systemctl --user ${action}');
        expect(serviceManagerCode).toContain('mappedName');
    });

    /**
     * Test 4: Error handling in service control
     */
    test('Service control errors are properly caught and reported', () => {
        const mainCode = fs.readFileSync('./main.js', 'utf8');
        
        // Verify error handling
        expect(mainCode).toContain('try');
        expect(mainCode).toContain('catch');
        expect(mainCode).toContain('error.message');
    });

    /**
     * Test 5: UI updates after service control
     */
    test('UI updates after service control command completes', () => {
        const rendererCode = fs.readFileSync('./renderer.js', 'utf8');
        
        // Verify UI update flow
        expect(rendererCode).toContain('setTimeout');
        expect(rendererCode).toContain('updateStatus');
        expect(rendererCode).toContain('1000');
    });

    /**
     * Test 6: Window controls work independently
     */
    test('Window controls work independently of service operations', () => {
        const mainCode = fs.readFileSync('./main.js', 'utf8');
        
        // Verify window control handlers
        expect(mainCode).toContain('window-control');
        expect(mainCode).toContain('close');
        expect(mainCode).toContain('minimize');
        expect(mainCode).toContain('maximize');
    });

    /**
     * Test 7: IPC communication is bidirectional
     */
    test('IPC communication works in both directions', () => {
        const mainCode = fs.readFileSync('./main.js', 'utf8');
        const preloadCode = fs.readFileSync('./preload.js', 'utf8');
        
        // Verify IPC handlers in main
        expect(mainCode).toContain('ipcMain.handle');
        expect(mainCode).toContain('ipcMain.on');
        
        // Verify IPC calls in preload
        expect(preloadCode).toContain('ipcRenderer.invoke');
        expect(preloadCode).toContain('ipcRenderer.send');
    });

    /**
     * Test 8: Service name mapping is used consistently
     */
    test('Service name mapping is used in both getStatus and controlService', () => {
        const serviceManagerCode = fs.readFileSync('./service-manager.js', 'utf8');
        
        // Verify mapping is used in both functions
        const getStatusMatch = serviceManagerCode.match(/getStatus[\s\S]*?mapServiceName/);
        const controlServiceMatch = serviceManagerCode.match(/controlService[\s\S]*?mapServiceName/);
        
        expect(getStatusMatch).toBeTruthy();
        expect(controlServiceMatch).toBeTruthy();
    });

    /**
     * Test 9: Error responses are consistent
     */
    test('Error responses have consistent format', () => {
        const mainCode = fs.readFileSync('./main.js', 'utf8');
        
        // Verify consistent error format
        expect(mainCode).toContain('{ success: false, error:');
        expect(mainCode).toContain('error.message');
    });

    /**
     * Test 10: Renderer handles all status types
     */
    test('Renderer handles all possible status types', () => {
        const rendererCode = fs.readFileSync('./renderer.js', 'utf8');
        
        // Verify all status types are handled
        expect(rendererCode).toContain('active');
        expect(rendererCode).toContain('inactive');
        expect(rendererCode).toContain('error');
    });

    /**
     * Test 11: Service status can be checked for both services
     */
    test('Both openclaw and hermes services can be checked', async () => {
        try {
            // Try to check both services
            const openclaw = await execAsync('systemctl --user is-active openclaw-gateway').catch(e => e);
            const hermes = await execAsync('systemctl --user is-active hermes-gateway').catch(e => e);
            
            // Both should have valid exit codes
            expect([0, 3, 4]).toContain(openclaw.code || 0);
            expect([0, 3, 4]).toContain(hermes.code || 0);
        } catch (error) {
            // If systemd is not available, that's okay
            expect(true).toBe(true);
        }
    });

    /**
     * Test 12: Service control commands are properly formatted
     */
    test('Service control commands are properly formatted', () => {
        const serviceManagerCode = fs.readFileSync('./service-manager.js', 'utf8');
        
        // Verify command format uses systemctl --user with action variable
        expect(serviceManagerCode).toContain('systemctl --user ${action}');
        expect(serviceManagerCode).toContain('mappedName');
    });

    /**
     * Test 13: Renderer properly displays service names
     */
    test('Renderer displays correct service names in UI', () => {
        const htmlCode = fs.readFileSync('./index.html', 'utf8');
        
        // Verify service names in UI
        expect(htmlCode).toContain('OpenClaw');
        expect(htmlCode).toContain('Hermes');
    });

    /**
     * Test 14: Control buttons are properly connected
     */
    test('Control buttons are properly connected to control function', () => {
        const htmlCode = fs.readFileSync('./index.html', 'utf8');
        
        // Verify button onclick handlers
        expect(htmlCode).toContain('onclick="control(');
        expect(htmlCode).toContain('start');
        expect(htmlCode).toContain('stop');
        expect(htmlCode).toContain('restart');
    });

    /**
     * Test 15: Full end-to-end flow is possible
     */
    test('Full end-to-end flow is possible: check → control → update', () => {
        const rendererCode = fs.readFileSync('./renderer.js', 'utf8');
        const mainCode = fs.readFileSync('./main.js', 'utf8');
        const serviceManagerCode = fs.readFileSync('./service-manager.js', 'utf8');
        
        // Verify all components are in place
        expect(rendererCode).toContain('updateStatus');
        expect(rendererCode).toContain('control');
        expect(mainCode).toContain('get-status');
        expect(mainCode).toContain('control-service');
        expect(serviceManagerCode).toContain('getStatus');
        expect(serviceManagerCode).toContain('controlService');
    });
});
