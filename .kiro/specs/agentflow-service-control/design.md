# AgentFlow Service Control Bugfix Design

## Overview

The AgentFlow Electron application fails to properly monitor and control systemd user-level services due to three critical issues: incorrect service names (`openclaw` instead of `openclaw-gateway`), incorrect systemctl invocation (`sudo systemctl` instead of `systemctl --user`), and inadequate error handling that masks command failures. This design formalizes the bug condition and outlines a targeted fix that corrects service name references, uses proper user-level service commands, implements robust error handling, and ensures the UI accurately reflects actual systemd state.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the app attempts to check status or control services using incorrect service names or privilege escalation
- **Property (P)**: The desired behavior when service commands are executed - commands should use correct service names and `systemctl --user` without sudo
- **Preservation**: Existing UI update patterns, polling intervals, and window control functionality that must remain unchanged
- **service-manager.js**: The module in `service-manager.js` that executes systemctl commands and returns service status
- **renderer.js**: The frontend module in `renderer.js` that displays status and handles user interactions
- **main.js**: The Electron main process in `main.js` that bridges IPC communication between renderer and service-manager
- **systemctl --user**: The correct command for managing user-level systemd services without privilege escalation
- **Service Names**: `openclaw-gateway` and `hermes` are the correct systemd service names; `openclaw` is incorrect

## Bug Details

### Bug Condition

The bug manifests when the app attempts to check service status or control services. The `getStatus()` and `controlService()` functions in service-manager.js use incorrect service names and incorrect systemctl invocation syntax. Specifically:

1. Status checks use `systemctl is-active openclaw` (wrong service name)
2. Service control uses `sudo systemctl [action] openclaw` (wrong service name and unnecessary sudo)
3. Error handling is insufficient, masking actual command failures
4. The renderer.js hardcodes `'openclaw'` instead of `'openclaw-gateway'`

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type {serviceName: string, action: string}
  OUTPUT: boolean
  
  RETURN (input.serviceName IN ['openclaw', 'hermes'])
         AND (
           (input.action == 'status' AND NOT usesCorrectServiceName(input.serviceName))
           OR (input.action IN ['start', 'stop', 'restart'] AND NOT usesSystemctlUser(input.action))
           OR (input.action IN ['start', 'stop', 'restart'] AND usesSudo(input.action))
         )
