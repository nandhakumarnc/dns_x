import { spawn } from 'child_process';
import fs from 'fs';

async function captureLocalGPU() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9242',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1440,900',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 6000));

  try {
    const listRes = await fetch('http://127.0.0.1:9242/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('5173'));
    if (!tab) {
      console.log('No 5173 tab found');
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
            const iDoc = iframe?.contentDocument || iframe?.contentWindow?.document || document;
            const canvases = iDoc.querySelectorAll('canvas');
            const canvas0 = canvases[0];
            return JSON.stringify({
              totalCanvases: canvases.length,
              canvas0: canvas0 ? {
                width: canvas0.width,
                height: canvas0.height,
                style: canvas0.getAttribute('style'),
                parentDisplay: window.getComputedStyle(canvas0.parentElement).display,
                parentOpacity: window.getComputedStyle(canvas0.parentElement).opacity
              } : null
            });
          })()`
        }
      }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === 1) {
        console.log('Local canvas 0 info:', msg.result?.result?.value);
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
  } catch(err) {
    console.error(err);
    chrome.kill();
  }
}

captureLocalGPU();
