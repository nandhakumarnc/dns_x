import { spawn } from 'child_process';

async function checkErrors() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:5173/landing.html'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch('http://127.0.0.1:9230/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('5173'));

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Console.messageAdded' || msg.method === 'Runtime.consoleAPICalled' || msg.method === 'Log.entryAdded') {
        console.log('Browser log:', JSON.stringify(msg.params));
      }
    };

    await new Promise(r => setTimeout(r, 6000));
    ws.close();
    chrome.kill();
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}

checkErrors();
