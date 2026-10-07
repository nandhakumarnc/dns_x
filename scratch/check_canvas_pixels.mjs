import { spawn } from 'child_process';

async function checkCanvas0Pixels() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9231',
    '--disable-gpu',
    '--no-sandbox',
    'https://rbp-security-template.vercel.app/?utm_source=reactbits.dev&utm_medium=pro-templates-item-live&utm_campaign=free-to-pro&rb_item=security-template'
  ]);

  await new Promise(r => setTimeout(r, 6000));

  try {
    const listRes = await fetch('http://127.0.0.1:9231/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('rbp-security-template'));

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const c = document.querySelectorAll('canvas')[0];
            if (!c) return { error: 'No canvas' };
            const ctx = c.getContext('webgl') || c.getContext('webgl2') || c.getContext('2d');
            const dataUrl = c.toDataURL('image/png');
            return { width: c.width, height: c.height, dataUrlLen: dataUrl.length };
          })()`
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        console.log('Canvas 0 dataURL info:', msg.result?.result?.value);
        ws.close();
        chrome.kill();
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}

checkCanvas0Pixels();
