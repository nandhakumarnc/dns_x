import { spawn } from 'child_process';
import fs from 'fs';

async function capture() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    'https://rbp-security-template.vercel.app/'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const tabs = await listRes.json();
    console.log('Tabs:', tabs.map(t => ({ title: t.title, url: t.url, ws: t.webSocketDebuggerUrl })));
    const targetTab = tabs.find(t => t.url.includes('rbp-security-template')) || tabs[0];

    if (!targetTab) {
      console.log('No tab found');
      chrome.kill();
      return;
    }

    // Wait another 3s for full render
    await new Promise(r => setTimeout(r, 3000));

    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    ws.onopen = () => {
      // Evaluate document.body styles and background elements
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const bodyBg = window.getComputedStyle(document.body).backgroundColor;
            const dark = document.documentElement.classList.contains('dark');
            const canvases = Array.from(document.querySelectorAll('canvas')).map(c => ({
              w: c.width,
              h: c.height,
              cls: c.className,
              parentCls: c.parentElement?.className,
              display: window.getComputedStyle(c).display
            }));
            const hero = document.querySelector('section');
            const heroBg = hero ? window.getComputedStyle(hero).backgroundImage : null;
            return JSON.stringify({ bodyBg, dark, canvases, heroBg });
          })()`
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        console.log('Page Evaluation result:');
        console.log(msg.result?.result?.value);

        // Now capture screenshot
        ws.send(JSON.stringify({
          id: 2,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      } else if (msg.id === 2 && msg.result?.data) {
        fs.writeFileSync('scratch/live_view.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Saved scratch/live_view.png (size: ' + msg.result.data.length + ')');
        ws.close();
        chrome.kill();
      }
    };
  } catch (err) {
    console.error('Error during CDP capture:', err);
    chrome.kill();
  }
}

capture();
