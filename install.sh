#!/bin/bash
# AgentFlow Installation Script
# This script installs AgentFlow to /opt/agentflow and creates a desktop launcher

set -e

echo "Installing AgentFlow..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "This script must be run as root (use sudo)"
    exit 1
fi

# Create installation directory
mkdir -p /opt/agentflow

# Copy files
echo "Copying files..."
cp -r dist /opt/agentflow/
cp agentflow.sh /opt/agentflow/
chmod +x /opt/agentflow/agentflow.sh

# Create desktop launcher
echo "Creating desktop launcher..."
cp agentflow.desktop /usr/share/applications/agentflow.desktop
chmod 644 /usr/share/applications/agentflow.desktop

# Update desktop database
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database /usr/share/applications/
fi

echo "✓ AgentFlow installed successfully!"
echo ""
echo "You can now:"
echo "  1. Launch from application menu (search for 'AgentFlow')"
echo "  2. Run from terminal: /opt/agentflow/agentflow.sh"
echo "  3. Create a desktop shortcut by dragging the app from the menu"
