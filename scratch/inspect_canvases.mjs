import { spawn } from 'child_process';

async function inspectCanvases() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--disable-gpu',
    '--no-sandbox',
    'https://rbp-security-template.vercel.app/?utm_source=reactbits.dev&utm_medium=pro-templates-item-live&utm_campaign=free-to-pro&rb_item=security-template'
  ]);

  await new Promise(r => setTimeout(r, 6000));

  try {
    const listRes = await fetch('http://127.0.0.1:9228/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('rbp-security-template'));

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const list = [];
            document.querySelectorAll('canvas').forEach((c, i) => {
              const rect = c.getBoundingClientRect();
              const parent = c.parentElement;
              list.push({
                index: i,
                width: c.width,
                height: c.height,
                top: rect.top + window.scrollY,
                parentTag: parent.tagName,
                parentClass: parent.className,
                grandParentClass: parent.parentElement?.className,
                textNearby: parent.parentElement?.textContent?.slice(0, 100)
              });
            });
            return JSON.stringify(list, null, 2);
          })()`
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        console.log('Canvases on page:');
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

inspectCanvases();
