# Bugfix Requirements: AgentFlow Service Control

## Introduction

AgentFlow is an Electron desktop application designed to monitor and control AI agent services (openclaw-gateway and hermes) on Ubuntu Linux. The app has a polished glassmorphism UI with real-time status monitoring, but the core functionality is broken: service status checks don't reflect actual system state, control buttons don't execute commands, and the app cannot properly interact with systemctl due to incorrect command syntax and privilege handling.

This bugfix addresses the fundamental issue that the app cannot reliably monitor or control user-level systemd services. The fix must ensure accurate status reporting and functional service control through proper systemctl integration.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the app checks service status using `systemctl is-active openclaw` THEN the command fails because the service name is incorrect (should be `openclaw-gateway`)

1.2 WHEN the app attempts to control services using `sudo systemctl [action] openclaw` THEN the command fails due to incorrect service name and unnecessary sudo (user-level services don't require sudo)

1.3 WHEN the app executes service control commands THEN the commands fail silently or require manual password entry, preventing the UI from updating with actual service state

1.4 WHEN the user clicks Start/Stop/Restart buttons THEN the services are not actually controlled, and the UI status remains inaccurate

1.5 WHEN the app polls for status updates every 10 seconds THEN the status displayed does not reflect the actual systemd service state

### Expected Behavior (Correct)

2.1 WHEN the app checks service status THEN it SHALL use the correct service names (`openclaw-gateway` and `hermes`) with `systemctl --user is-active`

2.2 WHEN the app executes service control commands THEN it SHALL use `systemctl --user [action] [service-name]` without sudo, since these are user-level services

2.3 WHEN the app executes a service control command THEN the command SHALL execute successfully without requiring manual password entry or user interaction

2.4 WHEN the user clicks a Start/Stop/Restart button THEN the service SHALL be controlled and the UI SHALL update to reflect the actual service state

2.5 WHEN the app polls for status updates THEN the status displayed SHALL accurately reflect the current systemd service state

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the app starts THEN it SHALL perform an initial status check for both services

3.2 WHEN the app is running THEN it SHALL continue to poll for status updates every 10 seconds

3.3 WHEN a service control command completes THEN the app SHALL update the UI with a small delay (1 second) to allow the system to process the change

3.4 WHEN the app displays service status THEN it SHALL show "ACTIVE" or "STOPPED" with appropriate visual indicators (ring color, status text, info message)

3.5 WHEN the user interacts with window controls (minimize, maximize, close) THEN these functions SHALL continue to work as currently implemented
