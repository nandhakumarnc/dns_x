import { spawn } from 'child_process';
import fs from 'fs';

async function verifyMotion() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9245',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1440,900',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch('http://127.0.0.1:9245/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('5173'));
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let frame1, frame2;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Page.captureScreenshot',
        params: { format: 'png' }
      }));
    };

    ws.onmessage = async (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === 1 && msg.result?.data) {
        frame1 = Buffer.from(msg.result.data, 'base64');
        fs.writeFileSync('scratch/frame1.png', frame1);
        console.log('Frame 1 captured (size: ' + frame1.length + ')');
        await new Promise(r => setTimeout(r, 1500));
        ws.send(JSON.stringify({
          id: 2,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      } else if (msg.id === 2 && msg.result?.data) {
        frame2 = Buffer.from(msg.result.data, 'base64');
        fs.writeFileSync('scratch/frame2.png', frame2);
        console.log('Frame 2 captured (size: ' + frame2.length + ')');
        
        const diff = !frame1.equals(frame2);
        console.log('Frames are different (motion verified):', diff);
        ws.close();
        chrome.kill();
      }
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

verifyMotion();
