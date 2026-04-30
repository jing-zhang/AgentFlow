#!/bin/bash
# AgentFlow launcher script
# This script runs AgentFlow without opening a terminal

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the AppImage with --no-sandbox flag in the background
# Redirect output to /dev/null to suppress any terminal output
"$SCRIPT_DIR/dist/AgentFlow-1.0.0.AppImage" --no-sandbox > /dev/null 2>&1 &

# Exit immediately without waiting for the app to finish
exit 0
