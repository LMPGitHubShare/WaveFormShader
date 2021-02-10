const _maxSamplesSize = 1020;
let nbSamples = _maxSamplesSize;

let redererWidth = window.innerWidth;
let redererHeight = window.innerHeight;

function GetRandomSample()
{
    var samples = new Float32Array(_maxSamplesSize);
    for (var i= 0; i < nbSamples; i++)
    {
        samples[i] = i / nbSamples;//(Math.random() * 2.0 - 1.0); // Normalize random [-1, 1]

        // Temp
        if (i == 0)
        {
            samples[i] = 0.5;
        }
        if (i == nbSamples -1)
        {
            samples[i] = 0.5;
        }
    }
    return samples; 
}

function GetSamplesResolution()
{
    if (redererHeight > _maxSamplesSize)
    {
        return _maxSamplesSize;
    }
    return redererHeight;
}

let scene;
let camera;
let render;

// shader uniforms
const uniforms = {
    u_mouse: { value: { x: redererWidth / 2, y: redererHeight / 2 } },
    u_resolution: { value: { x: redererWidth, y: redererHeight } },
    u_time: { value: 0.0 },
    samples: { type: "fv", value: GetRandomSample()}
  }
const clock = new THREE.Clock();


let plane;
function UpdateRenderPlane()
{
    scene.remove(plane);

    var resolution = GetSamplesResolution();

    // GLSL
    var vertexShader = `
    varying vec2 v_uv;

    void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `;

    var fragmentShader = `
    varying vec2 v_uv;
    uniform vec2 u_mouse;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float samples[${resolution}];

    void main() {
    vec2 v = u_mouse / u_resolution;
    vec2 uv = gl_FragCoord.xy / u_resolution;

    int index = int((1.0 - uv.y) * ${resolution}.0);

    float sampleValue = 0.0;
    for (int i=0; i < ${resolution}; i++)
    {
        if(index == i)
        {
            sampleValue = abs(samples[i]);
        }
    }

    float pixelValue = 0.0;
    if ((0.5 - sampleValue / 2.0 < uv.x) && (0.5 + sampleValue / 2.0 > uv.x))
    {
        pixelValue = 1.0;
    }

    gl_FragColor = vec4(pixelValue, pixelValue, pixelValue, 1.0).rgba;
    }
    `;

    // Plane (To draw waveform)
    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms
      });
    plane = new THREE.Mesh( geometry, material );
    scene.add( plane );
}


function init()
{
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(
        10,
        redererWidth / redererHeight,
        0.1,
        1000
    );
    camera.position.z = 1;

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(redererWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    UpdateRenderPlane();
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
    redererWidth = window.innerWidth;
    redererHeight = window.innerHeight;

    camera.aspect = redererWidth / redererHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(redererWidth, redererHeight);

    if (uniforms.u_resolution !== undefined){
        uniforms.u_resolution.value.x = redererWidth;
        uniforms.u_resolution.value.y = redererHeight;
    }

    UpdateRenderPlane();
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