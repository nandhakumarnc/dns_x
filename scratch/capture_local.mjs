import { spawn } from 'child_process';
import fs from 'fs';

async function captureLocal() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch('http://127.0.0.1:9223/json/list');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.url.includes('5173'));

    if (!targetTab) {
      console.log('No 5173 tab found');
      chrome.kill();
      return;
    }

    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const iframe = document.querySelector('iframe');
            const iDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
            const dark = iDoc?.documentElement.classList.contains('dark');
            const bg = iDoc ? window.getComputedStyle(iDoc.body).backgroundColor : null;
            return JSON.stringify({ dark, bg });
          })()`
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        console.log('Local Page result:', msg.result?.result?.value);
        ws.send(JSON.stringify({
          id: 2,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      } else if (msg.id === 2 && msg.result?.data) {
        fs.writeFileSync('scratch/local_view.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Saved scratch/local_view.png (size: ' + msg.result.data.length + ')');
        ws.close();
        chrome.kill();
      }
    };
  } catch (err) {
    console.error('Error during local capture:', err);
    chrome.kill();
  }
}

captureLocal();
