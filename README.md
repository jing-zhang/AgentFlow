# 🚀 AgentFlow

**AgentFlow** is a modern, premium cross-platform desktop application designed to monitor and control AI agents (OpenClaw and Hermes) directly from your Ubuntu desktop. Built with Electron and high-performance web technologies, it features a stunning glassmorphism interface.

![AgentFlow Mockup](https://raw.githubusercontent.com/placeholder-path-to-image.png)

## ✨ Features

- **Real-time Monitoring**: Instant status updates for `openclaw-gateway` and `hermes-gateway` services.
- **One-Click Control**: Start, Stop, and Restart agents with intuitive buttons.
- **Glassmorphism UI**: A sleek, dark-mode dashboard with smooth animations and glowing indicators.
- **Linux Native Integration**: Communicates directly with `systemd` to manage background services.
- **Service Logs**: View recent service logs for debugging and monitoring.
- **Configurable Settings**: Customize service names and polling intervals.
- **Cross-Platform Ready**: Architected to support macOS and Windows in future releases.

## 📦 Installation

### Option 1: Debian Package (Ubuntu/Debian) - Recommended

```bash
sudo dpkg -i dist/agent-flow_1.0.0_amd64.deb
agentflow
```

### Option 2: AppImage with Launcher Script

```bash
chmod +x agentflow.sh
./agentflow.sh
```

Or install system-wide:
```bash
sudo bash install.sh
# Then launch from application menu or run: /opt/agentflow/agentflow.sh
```

### Option 3: AppImage (Universal Linux)

```bash
chmod +x dist/AgentFlow-1.0.0.AppImage
./dist/AgentFlow-1.0.0.AppImage --no-sandbox
```

Or use the provided launcher script:
```bash
./dist/agentflow
```

### Option 4: From Source

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd agent-flow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the app**:
   ```bash
   npm start
   ```

## 🚀 Running the App

To launch AgentFlow on Ubuntu, use the standard start command:

```bash
npm start
```

Or if installed via package:

```bash
agentflow
```

> [!IMPORTANT]
> **Do NOT run with `sudo`**. Running graphical apps with `sudo` can cause display and permission errors. 
> AgentFlow will prompt for your password in the terminal only when it needs to execute a system command.

## ⚙️ Configuration

AgentFlow uses the following service names by default:
- **OpenClaw**: `openclaw-gateway`
- **Hermes**: `hermes-gateway`

If your system services have different names, you can update them in the app's **Settings** tab.

### Service Control Commands

You can also control services manually from the terminal:

**OpenClaw Gateway**:
```bash
systemctl --user start openclaw-gateway
systemctl --user stop openclaw-gateway
systemctl --user restart openclaw-gateway
systemctl --user status openclaw-gateway
```

**Hermes Gateway**:
```bash
systemctl --user start hermes-gateway
systemctl --user stop hermes-gateway
systemctl --user restart hermes-gateway
systemctl --user status hermes-gateway
```

## 🖥 Troubleshooting

### AppImage Issues

**FUSE Error**: `dlopen(): error loading libfuse.so.2`
```bash
sudo apt-get install libfuse2
```

**Sandbox Error**: `The SUID sandbox helper binary was not configured correctly`
- Run with `--no-sandbox` flag: `./AgentFlow-1.0.0.AppImage --no-sandbox`
- Or use the launcher script: `./dist/agentflow`
- Or install the .deb package instead (recommended)

### Sandbox Errors
If you encounter SUID sandbox errors on Linux, use the `--no-sandbox` flag or install the .deb package which handles this automatically.

### GPU / VSync Errors
For better stability on Ubuntu, the app runs with the `--disable-gpu` flag by default.

### Services Not Detected
Verify that your services exist:
```bash
systemctl --user list-units --type=service | grep gateway
```

### App Won't Start
- Ensure systemd is running: `systemctl --user status`
- Check that you have the required dependencies installed
- Try running from source: `npm install && npm start`
- For AppImage, try with `--no-sandbox` flag

## 🏗️ Building Packages

To create distributable packages:

```bash
npm install
npm run build:linux          # Build both .deb and AppImage
npm run build:deb            # Build only .deb package
npm run build:appimage       # Build only AppImage
```

Built packages will be in the `dist/` directory.

See [BUILD.md](BUILD.md) for detailed build instructions.

## 📋 System Requirements

- Ubuntu 18.04+ or any modern Linux distribution
- Node.js 16+ (for development)
- systemd (for service management)
- User-level systemd services configured

## 📝 Tabs

### Overview
- Real-time service status monitoring
- Start, Stop, Restart controls
- Activity monitor chart

### Logs
- View recent service logs
- Refresh logs on demand
- Separate logs for each service

### Settings
- Configure service names
- Adjust status poll interval (5-60 seconds)
- Settings persist across app restarts

## 📜 License

MIT License - feel free to customize and expand for your own agents!
