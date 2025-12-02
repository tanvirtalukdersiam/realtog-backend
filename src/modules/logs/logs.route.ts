import { Router, Request, Response } from 'express';
import { LogStream } from '@utils/logStream.js';

const router: Router = Router();

// sse endpoint for live logs
router.get('/stream', (req: Request, res: Response) => {
  LogStream.addClient(res);
});

// html page to view logs
router.get('/view', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Logs Viewer</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 20px;
    }
    .header {
      background: #252526;
      padding: 15px 20px;
      border-radius: 5px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    .header h1 {
      color: #4ec9b0;
      font-size: 24px;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #f48771;
      animation: pulse 2s infinite;
    }
    .status-indicator.connected {
      background: #4ec9b0;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .controls {
      margin-bottom: 15px;
      display: flex;
      gap: 10px;
    }
    button {
      padding: 8px 16px;
      background: #0e639c;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    button:hover {
      background: #1177bb;
    }
    button:active {
      background: #0a4d73;
    }
    .log-container {
      background: #252526;
      border-radius: 5px;
      padding: 15px;
      max-height: calc(100vh - 200px);
      overflow-y: auto;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    .log-entry {
      padding: 8px 12px;
      margin-bottom: 5px;
      border-radius: 3px;
      border-left: 3px solid #858585;
      background: #1e1e1e;
      word-wrap: break-word;
      font-size: 13px;
      line-height: 1.5;
    }
    .log-entry.error {
      border-left-color: #f48771;
      background: #3a1d1d;
    }
    .log-entry.warn {
      border-left-color: #ce9178;
      background: #3a2f1d;
    }
    .log-entry.info {
      border-left-color: #4ec9b0;
      background: #1d2d2d;
    }
    .log-entry.debug {
      border-left-color: #569cd6;
      background: #1d252d;
    }
    .log-timestamp {
      color: #858585;
      font-size: 11px;
      margin-right: 10px;
    }
    .log-level {
      font-weight: bold;
      margin-right: 10px;
      text-transform: uppercase;
    }
    .log-level.error { color: #f48771; }
    .log-level.warn { color: #ce9178; }
    .log-level.info { color: #4ec9b0; }
    .log-level.debug { color: #569cd6; }
    .log-message {
      color: #d4d4d4;
    }
    .log-stack {
      color: #ce9178;
      margin-top: 5px;
      padding-left: 20px;
      font-size: 11px;
      white-space: pre-wrap;
    }
    .empty-state {
      text-align: center;
      color: #858585;
      padding: 40px;
      font-style: italic;
    }
    ::-webkit-scrollbar {
      width: 10px;
    }
    ::-webkit-scrollbar-track {
      background: #1e1e1e;
    }
    ::-webkit-scrollbar-thumb {
      background: #424242;
      border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #4e4e4e;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Live Logs Viewer</h1>
    <div class="status">
      <div class="status-indicator" id="statusIndicator"></div>
      <span id="statusText">Connecting...</span>
    </div>
  </div>
  
  <div class="controls">
    <button onclick="clearLogs()">Clear Logs</button>
    <button onclick="toggleAutoScroll()">Auto Scroll: <span id="autoScrollText">ON</span></button>
  </div>
  
  <div class="log-container" id="logContainer">
    <div class="empty-state">Waiting for logs...</div>
  </div>

  <script>
    let autoScroll = true;
    let eventSource = null;
    const logContainer = document.getElementById('logContainer');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const autoScrollText = document.getElementById('autoScrollText');

    function connect() {
      eventSource = new EventSource('/logs/stream');
      
      eventSource.onopen = () => {
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Connected';
        logContainer.innerHTML = '';
      };
      
      eventSource.onerror = () => {
        statusIndicator.classList.remove('connected');
        statusText.textContent = 'Disconnected';
        eventSource.close();
        setTimeout(connect, 3000);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const log = JSON.parse(event.data);
          
          if (log.type === 'connected') {
            return;
          }
          
          addLogEntry(log);
        } catch (error) {
          console.error('Error parsing log:', error);
        }
      };
    }

    function addLogEntry(log) {
      if (logContainer.querySelector('.empty-state')) {
        logContainer.innerHTML = '';
      }
      
      const entry = document.createElement('div');
      entry.className = \`log-entry \${log.level}\`;
      
      const levelClass = log.level === 'error' ? 'error' : 
                        log.level === 'warn' ? 'warn' :
                        log.level === 'info' ? 'info' : 'debug';
      
      entry.innerHTML = \`
        <span class="log-timestamp">\${log.timestamp || ''}</span>
        <span class="log-level \${levelClass}">\${log.level || 'log'}</span>
        <span class="log-message">\${escapeHtml(log.message || '')}</span>
        \${log.stack ? \`<div class="log-stack">\${escapeHtml(log.stack)}</div>\` : ''}
      \`;
      
      logContainer.appendChild(entry);
      
      if (autoScroll) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function clearLogs() {
      logContainer.innerHTML = '<div class="empty-state">Logs cleared</div>';
    }

    function toggleAutoScroll() {
      autoScroll = !autoScroll;
      autoScrollText.textContent = autoScroll ? 'ON' : 'OFF';
      if (autoScroll) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }

    // connect on page load
    connect();
    
    // reconnect on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && (!eventSource || eventSource.readyState === EventSource.CLOSED)) {
        connect();
      }
    });
  </script>
</body>
</html>
  `);
});

export default router;

