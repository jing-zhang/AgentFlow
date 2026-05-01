#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a simple 512x512 PNG icon using raw pixel data
// This creates a gradient purple-blue circle on dark background

function createPNG(width, height) {
    // PNG signature
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // IHDR chunk (image header)
    const ihdr = Buffer.alloc(25);
    ihdr.writeUInt32BE(13, 0); // chunk length
    ihdr.write('IHDR', 4);
    ihdr.writeUInt32BE(width, 8);
    ihdr.writeUInt32BE(height, 12);
    ihdr[16] = 8; // bit depth
    ihdr[17] = 2; // color type (RGB)
    ihdr[18] = 0; // compression
    ihdr[19] = 0; // filter
    ihdr[20] = 0; // interlace
    
    // Calculate CRC for IHDR
    const crc32 = (buf) => {
        let crc = 0xffffffff;
        for (let i = 0; i < buf.length; i++) {
            crc = crc ^ buf[i];
            for (let j = 0; j < 8; j++) {
                crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
            }
        }
        return (crc ^ 0xffffffff) >>> 0;
    };
    
    const ihdrCrc = Buffer.alloc(4);
    ihdrCrc.writeUInt32BE(crc32(ihdr.slice(4, 21)), 0);
    
    // Create image data - simple gradient
    const pixelData = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    for (let y = 0; y < height; y++) {
        pixelData.push(0); // filter type for this row
        for (let x = 0; x < width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < radius) {
                // Inside circle - gradient from purple to blue
                const ratio = dist / radius;
                const r = Math.floor(139 * (1 - ratio) + 59 * ratio);
                const g = Math.floor(92 * (1 - ratio) + 130 * ratio);
                const b = Math.floor(246 * (1 - ratio) + 246 * ratio);
                pixelData.push(r, g, b);
            } else if (dist < radius + 5) {
                // Border - lighter
                pixelData.push(100, 100, 150);
            } else {
                // Outside - dark background
                pixelData.push(15, 17, 21);
            }
        }
    }
    
    // Compress the image data
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(Buffer.from(pixelData));
    
    // IDAT chunk (image data)
    const idat = Buffer.alloc(12 + compressed.length);
    idat.writeUInt32BE(compressed.length, 0);
    idat.write('IDAT', 4);
    compressed.copy(idat, 8);
    
    const idatCrc = Buffer.alloc(4);
    idatCrc.writeUInt32BE(crc32(idat.slice(4, 8 + compressed.length)), 0);
    
    // IEND chunk
    const iend = Buffer.from([
        0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82
    ]);
    
    return Buffer.concat([signature, ihdr, ihdrCrc, idat, idatCrc, iend]);
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

const pngBuffer = createPNG(512, 512);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), pngBuffer);
console.log('512x512 icon created at assets/icon.png');
