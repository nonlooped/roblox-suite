export {};
const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0., 1.); }`;

const FRAG = `precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform vec3 uTint; uniform float uPulse;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec2(17.3,9.1); a*=.5; } return v; }
void main(){
  vec2 uv=gl_FragCoord.xy/uRes; vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y; float t=uTime*.05;
  vec2 q=vec2(fbm(p*1.2+t), fbm(p*1.2-t+4.));
  vec2 r=vec2(fbm(p*1.6+q*1.8+vec2(1.7,9.2)+t*1.3), fbm(p*1.6+q*1.8+vec2(8.3,2.8)-t));
  float f=fbm(p*1.4+r*2.2);
  vec3 c1=vec3(0.,.64,1.), c2=vec3(.35,.78,1.), c3=vec3(.02,.30,.75), c4=vec3(.75,.88,1.);
  vec3 col=mix(c1,c2,smoothstep(.2,.7,q.x)); col=mix(col,c3,smoothstep(.35,.9,r.y)*.7); col=mix(col,c4,smoothstep(.5,1.,r.x)*.6);
  col=mix(col,uTint,.35);
  float glow=pow(f,2.4)*1.6*(1.+.35*uPulse);
  float mask=smoothstep(-.3,1.,p.x*.9+.15)*(.55+.45*smoothstep(1.,-.2,abs(p.y)));
  vec3 o=vec3(.016,.02,.035)+col*glow*mask*.55;
  vec2 m=(uMouse-.5*uRes)/uRes.y; o+=uTint*.10*exp(-6.*dot(p-m,p-m));
  o*=1.-.9*dot(uv-.5,uv-.5);
  o+=(hash(gl_FragCoord.xy+uTime)-.5)*.025;
  gl_FragColor=vec4(o,1.);
}`;

const canvas = document.querySelector<HTMLCanvasElement>("#aurora");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fallback = () => document.documentElement.classList.add("no-webgl");

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function start(el: HTMLCanvasElement) {
  const gl = el.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return fallback();
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return fallback();
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return fallback();
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "uRes");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uMouse = gl.getUniformLocation(program, "uMouse");
  const uTint = gl.getUniformLocation(program, "uTint");
  const uPulse = gl.getUniformLocation(program, "uPulse");

  // The smoke is soft, so it renders below device resolution and the browser scales it up.
  const quality = 0.7;
  let width = 1;
  let height = 1;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5) * quality;
    width = Math.max(1, Math.round(innerWidth * dpr));
    height = Math.max(1, Math.round(innerHeight * dpr));
    el.width = width;
    el.height = height;
    gl.viewport(0, 0, width, height);
  };
  resize();
  addEventListener("resize", () => {
    resize();
    if (reduced) draw(0);
  });

  const tint = [0, 0.64, 1];
  let pulse = 0;
  addEventListener("skill-pulse", () => {
    pulse = 1;
    if (reduced) draw(0);
  });

  let mouse = [0.7, 0.5];
  addEventListener(
    "pointermove",
    (event) => {
      mouse = [event.clientX / innerWidth, 1 - event.clientY / innerHeight];
    },
    { passive: true },
  );

  const draw = (seconds: number) => {
    gl.uniform2f(uRes, width, height);
    gl.uniform1f(uTime, seconds + 40);
    gl.uniform2f(uMouse, mouse[0] * width, mouse[1] * height);
    gl.uniform3f(uTint, tint[0], tint[1], tint[2]);
    gl.uniform1f(uPulse, pulse);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  el.classList.add("is-ready");
  if (reduced) {
    draw(0);
    return;
  }

  let last = performance.now();
  let clock = 0;
  let raf = 0;
  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    clock += dt;
    pulse *= Math.exp(-dt / 0.3);
    draw(clock);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  });
}

if (canvas) start(canvas);
