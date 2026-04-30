# AgentFlow v1.0.0 Release

## 📦 Packages Available

Two distribution formats are available in the `dist/` directory:

### 1. Debian Package (.deb)
**File**: `agent-flow_1.0.0_amd64.deb` (79 MB)

**Installation**:
```bash
sudo dpkg -i dist/agent-flow_1.0.0_amd64.deb
```

**Launch**:
```bash
agentflow
```

**Uninstall**:
```bash
sudo apt remove agent-flow
```

### 2. AppImage (Universal Linux)
**File**: `AgentFlow-1.0.0.AppImage` (114 MB)

**Installation**:
```bash
chmod +x dist/AgentFlow-1.0.0.AppImage
./dist/AgentFlow-1.0.0.AppImage
```

**Optional - Create Desktop Shortcut**:
```bash
mkdir -p ~/.local/share/applications
cat > ~/.local/share/applications/agentflow.desktop << EOF
[Desktop Entry]
Type=Application
Name=AgentFlow
Exec=$HOME/path/to/AgentFlow-1.0.0.AppImage
Icon=application-x-executable
Categories=Utility;
EOF
```

## ✨ Features

- **Real-time Monitoring**: Check service status for OpenClaw and Hermes agents
- **One-Click Control**: Start, Stop, and Restart services
- **Glassmorphism UI**: Modern dark-mode dashboard with smooth animations
- **Service Logs**: View recent service logs
- **Configurable Settings**: Customize service names and polling intervals
- **Linux Native**: Direct systemd integration for user-level services

## 🔧 System Requirements

- Ubuntu 18.04+ or any modern Linux distribution
- systemd (for service management)
- User-level systemd services configured:
  - `openclaw-gateway`
  - `hermes-gateway`

## 📋 Configuration

Default service names:
- **OpenClaw**: `openclaw-gateway`
- **Hermes**: `hermes-gateway`

These can be customized in the app's Settings tab.

## 🐛 Troubleshooting

### App won't start
- Ensure you have the required dependencies installed
- Check that systemd is running: `systemctl --user status`

### Services not detected
- Verify services exist: `systemctl --user list-units --type=service | grep gateway`
- Check service names in Settings tab

### Permission issues
- Ensure you're running the app as your user (not root)
- User-level services don't require sudo

## 📝 Release Notes

### v1.0.0 (2026-04-30)
- Initial release
- Service monitoring and control
- Logs viewer
- Settings configuration
- Glassmorphism UI design

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues or feature requests, please contact the development team.

---

**Built with**: Electron 41.3.0 | Node.js | Electron Builder
