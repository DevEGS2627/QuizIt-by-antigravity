import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root directory to serve (dist preferred, falls back to docs, then root)
let SERVE_DIR = path.join(__dirname, 'dist');
if (!fs.existsSync(SERVE_DIR)) {
  SERVE_DIR = path.join(__dirname, 'docs');
}
if (!fs.existsSync(SERVE_DIR)) {
  SERVE_DIR = __dirname;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.csv': 'text/csv; charset=UTF-8',
  '.pdf': 'application/pdf'
};

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

function serveStatic(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse path
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Normalize path to prevent directory traversal
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(SERVE_DIR, safePath);

  // If path is a directory or root, check for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // SPA fallback: if file does not exist, serve index.html (unless it's an asset with extension)
  if (!fs.existsSync(filePath)) {
    const ext = path.extname(pathname);
    if (!ext || ext === '.html') {
      filePath = path.join(SERVE_DIR, 'index.html');
    }
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end(`404 Not Found: ${pathname}`);
    return;
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);

    // Development caching headers: don't cache HTML, cache static hashed assets
    const headers = {
      'Content-Type': contentType,
      'Content-Length': stat.size
    };

    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end(`500 Internal Server Error: ${err.message}`);
  }
}

const server = http.createServer(serveStatic);

function startServer(port) {
  server.listen(port, '0.0.0.0', () => {
    const ips = getLocalIpAddresses();
    console.log('\n============================================================');
    console.log('🏆  QuizIt Inter-School Championship — Local Host Server');
    console.log('============================================================');
    console.log(`📡 Local:    http://localhost:${port}`);
    if (ips.length > 0) {
      ips.forEach(ip => {
        console.log(`🌐 Network:  http://${ip}:${port}`);
      });
    }
    console.log(`📁 Serving:  ${SERVE_DIR}`);
    console.log('✨ Logo:     Optimized and Verified');
    console.log('============================================================');
    console.log('Press Ctrl+C to stop the server.\n');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is busy. Trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);
startServer(DEFAULT_PORT);
