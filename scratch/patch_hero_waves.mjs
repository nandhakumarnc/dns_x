import fs from 'fs';

function patchChunk(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }
  let code = fs.readFileSync(filePath, 'utf8');
  let originalLen = code.length;

  // 1. In HeroWaves config: change intensity:0 to intensity:0.8
  // Search for: intensity:0,elementSize:10
  if (code.includes('intensity:0,elementSize:10')) {
    code = code.replace('intensity:0,elementSize:10', 'intensity:0.8,elementSize:10');
    console.log('Patched intensity:0 -> intensity:0.8 in', filePath);
  } else {
    console.log('intensity:0,elementSize:10 not found in', filePath);
  }

  // 2. In HeroWaves config: increase className opacity if desired: "opacity-50 dark:opacity-60" -> "opacity-70 dark:opacity-85"
  if (code.includes('className:"opacity-50 dark:opacity-60"')) {
    code = code.replace('className:"opacity-50 dark:opacity-60"', 'className:"opacity-70 dark:opacity-85"');
    console.log('Patched className opacity in', filePath);
  }

  // 3. Fix video creation and play interruption in module 8947:
  // Original video creation:
  // let e=document.createElement("video");e.src=y,e.crossOrigin="Anonymous",e.loop=!0,e.muted=!0,e.playsInline=!0,e.play().catch(e=>console.error("Video play failed",e));
  const targetVid = 'let e=document.createElement("video");e.src=y,e.crossOrigin="Anonymous",e.loop=!0,e.muted=!0,e.playsInline=!0,e.play().catch(e=>console.error("Video play failed",e));';
  const replVid = 'let e=document.createElement("video");e.src=y,e.crossOrigin="Anonymous",e.loop=!0,e.muted=!0,e.defaultMuted=!0,e.autoplay=!0,e.playsInline=!0,e.setAttribute("playsinline",""),e.setAttribute("muted",""),e.setAttribute("autoplay","");let p=e.play();if(p!==void 0){p.catch(()=>{})};';
  
  if (code.includes(targetVid)) {
    code = code.replace(targetVid, replVid);
    console.log('Patched video creation in', filePath);
  } else {
    console.log('targetVid not found directly in', filePath);
  }

  // 4. In useFrame: ensure video is kept playing if paused:
  // Original: e.current&&n.uMouse.value.lerp(e.current,.1)
  const targetFrame = 'e.current&&n.uMouse.value.lerp(e.current,.1)';
  const replFrame = 'e.current&&n.uMouse.value.lerp(e.current,.1);if(C.current&&C.current.paused){let pr=C.current.play();if(pr!==void 0)pr.catch(()=>{})}';
  if (code.includes(targetFrame)) {
    code = code.replace(targetFrame, replFrame);
    console.log('Patched useFrame in', filePath);
  }

  // 5. In shader fallback for black frame:
  // Original:
  // col = texture2D(uVideoTexture, distortedVideoUV).rgb;
  // } else {
  // col = vec3(intensity);
  // }
  const targetShader = 'col = texture2D(uVideoTexture, distortedVideoUV).rgb;\n      } else {\n        col = vec3(intensity);';
  const replShader = 'col = texture2D(uVideoTexture, distortedVideoUV).rgb;\n        if (length(col) < 0.05) { col = vec3(intensity); }\n      } else {\n        col = vec3(intensity);';
  if (code.includes(targetShader)) {
    code = code.replace(targetShader, replShader);
    console.log('Patched shader video fallback in', filePath);
  }

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Done patching', filePath, 'length delta:', code.length - originalLen);
}

patchChunk('public/_next/static/chunks/15ac4acf6b48e0d3.js');
patchChunk('landing page/_next/static/chunks/15ac4acf6b48e0d3.js');
