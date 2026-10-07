import { spawn } from 'child_process';

async function getDetailedConsoleError() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9247',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1440,900',
    'http://localhost:5173/landing.html'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch('http://127.0.0.1:9247/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('landing.html'));
    if (!tab) {
      console.log('No tab found');
      chrome.kill();
      return;
    }
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[Console]', msg.params.type, JSON.stringify(msg.params.args.map(a => a.value || a.description || a.preview)));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('[Exception]', msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
      }
    };

    setTimeout(() => {
      ws.close();
      chrome.kill();
    }, 6000);
  } catch(err) {
    console.error(err);
    chrome.kill();
  }
}

getDetailedConsoleError();
