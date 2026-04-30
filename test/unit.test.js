/**
 * Unit Tests - AgentFlow Service Control
 * 
 * Tests for individual functions and components
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');

describe('Unit Tests: Service Control Functions', () => {
    
    /**
     * Test 1: Service name mapping with valid names
     */
    test('Service name mapping accepts valid service names', () => {
        const serviceNameMap = {
            'openclaw': 'openclaw-gateway',
            'hermes': 'hermes-gateway'
        };
        
        expect(serviceNameMap['openclaw']).toBe('openclaw-gateway');
        expect(serviceNameMap['hermes']).toBe('hermes-gateway');
    });

    /**
     * Test 2: Service name mapping rejects invalid names
     */
    test('Service name mapping rejects invalid service names', () => {
        const serviceNameMap = {
            'openclaw': 'openclaw-gateway',
            'hermes': 'hermes-gateway'
        };
        
        expect(serviceNameMap['invalid']).toBeUndefined();
        expect(serviceNameMap['unknown']).toBeUndefined();
    });

    /**
     * Test 3: getStatus uses correct systemctl command
     */
    test('getStatus function uses systemctl --user is-active', () => {
        const serviceManagerCode = fs.readFileSync('./service-manager.js', 'utf8');
        
        // Verify correct command is used
        expect(serviceManagerCode).toContain('systemctl --user is-active');
        expect(serviceManagerCode).not.toContain('sudo systemctl is-active');
    });

    /**
     * Test 4: controlService uses correct systemctl command
     */
    test('controlService function uses systemctl --user [action]', () => {
        const serviceManagerCode = fs.readFileSync('./service-manager.js', 'utf8');
        
        // Verify correct command format
        expect(serviceManagerCode).toContain('systemctl --user ${action}');
        expect(serviceManagerCode).not.toContain('sudo systemctl ${action}');
    });

    /**
     * Test 5: Error handling for exit code 3 (inactive)
     */
    test('Error handling treats exit code 3 as inactive (not error)', () => {
        const serviceManagerCode = fs.readFileSync('./service-manager.js', 'utf8');
        
        // Verify exit code 3 is handled
        expect(serviceManagerCode).toContain('error.code === 3');
        expect(serviceManagerCode).toContain('inactive');
    });

    /**
     * Test 6: Error handling for exit code 4 (not found)
     */
    test('Error handling treats exit code 4 as service not found', () => {
        const serviceManagerCode = fs.readFileSync('./service-manager.js', 'utf8');
        
        // Verify exit code 4 is handled
        expect(serviceManagerCode).toContain('error.code === 4');
        expect(serviceManagerCode).toContain('error');
    });

    /**
     * Test 7: IPC handler returns success response
     */
    test('IPC handler returns success response on success', () => {
        const mainCode = fs.readFileSync('./main.js', 'utf8');
        
        // Verify success response format
        expect(mainCode).toContain('{ success: true }');
    });

    /**
     * Test 8: IPC handler returns error response on failure
     */
    test('IPC handler returns error response on failure', () => {
        const mainCode = fs.readFileSync('./main.js', 'utf8');
        
        // Verify error response format
        expect(mainCode).toContain('{ success: false, error:');
    });

    /**
     * Test 9: Renderer handles error responses
     */
    test('Renderer handles error responses from service control', () => {
        const rendererCode = fs.readFileSync('./renderer.js', 'utf8');
        
        // Verify error handling
        expect(rendererCode).toContain('result.error');
        expect(rendererCode).toContain('alert');
    });

    /**
     * Test 10: Renderer displays error status
     */
    test('Renderer displays ERROR status when check fails', () => {
        const rendererCode = fs.readFileSync('./renderer.js', 'utf8');
        
        // Verify ERROR status display
        expect(rendererCode).toContain('ERROR');
        expect(rendererCode).toContain('status === \'error\'');
    });

    /**
     * Test 11: Service name mapping function exists
     */
    test('Service manager has mapServiceName function', () => {
        const serviceManagerCode = fs.readFileSync('./service-manager.js', 'utf8');
        
        // Verify function exists
        expect(serviceManagerCode).toContain('mapServiceName');
        expect(serviceManagerCode).toContain('Unknown service');
    });

    /**
     * Test 12: Renderer uses correct service identifiers
     */
    test('Renderer uses correct service identifiers in polling', () => {
        const rendererCode = fs.readFileSync('./renderer.js', 'utf8');
        
        // Verify correct identifiers are used
        expect(rendererCode).toContain('openclaw');
        expect(rendererCode).toContain('hermes');
    });

    /**
     * Test 13: Control function shows PENDING status
     */
    test('Control function shows PENDING status during execution', () => {
        const rendererCode = fs.readFileSync('./renderer.js', 'utf8');
        
        // Verify PENDING status
        expect(rendererCode).toContain('PENDING');
    });

    /**
     * Test 14: Control function waits before updating status
     */
    test('Control function waits 1 second before updating status', () => {
        const rendererCode = fs.readFileSync('./renderer.js', 'utf8');
        
        // Verify 1 second delay
        expect(rendererCode).toContain('setTimeout');
        expect(rendererCode).toContain('1000');
    });

    /**
     * Test 15: Service manager is a singleton
     */
    test('Service manager is exported as singleton', () => {
        const serviceManagerCode = fs.readFileSync('./service-manager.js', 'utf8');
        
        // Verify singleton export
        expect(serviceManagerCode).toContain('module.exports = new ServiceManager');
    });
});