END FUNCTION
```

### Examples

**Example 1: Status Check with Wrong Service Name**
- Input: `getStatus('openclaw')`
- Current behavior: Command `systemctl is-active openclaw` fails silently, returns 'inactive'
- Expected behavior: Command `systemctl --user is-active openclaw-gateway` succeeds, returns actual status
- Bug manifestation: User sees "STOPPED" even when service is actually running

**Example 2: Service Control with Wrong Service Name and Sudo**
- Input: `controlService('openclaw', 'start')`
- Current behavior: Command `sudo systemctl start openclaw` fails (service not found), returns error
- Expected behavior: Command `systemctl --user start openclaw-gateway` succeeds, service starts
- Bug manifestation: User clicks "Start" button, nothing happens, UI doesn't update

**Example 3: Hermes Service Status Check**
- Input: `getStatus('hermes')`
- Current behavior: Command `systemctl is-active hermes` fails (requires sudo), returns 'inactive'
- Expected behavior: Command `systemctl --user is-active hermes` succeeds, returns actual status
- Bug manifestation: Hermes status always shows "STOPPED" regardless of actual state

**Example 4: Service Control Without Error Feedback**
- Input: `controlService('openclaw', 'restart')`
- Current behavior: Command fails silently, promise resolves with error object, UI shows generic error
- Expected behavior: Command succeeds, promise resolves with success, UI updates after 1 second delay
- Bug manifestation: User has no clear feedback about what went wrong

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The app SHALL perform an initial status check for both services when it starts
- The app SHALL continue to poll for status updates every 10 seconds during runtime
- The app SHALL update the UI with a 1-second delay after service control commands to allow systemd to process changes
- The app SHALL display service status as "ACTIVE" or "STOPPED" with appropriate visual indicators (ring color, status text, info message)
- Window control functions (minimize, maximize, close) SHALL continue to work as currently implemented
- The IPC communication pattern between renderer and main process SHALL remain unchanged

**Scope:**
All inputs that do NOT involve incorrect service names or incorrect systemctl syntax should be completely unaffected by this fix. This includes:
- Window control operations (minimize, maximize, close)
- UI rendering and visual updates
- Polling interval timing
- Status display formatting

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Incorrect Service Name References**: The code uses `'openclaw'` as the service name, but the actual systemd service is named `'openclaw-gateway'`. This causes all systemctl commands to fail because the service cannot be found.
   - service-manager.js passes the serviceName directly to systemctl without validation
   - renderer.js hardcodes `'openclaw'` in the polling loop
   - No mapping or validation of service names exists

2. **Incorrect Systemctl Invocation**: The code uses `sudo systemctl` for user-level services, which is incorrect. User-level services should use `systemctl --user` without sudo.
   - User-level services are managed by the user's systemd instance, not the system instance
   - Using sudo attempts to access system-level services, which don't exist
   - This causes permission issues and command failures

3. **Inadequate Error Handling**: The error handling in `getStatus()` silently converts all errors to 'inactive', masking the actual problem.
   - Errors are caught but not logged or reported
   - The UI cannot distinguish between "service is stopped" and "command failed"
   - Users have no visibility into what went wrong

4. **Silent Command Failures**: The `controlService()` function returns error objects, but the error handling in main.js and renderer.js doesn't properly communicate failures to the user.
   - Errors are caught but not clearly displayed
   - The UI updates after 1 second regardless of success or failure
   - Users cannot tell if their action succeeded

## Correctness Properties

Property 1: Bug Condition - Service Commands Use Correct Names and Syntax

_For any_ service command where the bug condition holds (incorrect service name or incorrect systemctl syntax), the fixed functions SHALL use the correct service names (`openclaw-gateway` and `hermes`) and invoke `systemctl --user [action]` without sudo, ensuring commands execute successfully against the actual systemd user services.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Service-Command Behavior

_For any_ operation that is NOT a service status check or control command (window controls, UI rendering, polling intervals), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for non-service operations.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `service-manager.js`

**Function**: `getStatus(serviceName)`

**Specific Changes**:
1. **Service Name Mapping**: Add a mapping function to convert service identifiers to correct systemd service names
   - Map `'openclaw'` → `'openclaw-gateway'`
   - Map `'hermes'` → `'hermes'`
   - Validate that only known services are queried

2. **Correct Systemctl Invocation**: Replace `systemctl is-active` with `systemctl --user is-active`
   - Use `systemctl --user is-active [correct-service-name]` instead of `systemctl is-active [wrong-name]`
   - Remove any sudo invocation

3. **Improved Error Handling**: Distinguish between "service not found" and "service is inactive"
   - Log errors for debugging
   - Return 'inactive' only when the service exists but is not running
   - Return 'error' or throw when the command itself fails

---

**File 1**: `service-manager.js`

**Function**: `controlService(serviceName, action)`

**Specific Changes**:
1. **Service Name Mapping**: Apply the same service name mapping as in `getStatus()`
   - Ensure consistent service name resolution

2. **Correct Systemctl Invocation**: Replace `sudo systemctl` with `systemctl --user`
   - Use `systemctl --user [action] [correct-service-name]` instead of `sudo systemctl [action] [wrong-name]`
   - Remove sudo completely

3. **Proper Error Handling**: Capture and report errors clearly
   - Reject the promise with a descriptive error message
   - Include stderr output for debugging
   - Allow the caller to handle errors appropriately

---

**File 2**: `renderer.js`

**Function**: `updateStatus()` and polling loop

**Specific Changes**:
1. **Correct Service Names**: Replace hardcoded `'openclaw'` with `'openclaw-gateway'`
   - Update the polling loop to use `['openclaw-gateway', 'hermes']` instead of `['openclaw', 'hermes']`
   - Update all DOM element ID references to match the correct service names

2. **Error Handling in UI**: Handle error responses from service control commands
   - Check if result contains an error property
   - Display user-friendly error messages
   - Provide feedback about what went wrong

---

**File 3**: `main.js`

**Function**: `ipcMain.handle('control-service', ...)`

**Specific Changes**:
1. **Error Response Format**: Ensure consistent error response format
   - Return `{ success: true }` on success
   - Return `{ success: false, error: 'error message' }` on failure
   - Allow renderer to distinguish between success and failure

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate service status checks and control commands using the unfixed code. Run these tests against actual systemd user services to observe failures and confirm the root cause.

**Test Cases**:
1. **Status Check with Wrong Service Name**: Call `getStatus('openclaw')` on unfixed code and verify it fails or returns incorrect status (will fail on unfixed code)
2. **Status Check with Correct Service Name**: Call `getStatus('openclaw-gateway')` on unfixed code and verify it fails due to sudo requirement (will fail on unfixed code)
3. **Service Control with Wrong Service Name**: Call `controlService('openclaw', 'start')` on unfixed code and verify it fails (will fail on unfixed code)
4. **Service Control with Sudo**: Call `controlService('openclaw-gateway', 'start')` on unfixed code and verify it fails due to sudo requirement (will fail on unfixed code)

**Expected Counterexamples**:
- `systemctl is-active openclaw` returns error (service not found)
- `sudo systemctl start openclaw-gateway` fails (sudo requires password or is not configured)
- Commands fail silently or with unclear error messages
- Possible causes: incorrect service names, incorrect systemctl syntax, sudo requirement, inadequate error handling

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedFunction(input)
  ASSERT result.success == true OR result.status IN ['active', 'inactive']
  ASSERT commandUsesCorrectServiceName(input.serviceName)
  ASSERT commandUsesSystemctlUser(input.action)
  ASSERT NOT commandUsesSudo(input.action)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for window controls and UI rendering, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Window Control Preservation**: Verify that minimize, maximize, and close buttons continue to work after fix
2. **UI Rendering Preservation**: Verify that status display formatting (ACTIVE/STOPPED, ring colors, info text) remains unchanged
3. **Polling Interval Preservation**: Verify that status polling continues every 10 seconds
4. **Delay After Control Preservation**: Verify that 1-second delay after service control commands is maintained

### Unit Tests

- Test service name mapping function with valid and invalid service names
- Test `getStatus()` with correct service names and `systemctl --user` syntax
- Test `controlService()` with correct service names and `systemctl --user` syntax
- Test error handling for failed commands (service not found, permission denied, etc.)
- Test that errors are properly propagated through IPC to the renderer
- Test that renderer correctly displays error messages to the user

### Property-Based Tests

- Generate random service names and verify only valid names are accepted
- Generate random actions (start, stop, restart) and verify correct systemctl syntax is used
- Generate random service states and verify status polling returns consistent results
- Test that service control commands succeed for valid services and fail gracefully for invalid ones
- Test that UI updates correctly after successful and failed commands

### Integration Tests

- Test full flow: app starts → initial status check → polling loop → user clicks button → service control → UI updates
- Test service control in each context: start service → verify status changes → stop service → verify status changes
- Test error scenarios: attempt to control non-existent service → verify error is displayed → verify UI remains responsive
- Test that window controls continue to work while service operations are in progress
- Test rapid successive service control commands to verify no race conditions
