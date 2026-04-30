# Implementation Tasks: AgentFlow Service Control Bugfix

## Overview

This task list implements the bugfix for AgentFlow service control issues. The workflow follows the exploratory bugfix methodology:
1. **Explore** - Write tests to surface the bug on unfixed code
2. **Preserve** - Write tests to verify non-buggy behavior is unchanged
3. **Implement** - Apply the fix based on understanding from exploration
4. **Validate** - Verify the fix works and doesn't break anything

---

## Phase 1: Bug Exploration

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Service Commands Use Incorrect Names and Syntax
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design:
    - Test that `getStatus('openclaw')` fails or returns incorrect status (wrong service name)
    - Test that `getStatus('openclaw-gateway')` fails with unfixed code (uses `systemctl` instead of `systemctl --user`)
    - Test that `controlService('openclaw', 'start')` fails (wrong service name)
    - Test that `controlService('openclaw-gateway', 'start')` fails with unfixed code (uses `sudo systemctl` instead of `systemctl --user`)
  - The test assertions should match the Expected Behavior Properties from design:
    - Commands should use correct service names (`openclaw-gateway` and `hermes`)
    - Commands should use `systemctl --user` without sudo
    - Commands should execute successfully
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Record which commands fail and why (service not found, permission denied, etc.)
    - Verify that the root cause matches the hypothesized issues in the design
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

---

## Phase 2: Preservation Testing

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Service-Command Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Observe window control functions (minimize, maximize, close) work correctly
    - Observe UI rendering displays status as "ACTIVE" or "STOPPED" with appropriate visual indicators
    - Observe polling interval continues every 10 seconds
    - Observe 1-second delay after service control commands
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Test that window controls remain functional after any service operation
    - Test that UI status display format is preserved (ACTIVE/STOPPED, ring colors, info text)
    - Test that polling interval timing is preserved (10 seconds)
    - Test that delay after control commands is preserved (1 second)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

---

## Phase 3: Implementation

- [x] 3. Fix service control issues in service-manager.js, renderer.js, and main.js

  - [x] 3.1 Fix service-manager.js - getStatus() function
    - Add service name mapping function to convert service identifiers to correct systemd names
      - Map `'openclaw'` → `'openclaw-gateway'`
      - Map `'hermes'` → `'hermes'`
      - Validate that only known services are queried
    - Replace `systemctl is-active` with `systemctl --user is-active`
      - Use `systemctl --user is-active [correct-service-name]` instead of `systemctl is-active [wrong-name]`
      - Remove any sudo invocation
    - Improve error handling to distinguish between "service not found" and "service is inactive"
      - Log errors for debugging
      - Return 'inactive' only when the service exists but is not running
      - Return 'error' or throw when the command itself fails
    - _Bug_Condition: isBugCondition(input) where input uses incorrect service names or incorrect systemctl syntax_
    - _Expected_Behavior: Commands use correct service names and `systemctl --user` without sudo_
    - _Preservation: Error handling patterns and return value format remain consistent_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Fix service-manager.js - controlService() function
    - Apply service name mapping to ensure consistent service name resolution
      - Use the same mapping function as in getStatus()
    - Replace `sudo systemctl` with `systemctl --user`
      - Use `systemctl --user [action] [correct-service-name]` instead of `sudo systemctl [action] [wrong-name]`
      - Remove sudo completely
    - Implement proper error handling to capture and report errors clearly
      - Reject the promise with a descriptive error message
      - Include stderr output for debugging
      - Allow the caller to handle errors appropriately
    - _Bug_Condition: isBugCondition(input) where input uses incorrect service names or sudo_
    - _Expected_Behavior: Commands use correct service names and `systemctl --user` without sudo_
    - _Preservation: Promise-based return pattern and IPC communication format remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Fix renderer.js - updateStatus() and polling loop
    - Replace hardcoded `'openclaw'` with `'openclaw-gateway'`
      - Update the polling loop to use `['openclaw-gateway', 'hermes']` instead of `['openclaw', 'hermes']`
      - Update all DOM element ID references to match the correct service names
    - Implement error handling in UI to handle error responses from service control commands
      - Check if result contains an error property
      - Display user-friendly error messages
      - Provide feedback about what went wrong
    - _Bug_Condition: isBugCondition(input) where renderer uses incorrect service names_
    - _Expected_Behavior: Renderer uses correct service names and displays errors appropriately_
    - _Preservation: UI rendering format, polling interval, and visual indicators remain unchanged_
    - _Requirements: 2.1, 3.4_

  - [x] 3.4 Fix main.js - error response handling
    - Ensure consistent error response format in IPC handlers
      - Return `{ success: true }` on success
      - Return `{ success: false, error: 'error message' }` on failure
      - Allow renderer to distinguish between success and failure
    - Verify that errors from service-manager are properly propagated to renderer
      - Catch errors from controlService() and format them appropriately
      - Include descriptive error messages for user feedback
    - _Bug_Condition: isBugCondition(input) where error handling is inadequate_
    - _Expected_Behavior: Errors are clearly communicated through IPC to renderer_
    - _Preservation: IPC communication pattern and window control functions remain unchanged_
    - _Requirements: 2.3, 3.5_

