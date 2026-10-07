,8947,e=>{"use strict";var t=e.i(43476),n=e.i(71645),i=e.i(75056),r=e.i(25234),a=e.i(28600),s=e.i(90072);let o=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,l=`
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform sampler2D uFontTexture;
  uniform float uCharCount;
  uniform vec3 uColor;
  uniform bool uInvert;
  uniform float uScale;
  uniform float uSize;
  uniform float uSpeed;
  uniform float uHasMouse;
  uniform float uIntensity;
  uniform float uInteractIntensity;
  uniform float uWaveTension;
  uniform float uWaveTwist;
  uniform sampler2D uVideoTexture;
  uniform bool uHasVideo;

  varying vec2 vUv;

  #define PI 3.14159265359
  #define TAU 6.28318530718

  float flowField(vec2 p, float t) {
    return sin(p.x + sin(p.y + t * 0.1)) * sin(p.y * p.x * 0.1 + t * 0.2);
  }

  vec2 computeField(vec2 p, float t) {
    vec2 ep = vec2(0.05, 0.0);
    vec2 result = vec2(0.0);
    float tension = uWaveTension;
    float twist = uWaveTwist;

    for (int i = 0; i < 10; i++) {
      float t0 = flowField(p, t);
      float t1 = flowField(p + ep.xy, t);
      float t2 = flowField(p + ep.yx, t);
      vec2 gradient = vec2((t1 - t0), (t2 - t0)) / ep.xx;
      vec2 tangent = vec2(-gradient.y, gradient.x);

      p += tangent * tension + gradient * 0.005;
      p.x += sin(t * 0.25) * twist;
      p.y += cos(t * 0.25) * twist;
      result = gradient;
    }

    return result;
  }

  vec3 getDistortion(vec2 coord) {
      vec2 aspect;

      if(uResolution.x > uResolution.y) {
          aspect = vec2(uResolution.x / uResolution.y, 1.0);
      } else {
          aspect = vec2(uResolution.y / uResolution.x, 1.0);
      }

      vec2 uv0 = coord.xy / uResolution.xy * aspect;
      vec2 muv = uMouse.xy / uResolution.xy * aspect;

      float speed = uSpeed;
      float noiseTime = uTime * speed;

      vec2 diff = uv0 - muv;
      float distance = length(diff);

      float radius = 0.5;
      float interaction = smoothstep(radius, 0.0, distance);

      vec2 p = uv0 * uScale;
      float interactStrength = uInteractIntensity * uHasMouse;

      vec2 mouseDistort = normalize(diff) * interaction * interactStrength;
      p += mouseDistort;
      p.x += sin(uTime * 3.0) * interaction * interactStrength * 0.5;
      p.y += cos(uTime * 3.0) * interaction * interactStrength * 0.5;

      vec2 field = computeField(p, noiseTime);

      float val = length(field) * uIntensity;
      val = clamp(val, 0.0, 1.0);

      vec2 totalDisplacement = mouseDistort + field * 0.5 * uIntensity;

      return vec3(val, totalDisplacement);
  }

  void main() {
      float gridSize = uSize;

      vec2 pix = vUv * uResolution;
      vec2 snappedMuv = floor(pix / gridSize) * gridSize;

      vec3 distData = getDistortion(snappedMuv);
      float intensity = distData.x;
      vec2 displacement = distData.yz;

      vec3 col;
      if (uHasVideo) {
        vec2 videoUV = snappedMuv / uResolution;
        vec2 distortedVideoUV = videoUV + (displacement * 0.1);

        col = texture2D(uVideoTexture, distortedVideoUV).rgb;
      } else {
        col = vec3(intensity);
      }

      float gray = 0.3 * col.r + 0.59 * col.g + 0.11 * col.b;

      if (uInvert) {
        gray = 1.0 - gray;
      }

      float charIndex = floor(gray * (uCharCount - 1.0));
      charIndex = clamp(charIndex, 0.0, uCharCount - 1.0);

      vec2 cellUV = fract(pix / gridSize);

      float charWidth = 1.0 / uCharCount;
      vec2 atlasUV = vec2((cellUV.x * charWidth) + (charIndex * charWidth), cellUV.y);

      vec4 fontSample = texture2D(uFontTexture, atlasUV);
      float alpha = fontSample.a;

      vec3 targetColor = uHasVideo ? col : uColor * (gray + 0.1);
      vec3 finalColor = targetColor * alpha;

      gl_FragColor = vec4(finalColor, alpha);
  }
`,u=({mouse:e,characters:i,color:u,invert:c,scale:h,size:d,speed:p,hasMouse:f,intensity:m,interactionIntensity:g,waveTension:v,waveTwist:x,videoUrl:y,active:_})=>{let b=(0,n.useRef)(null),S=(0,n.useRef)(null),{size:M,viewport:w}=(0,a.useThree)(),T=i.length>0?i:" ",E=(0,n.useRef)(null),A=(0,n.useRef)(null),C=(0,n.useRef)(null),R=(0,n.useMemo)(()=>({uTime:{value:0},uMouse:{value:new s.Vector2(0,0)},uResolution:{value:new s.Vector2(M.width,M.height)},uFontTexture:{value:null},uCharCount:{value:T.length},uColor:{value:new s.Color(u)},uInvert:{value:c},uScale:{value:h},uSize:{value:d},uSpeed:{value:p},uHasMouse:{value:+!!f},uIntensity:{value:m},uInteractIntensity:{value:g},uWaveTension:{value:v},uWaveTwist:{value:x},uVideoTexture:{value:null},uHasVideo:{value:!1}}),[]);return(0,n.useEffect)(()=>{let e=((e,t=64)=>{let n=document.createElement("canvas"),i=n.getContext("2d");if(!i)return new s.Texture;let r=e.length,a=r*t;n.width=a,n.height=t,i.clearRect(0,0,a,t),i.font=`bold ${t}px monospace`,i.fillStyle="white",i.textAlign="center",i.textBaseline="middle";for(let n=0;n<r;n++){let r=e[n]??" ",a=n*t+t/2,s=t/2;i.fillText(r,a,s)}let o=new s.CanvasTexture(n);return o.minFilter=s.LinearFilter,o.magFilter=s.LinearFilter,o.needsUpdate=!0,o})(T);return e.wrapS=e.wrapT=s.ClampToEdgeWrapping,E.current=e,()=>{e.dispose(),E.current=null}},[T]),(0,n.useEffect)(()=>{if(!y){A.current=null;return}let e=document.createElement("video");e.src=y,e.crossOrigin="Anonymous",e.loop=!0,e.muted=!0,e.playsInline=!0,e.play().catch(e=>console.error("Video play failed",e));let t=new s.VideoTexture(e);return t.minFilter=s.LinearFilter,t.magFilter=s.LinearFilter,A.current=t,C.current=e,()=>{e.pause(),e.src="",t.dispose(),A.current=null,C.current=null}},[y]),(0,n.useEffect)(()=>{let e=C.current;e&&(_?e.play().catch(()=>{}):e.pause())},[_]),(0,r.useFrame)(t=>{if(S.current){let n=S.current.uniforms;n.uTime.value=t.clock.elapsedTime,n.uResolution.value.set(M.width,M.height),n.uColor.value.set(u),n.uInvert.value=c,n.uScale.value=h,n.uSize.value=d,n.uSpeed.value=p,n.uHasMouse.value=+!!f,n.uIntensity.value=m,n.uInteractIntensity.value=g,n.uWaveTension.value=v,n.uWaveTwist.value=x,n.uCharCount.value=T.length,E.current&&(n.uFontTexture.value=E.current),A.current?(n.uVideoTexture.value=A.current,n.uHasVideo.value=!0):(n.uVideoTexture.value=null,n.uHasVideo.value=!1),e.current&&n.uMouse.value.lerp(e.current,.1)}}),(0,t.jsxs)("mesh",{ref:b,children:[(0,t.jsx)("planeGeometry",{args:[w.width,w.height]}),(0,t.jsx)("shaderMaterial",{ref:S,vertexShader:o,fragmentShader:l,uniforms:R,transparent:!0})]})};e.s(["default",0,({characters:e=" .:-+*=%@#",color:r="#ffffff",invert:a=!1,noiseScale:o=2,elementSize:l=16,speed:c=1,hasCursorInteraction:h=!0,intensity:d=1,interactionIntensity:p=1,waveTension:f=.5,waveTwist:m=.1,className:g="",videoUrl:v})=>{let x=(0,n.useRef)(new s.Vector2(0,0)),y=(0,n.useRef)(null),[_,b]=n.default.useState(!0);return(0,n.useEffect)(()=>{let e=y.current;if(!e)return;let t=new IntersectionObserver(([e])=>b(e?.isIntersecting??!0),{rootMargin:"120px"});return t.observe(e),()=>t.disconnect()},[]),(0,t.jsx)("div",{ref:y,className:function(...e){return e.filter(Boolean).join(" ")}("relative h-full w-full cursor-text overflow-hidden",g),onMouseMove:e=>{let t=e.currentTarget.getBoundingClientRect(),n=e.clientX-t.left,i=t.height-(e.clientY-t.top);x.current.set(n,i)},children:(0,t.jsx)(i.Canvas,{orthographic:!0,camera:{position:[0,0,1],zoom:1},dpr:[1,1.5],frameloop:_?"always":"never",gl:{alpha:!0,antialias:!1,powerPreference:"high-performance"},children:(0,t.jsx)(u,{mouse:x,characters:e,color:r,invert:a,scale:o,size:l,speed:c,hasMouse:h,intensity:d,interactionIntensity:p,waveTension:f,waveTwist:m,videoUrl:v,active:_})})})}],8947)}