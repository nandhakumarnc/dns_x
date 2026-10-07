import { spawn } from 'child_process';
import fs from 'fs';

async function testVideoPlay() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9234',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    'http://localhost:5173/landing.html'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch('http://127.0.0.1:9234/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('5173'));

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const v = document.querySelector('video');
            if (!v) return 'No video element found in DOM';
            return {
              src: v.src,
              paused: v.paused,
              currentTime: v.currentTime,
              videoWidth: v.videoWidth,
              videoHeight: v.videoHeight,
              readyState: v.readyState
            };
          })()`
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        console.log('Video check:', msg.result?.result?.value);
        ws.close();
        chrome.kill();
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}

testVideoPlay();
