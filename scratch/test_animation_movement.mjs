import { spawn } from 'child_process';

async function testAnimationMovement() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9243',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1440,900',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch('http://127.0.0.1:9243/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('5173'));
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    ws.onopen = () => {
      // Check video and animation state at t=0
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const iframe = document.querySelector('iframe');
            const iDoc = iframe?.contentDocument || iframe?.contentWindow?.document || document;
            const video = iDoc.querySelector('video') || window.__heroVideo;
            const c = iDoc.querySelectorAll('canvas')[0];
            return {
              hasCanvas: !!c,
              canvasW: c?.width,
              canvasH: c?.height,
              hasVideo: !!video,
              videoPaused: video?.paused,
              videoCurrentTime: video?.currentTime
            };
          })()`,
          returnByValue: true
        }
      }));
    };

    ws.onmessage = async (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === 1) {
        console.log('Sample 1 (t=0s):', msg.result?.result?.value);
        await new Promise(r => setTimeout(r, 2000));
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const iframe = document.querySelector('iframe');
              const iDoc = iframe?.contentDocument || iframe?.contentWindow?.document || document;
              const video = iDoc.querySelector('video') || window.__heroVideo;
              return {
                videoCurrentTime: video?.currentTime,
                videoPaused: video?.paused
              };
            })()`,
            returnByValue: true
          }
        }));
      } else if (msg.id === 2) {
        console.log('Sample 2 (t=2s):', msg.result?.result?.value);
        ws.close();
        chrome.kill();
      }
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

testAnimationMovement();
