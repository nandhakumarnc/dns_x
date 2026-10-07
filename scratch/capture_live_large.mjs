import { spawn } from 'child_process';
import fs from 'fs';

async function captureLiveLarge() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    'https://rbp-security-template.vercel.app/?utm_source=reactbits.dev&utm_medium=pro-templates-item-live&utm_campaign=free-to-pro&rb_item=security-template'
  ]);

  await new Promise(r => setTimeout(r, 6000));

  try {
    const listRes = await fetch('http://127.0.0.1:9224/json/list');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.url.includes('rbp-security-template'));

    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Emulation.setDeviceMetricsOverride',
        params: {
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false
        }
      }));
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 2,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      }, 1000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 2 && msg.result?.data) {
        fs.writeFileSync('scratch/live_site_large.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Saved scratch/live_site_large.png, length:', msg.result.data.length);
        ws.close();
        chrome.kill();
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}

captureLiveLarge();
