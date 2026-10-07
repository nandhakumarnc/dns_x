import { spawn } from 'child_process';
import fs from 'fs';

async function inspectDom() {
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
    const targetTab = tabs.find(t => t.url.includes('rbp-security-template'));

    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const results = [];
            // Inspect all sections and backgrounds
            document.querySelectorAll('*').forEach(el => {
              const style = window.getComputedStyle(el);
              const bg = style.backgroundImage;
              if (bg && bg !== 'none') {
                results.push({
                  tag: el.tagName,
                  id: el.id,
                  cls: el.className,
                  bg: bg.slice(0, 150),
                  rect: { w: el.offsetWidth, h: el.offsetHeight, top: el.offsetTop }
                });
              }
            });
            return JSON.stringify(results, null, 2);
          })()`
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        console.log('Background elements on live site:');
        console.log(msg.result?.result?.value);
        ws.close();
        chrome.kill();
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}

inspectDom();
