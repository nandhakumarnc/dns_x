import { spawn } from 'child_process';
import fs from 'fs';

async function captureProper() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9246',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1440,900',
    'http://localhost:5173/'
  ]);

  // Wait 7 seconds for iframe and WebGL canvas to fully initialize
  await new Promise(r => setTimeout(r, 7000));

  try {
    const listRes = await fetch('http://127.0.0.1:9246/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('5173'));
    if (!tab) {
      console.log('No tab found');
      chrome.kill();
      return;
    }
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const iframe = document.querySelector('iframe');
            const iDoc = iframe ? (iframe.contentDocument || iframe.contentWindow.document) : document;
            const canvases = iDoc.querySelectorAll('canvas');
            const h1 = iDoc.querySelector('h1')?.textContent;
            const badge = iDoc.querySelector('.backdrop-blur-md')?.textContent;
            const previewTitle = iDoc.querySelector('h2')?.textContent;
            return {
              canvasCount: canvases.length,
              h1,
              badge,
              previewTitle
            };
          })()`,
          returnByValue: true
        }
      }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === 1) {
        console.log('DOM Evaluation:', msg.result?.result?.value);
        ws.send(JSON.stringify({
          id: 2,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      } else if (msg.id === 2 && msg.result?.data) {
        fs.writeFileSync('scratch/local_current.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Saved scratch/local_current.png, size:', msg.result.data.length);
        ws.close();
        chrome.kill();
      }
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

captureProper();