---

## Phase 4: Validation

- [ ] 4. Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - Service Commands Use Correct Names and Syntax
  - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
  - The test from task 1 encodes the expected behavior
  - When this test passes, it confirms the expected behavior is satisfied
  - Run bug condition exploration test from step 1
  - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
  - Verify that all service commands now use correct service names and `systemctl --user` syntax
  - Verify that commands execute successfully without sudo
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 5. Verify preservation tests still pass
  - **Property 2: Preservation** - Non-Service-Command Behavior Unchanged
  - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
  - Run preservation property tests from step 2
  - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
  - Confirm all tests still pass after fix (no regressions)
  - Verify that window controls, UI rendering, polling, and delays are all preserved
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

---

## Phase 5: End-to-End Testing

- [ ] 6. Write and run unit tests for service control functions
  - Test service name mapping function with valid and invalid service names
  - Test `getStatus()` with correct service names and `systemctl --user` syntax
  - Test `controlService()` with correct service names and `systemctl --user` syntax
  - Test error handling for failed commands (service not found, permission denied, etc.)
  - Test that errors are properly propagated through IPC to the renderer
  - Test that renderer correctly displays error messages to the user
  - Verify all unit tests pass
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Write and run property-based tests for service control
  - Generate random service names and verify only valid names are accepted
  - Generate random actions (start, stop, restart) and verify correct systemctl syntax is used
  - Generate random service states and verify status polling returns consistent results
  - Test that service control commands succeed for valid services and fail gracefully for invalid ones
  - Test that UI updates correctly after successful and failed commands
  - Verify all property-based tests pass
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 8. Run integration tests for full service control flow
  - Test full flow: app starts → initial status check → polling loop → user clicks button → service control → UI updates
  - Test service control in each context: start service → verify status changes → stop service → verify status changes
  - Test error scenarios: attempt to control non-existent service → verify error is displayed → verify UI remains responsive
  - Test that window controls continue to work while service operations are in progress
  - Test rapid successive service control commands to verify no race conditions
  - Verify all integration tests pass
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9. Checkpoint - Ensure all tests pass and app functions correctly
  - Run full test suite (unit, property-based, and integration tests)
  - Verify all tests pass
  - Manually test the app:
    - Start the app and verify initial status check works
    - Verify status polling updates every 10 seconds
    - Click Start button and verify service starts and UI updates
    - Click Stop button and verify service stops and UI updates
    - Click Restart button and verify service restarts and UI updates
    - Verify window controls (minimize, maximize, close) still work
    - Verify error messages display correctly for any failures
  - Document any issues found and resolve them
  - Mark complete when all tests pass and app functions correctly
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

