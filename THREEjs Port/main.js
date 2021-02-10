const _maxSamplesSize = 1020;
let nbSamples = 44100 * 3 * 60; // 3 min mp3 44100 Hz

let redererWidth = window.innerWidth;
let redererHeight = window.innerHeight;

let waveFormArray = getRandomSample();

function getRandomSample()
{
    var samples = new Float32Array(nbSamples);
    for (var i= 0; i < nbSamples; i++)
    {
        samples[i] = (Math.random() * 2.0 - 1.0); // Normalize random [-1, 1]

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

function getSamplesResolution()
{
    if (redererHeight > _maxSamplesSize)
    {
        return _maxSamplesSize;
    }
    return redererHeight;
}

// WaveFrom MipMap Tool - From WaveFormMipMap.cs
let mipMap;

function initMipMap(samples, stopMip)
{
    mipMap = new Array ( );
    mipMap.push(samples);
    var lastMap = samples;
    while (lastMap.length / 2 >= stopMip)
    {
        var newMap = new Float32Array(lastMap.length / 2);
        for (var i = 0; i < newMap.length; i++)
        {
            newMap[i] = (lastMap[i * 2] > lastMap[i * 2 + 1] ? lastMap[i * 2] : lastMap[i * 2 + 1]);
        }
        mipMap.push(newMap);
        lastMap = newMap;
    }
}

function GetValue(i, texelSize)
{
    var lod = GetLod(texelSize);
    var index = Math.floor((i * 1.0) / GetMaxLod().length * lod.length);
    return lod[index];
}

function GetLod(texelSize)
{
    for (var i = 0; i < mipMap.length; i++)
    {
        if (GetMaxLod().length / mipMap[i].length > texelSize)
        {
            return mipMap[i];
        }
    }
    return GetMinLod();
}

function GetMaxLod()
{
    return mipMap[0];
}
function  GetMinLod()
{
    return mipMap[mipMap.length - 1];
}

// WaveformShading CPU - From WaveformShading.cs
let rtSize;
let zoom;
let minZoom;
let maxZoom;
let offSet = 0;

let curentSamples;

function initWaveformShading(samples, rtSizeIn)
{
    rtSize = rtSizeIn;
    initMipMap(samples, rtSize);
    maxZoom = samples.length / rtSize;
    minZoom = 1.0 / (maxZoom  + rtSize); // 1 texel
    zoom = maxZoom;
    ApplyToMaterial();
}

/// <summary>
/// Send samples stream array to GPU
/// </summary>
function ApplyToMaterial()
{
    var samplesStream = new Float32Array(rtSize);
    for (var i = 0; i < rtSize; i++)
    {
        var index = (i - rtSize / 2) * zoom - offSet;
        if (IsInSample(index))
        {
            samplesStream[i] = GetValue(index, zoom);
        }
    }
    
    curentSamples = samplesStream;
    
    updateRenderPlane();
}

function ApplyZoom(zoomChange)
{
    zoom += zoomChange * zoom;
    if (zoom < minZoom) { zoom = minZoom; }
    if (zoom > maxZoom) { zoom = maxZoom; }
    ApplyToMaterial();
}

function ApplyOffSet(offSetChange)
{
    offSet += offSetChange * zoom;
    ApplyToMaterial();
}

function IsInSample(value)
{
    if (value > GetMaxLod().length - 1)
    {
        return false;
    }
    if (value < 0)
    {
        return false;
    }
    return true;
}

function updateWaveformShader()
{
    rtSize = getSamplesResolution();
    initWaveformShading(getRandomSample(), rtSize);
    updateRenderPlane();
}

// WaveformShading GPU - THREE.js
let scene;
let camera;
let render;

// Shader uniforms
let uniforms;
const clock = new THREE.Clock();

let plane;
function updateRenderPlane()
{
    scene.remove(plane); // TODO : Adress potential memory issues

    // GLSL - From TonsShader.shader
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
    uniform float samples[${rtSize}];

    void main() {
    vec2 v = u_mouse / u_resolution;
    vec2 uv = gl_FragCoord.xy / u_resolution;

    int index = int((1.0 - uv.y) * ${rtSize}.0);

    float sampleValue = 0.0;
    for (int i=0; i < ${rtSize}; i++)
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

    uniforms = {
        u_mouse: { value: { x: redererWidth / 2, y: redererHeight / 2 } },
        u_resolution: { value: { x: redererWidth, y: redererHeight } },
        u_time: { value: 0.0 },
        samples: { type: "fv", value: curentSamples}
    };

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


function createScene()
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

    updateWaveformShader();
}

// Render loop
function update() {
    // Update time uniform
    uniforms.u_time.value = clock.getElapsedTime();



    requestAnimationFrame(update);
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

    updateWaveformShader();
}

// Mouse handling 
document.addEventListener('mousemove', (e) =>{
    window.addEventListener( 'resize', onWindowResize, false );
    uniforms.u_mouse.value.x = e.clientX;
    uniforms.u_mouse.value.y = e.clientY;
  });

window.addEventListener('resize', onWindowResize, false);

window.addEventListener("wheel", event => {
    const delta = Math.sign(event.deltaY);
    ApplyZoom(delta * 0.1)
});

window.addEventListener('keydown', function(event) {
    switch (event.key) {
        case "ArrowUp":
            ApplyOffSet(10);
            break;
        case "ArrowDown":
            ApplyOffSet(-10);
            break;
    }
});

// Start it boi
createScene();
update();
