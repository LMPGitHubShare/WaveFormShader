// GLSL
const vShader = `
varying vec2 v_uv;

void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const fShader = `
varying vec2 v_uv;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform float samplesSize;
uniform float samples[1020];

void main() {
  vec2 v = u_mouse / u_resolution;
  vec2 uv = gl_FragCoord.xy / u_resolution;

  float index = uv.y * samplesSize;

  int clampIndex = 0;                                       //int(clamp(index, 0.0,  1019.0));
  float sampleValue = abs(samples[0]);

  float pixelValue = 0.0;
  if ((0.5 - sampleValue / 2.0 < uv.x) && (0.5 + sampleValue / 2.0 > uv.x))
  {
    pixelValue = 1.0;
  }
  
  gl_FragColor = vec4(pixelValue, uv.y, 1.0, 1.0).rgba;
}
`;

const _samplesSize = 1020;
const nbSamples = _samplesSize;

// Random fucking samples 
let samples = new Float32Array(_samplesSize);
for (var i= 0; i < nbSamples; i++)
{
    samples[i] = (Math.random() * 2.0 - 1.0); // Normalize random [-1, 1]
}

let scene;
let camera;
let render;
// shader uniforms
const uniforms = {
    u_mouse: { value: { x: window.innerWidth / 2, y: window.innerHeight / 2 } },
    u_resolution: { value: { x: window.innerWidth, y: window.innerHeight } },
    u_time: { value: 0.0 },
    samplesSize: { value: _samplesSize },
    samples: { type: "fv", value: samples}
  }
const clock = new THREE.Clock();

function init()
{
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(
        54,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 1;

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Plane (To draw waveform)
    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.ShaderMaterial({
        vertexShader: vShader,
        fragmentShader: fShader,
        uniforms
      });
    const plane = new THREE.Mesh( geometry, material );
    scene.add( plane );
}

// Render loop
function animate() {
    // update time uniform
    uniforms.u_time.value = clock.getElapsedTime();

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
// Rezise handling
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (uniforms.u_resolution !== undefined){
        uniforms.u_resolution.value.x = window.innerWidth;
        uniforms.u_resolution.value.y = window.innerHeight;
      }
}
// Mouse handling 
document.addEventListener('mousemove', (e) =>{
    window.addEventListener( 'resize', onWindowResize, false );
    uniforms.u_mouse.value.x = e.clientX;
    uniforms.u_mouse.value.y = e.clientY;
  });

window.addEventListener('resize', onWindowResize, false);


init();
animate();