// ═══════════════════════════════════════════════════════════
//  ORUM Dashboard — Servidor proxy para API Rentman
//  Deploy en Railway: https://railway.app
// ═══════════════════════════════════════════════════════════

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT  = process.env.PORT || 3000;
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZWRld2Vya2VyIjoyMzUsImFjY291bnQiOiJzZXJ2aWNpb3N5YWxxdWlsZXJwYXJhZXZlbnRvc3NsIiwiY2xpZW50X3R5cGUiOiJvcGVuYXBpIiwiY2xpZW50Lm5hbWUiOiJvcGVuYXBpIiwiZXhwIjoyMDc3Njg4MDM1LCJpc3MiOiJ7XCJuYW1lXCI6XCJiYWNrZW5kXCIsXCJ2ZXJzaW9uXCI6XCI0Ljc5Mi4wLjVcIn0iLCJpYXQiOjE3NjIxNTUyMzV9.n9S5Khx57V1AZXg31VnBdu7V3_bOKsJiNzagR4D7H4k';

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // /api/* → proxy a Rentman
  if (parsed.pathname.startsWith('/api/')) {
    const endpoint = parsed.pathname.replace('/api', '');
    const qs = parsed.search || '';
    const options = {
      hostname: 'api.rentman.net',
      path: endpoint + qs,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
      }
    };
    const proxy = https.request(options, (r) => {
      res.writeHead(r.statusCode, { 'Content-Type': 'application/json' });
      r.pipe(res);
    });
    proxy.on('error', (e) => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
    proxy.end();
    return;
  }

  // / → dashboard.html
  if (parsed.pathname === '/' || parsed.pathname === '/dashboard') {
    const file = path.join(__dirname, 'dashboard.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('No encontrado'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(file).pipe(res);
    return;
  }

  // /health → para Railway
  if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'ORUM Dashboard' }));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ ORUM Dashboard corriendo en puerto ${PORT}`);
});
