import { spawn } from 'child_process';

async function inspectLocalCanvasZero() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    'http://localhost:5173/landing.html'
  ]);

  await new Promise(r => setTimeout(r, 6000));

  try {
    const listRes = await fetch('http://127.0.0.1:9233/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('5173'));

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const c = document.querySelectorAll('canvas')[0];
            if (!c) return 'No canvas 0';
            const gl = c.getContext('webgl2') || c.getContext('webgl');
            let parent = c;
            const chain = [];
            while (parent && parent.tagName !== 'BODY') {
              const comp = window.getComputedStyle(parent);
              chain.push({
                tag: parent.tagName,
                cls: parent.className,
                opacity: comp.opacity,
                display: comp.display,
                visibility: comp.visibility,
                zIndex: comp.zIndex,
                maskImage: comp.maskImage || comp.webkitMaskImage
              });
              parent = parent.parentElement;
            }
            return JSON.stringify({ chain });
          })()`
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        console.log('Local Canvas 0 chain:');
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

inspectLocalCanvasZero();
