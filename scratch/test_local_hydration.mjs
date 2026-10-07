import { spawn } from 'child_process';

async function testHydration() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    'http://localhost:5173/landing.html'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch('http://127.0.0.1:9226/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('5173'));

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onopen = () => {
      // Evaluate document
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const hero = document.querySelector('section');
            const heroCanvases = hero ? hero.querySelectorAll('canvas').length : 0;
            const allCanvases = document.querySelectorAll('canvas').length;
            const videos = Array.from(document.querySelectorAll('video')).map(v => ({ src: v.src, paused: v.paused, readyState: v.readyState }));
            return JSON.stringify({ heroCanvases, allCanvases, videos });
          })()`
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        console.log('Hydration check result:');
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

testHydration();
