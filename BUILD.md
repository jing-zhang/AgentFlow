# Building AgentFlow

This guide explains how to build and package AgentFlow for distribution.

## Prerequisites

- Node.js 16+ and npm
- Linux system (for building Linux packages)
- `dpkg` and `fakeroot` (for building .deb packages)

## Installation

```bash
npm install
```

## Building

### Development Mode

```bash
npm start
```

### Build Packages

Build all Linux packages (deb + AppImage):
```bash
npm run build:linux
```

Build only .deb package:
```bash
npm run build:deb
```

Build only AppImage:
```bash
npm run build:appimage
```

## Output

Built packages will be in the `dist/` directory:
- `AgentFlow-1.0.0.deb` - Debian package (for Ubuntu/Debian)
- `AgentFlow-1.0.0.AppImage` - AppImage (universal Linux package)

## Installation

### From .deb package:
```bash
sudo dpkg -i dist/AgentFlow-1.0.0.deb
agentflow
```

### From AppImage:
```bash
chmod +x dist/AgentFlow-1.0.0.AppImage
./dist/AgentFlow-1.0.0.AppImage
```

## Configuration

AgentFlow uses the following service names by default:
- **OpenClaw**: `openclaw-gateway`
- **Hermes**: `hermes-gateway`

These can be customized in the app's Settings tab.

## Troubleshooting

### Build fails with "icon not found"
Ensure `assets/icon.png` exists. You can convert the SVG:
```bash
convert assets/icon.svg -resize 512x512 assets/icon.png
```

### Permission denied when running AppImage
Make it executable:
```bash
chmod +x AgentFlow-1.0.0.AppImage
```

## License

MIT License - See LICENSE file for details
