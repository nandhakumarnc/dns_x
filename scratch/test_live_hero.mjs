import { spawn } from 'child_process';

async function testLiveHero() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    'https://rbp-security-template.vercel.app/?utm_source=reactbits.dev&utm_medium=pro-templates-item-live&utm_campaign=free-to-pro&rb_item=security-template'
  ]);

  await new Promise(r => setTimeout(r, 6000));

  try {
    const listRes = await fetch('http://127.0.0.1:9227/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('rbp-security-template'));

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onopen = () => {
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
        console.log('LIVE SITE check result:');
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

testLiveHero();
