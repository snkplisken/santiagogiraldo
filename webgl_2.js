const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl2");
document.body.appendChild(canvas);
canvas.style.width = "100%";
canvas.style.height = "100vh";
canvas.style.cursor = "ns-resize";

// Color configuration
const COLORS = {
    bg: [0.05, 0.06, 0.1, 1],
    waveFront: [0.8, 0.7, 1.0],
    waveBack: [0.4, 0.3, 0.6]
};

// Vertex Shader
const vertexSource = `#version 300 es
    precision highp float;
    in vec4 position;
    void main() { gl_Position = position; }
`;

// Fragment Shader with cleaner wave dynamics
const fragmentSource = `#version 300 es
    precision highp float;
    out vec4 fragColor;
    
    uniform vec2 resolution;
    uniform float time;
    uniform float waveScale;
    uniform vec3 waveFront;
    uniform vec3 waveBack;
    
    #define PI 3.14159265359
    #define LAYERS 4
    
    float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
        vec2 uv = gl_FragCoord.xy/resolution.xy;
        vec3 col = vec3(0.0);
        float aspect = resolution.x/resolution.y;
        float t = time * 0.6;

        float baseHeight = 0.1 + waveScale * 0.4;
        float waveFreq = 2.0 + waveScale * 2.0;
        
        for(int i = 0; i < LAYERS; i++) {
            float depth = float(i)/float(LAYERS);
            vec2 displacedUV = uv * vec2(aspect, 1.0) + vec2(depth * 0.3, 0.0);
            
            float x = (displacedUV.x * 2.0 - 1.0) * waveFreq + t;
            float y = displacedUV.y * 2.0 - 1.0;
            
            float wave = sin(x) * baseHeight;
            wave += sin(x * 2.0) * baseHeight * 0.5;
            wave += noise(vec2(x, t)) * baseHeight * 0.2;
            
            float wavePos = y - wave;
            float line = smoothstep(0.02, -0.02, abs(wavePos));
            
            vec3 waveColor = mix(waveFront, waveBack, depth);
            col += waveColor * line * (1.0 - depth);
        }
        
        fragColor = vec4(col, 1.0);
    }
`;

// WebGL Setup
let program, buffer;
let waveScale = 0.1;

function init() {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertexSource);
    gl.compileShader(vs);
    
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentSource);
    gl.compileShader(fs);

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1,-1,1,-1,-1,1,1,-1,1,1,-1,1
    ]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
}

function render(t) {
    if (!program) return;
    
    gl.useProgram(program);
    gl.clearColor(...COLORS.bg, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(gl.getUniformLocation(program, "resolution"), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(program, "time"), t/1000);
    gl.uniform1f(gl.getUniformLocation(program, "waveScale"), waveScale);
    gl.uniform3fv(gl.getUniformLocation(program, "waveFront"), COLORS.waveFront);
    gl.uniform3fv(gl.getUniformLocation(program, "waveBack"), COLORS.waveBack);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
}

window.addEventListener("wheel", e => {
    waveScale = Math.min(Math.max(waveScale + (e.deltaY * 0.0001), 0.1), 1.5);
    e.preventDefault();
}, { passive: false });

const resizeObserver = new ResizeObserver(entries => {
    canvas.width = entries[0].contentRect.width * devicePixelRatio;
    canvas.height = entries[0].contentRect.height * devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
});
resizeObserver.observe(canvas);

init();
requestAnimationFrame(render);