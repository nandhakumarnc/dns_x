import { spawn } from 'child_process';
import fs from 'fs';

async function captureLiveGPU() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9241',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1440,900',
    'https://rbp-security-template.vercel.app/?utm_source=reactbits.dev&utm_medium=pro-templates-item-live&utm_campaign=free-to-pro&rb_item=security-template'
  ]);

  await new Promise(r => setTimeout(r, 6000));

  try {
    const listRes = await fetch('http://127.0.0.1:9241/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('rbp-security-template'));
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
            const v = document.querySelector('video');
            return JSON.stringify(v ? { paused: v.paused, currentTime: v.currentTime, duration: v.duration, videoWidth: v.videoWidth, src: v.src } : 'no video');
          })()`
        }
      }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === 1) {
        console.log('Live video state:', msg.result?.result?.value);
        ws.send(JSON.stringify({
          id: 2,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      } else if (msg.id === 2 && msg.result?.data) {
        fs.writeFileSync('scratch/live_gpu_screenshot.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Saved scratch/live_gpu_screenshot.png, size:', msg.result.data.length);
        ws.close();
        chrome.kill();
      }
    };
  } catch(err) {
    console.error(err);
    chrome.kill();
  }
}

captureLiveGPU();
