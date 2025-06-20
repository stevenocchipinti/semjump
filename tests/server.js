// Simple HTTP server for tests
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const TEST_PAGES_DIR = path.join(__dirname, '..', 'test-pages');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath;
  
  // Handle root path
  if (url.pathname === '/' || url.pathname === '/index.html') {
    filePath = path.join(TEST_PAGES_DIR, 'index.html');
  } 
  // Handle content.mjs request
  else if (url.pathname === '/content.mjs') {
    filePath = path.join(__dirname, '..', 'content.mjs');
  } 
  // Handle other paths in test-pages folder
  else {
    filePath = path.join(TEST_PAGES_DIR, url.pathname);
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});