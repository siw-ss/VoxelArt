import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { VoxelWorld } from './voxel-world.js';
import { buildScene } from './scene-builder.js';
import { createEffects } from './effects.js';
import {
    showLoaderError,
    initDiagnostics,
    initDock,
    initFlyout,
    initTypewriter,
} from './ui.js';

function goToHome() {
    window.location.href = '../index.html';
}

// Init UI
initDiagnostics();
initDock();
initFlyout('bubble-btn', 'bubble-panel');
initFlyout('depth-btn', 'depth-panel');
initTypewriter();

// ---------------------------------------------------------------------------
//  RENDERER / SCENE / CAMERA
// ---------------------------------------------------------------------------
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (err) {
    showLoaderError('WebGL is not available',
        'Your browser could not create a WebGL context.<br><br>' +
        'Enable hardware acceleration in your browser settings.');
    throw err;
}
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Reinhard keeps more saturation than ACES, which visibly greys out the
// strong reef hues. Slight exposure lift compensates for its softer highlights.
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();

// ---------------------------------------------------------------------------
//  DEPTH PROFILE — drives sky, fog and light as you descend
// ---------------------------------------------------------------------------
const DEPTH_STOPS = [
    { t: 0.0, name: 'Surface', top: '#5ff0ff', bottom: '#00a8e8', fog: '#4de0ff', fogNear: 80, fogFar: 260, sun: 2.6, amb: 0.7 },
    { t: 0.35, name: 'Shallow', top: '#00c8f0', bottom: '#0077b6', fog: '#00a0d0', fogNear: 65, fogFar: 220, sun: 1.9, amb: 0.55 },
    { t: 0.7, name: 'Deep', top: '#0a5f8a', bottom: '#023047', fog: '#065a7d', fogNear: 42, fogFar: 155, sun: 0.9, amb: 0.34 },
    { t: 1.0, name: 'Abyss', top: '#04202f', bottom: '#010a14', fog: '#03161f', fogNear: 24, fogFar: 100, sun: 0.28, amb: 0.18 },
];

const _cA = new THREE.Color(), _cB = new THREE.Color();
const _topC = new THREE.Color(), _botC = new THREE.Color(), _fogC = new THREE.Color();

function depthProfile(t) {
    let a = DEPTH_STOPS[0], b = DEPTH_STOPS[DEPTH_STOPS.length - 1];
    for (let i = 0; i < DEPTH_STOPS.length - 1; i++) {
        if (t >= DEPTH_STOPS[i].t && t <= DEPTH_STOPS[i + 1].t) {
            a = DEPTH_STOPS[i]; b = DEPTH_STOPS[i + 1];
            break;
        }
    }
    const span = b.t - a.t;
    const k = span === 0 ? 0 : (t - a.t) / span;
    _topC.copy(_cA.set(a.top)).lerp(_cB.set(b.top), k);
    _botC.copy(_cA.set(a.bottom)).lerp(_cB.set(b.bottom), k);
    _fogC.copy(_cA.set(a.fog)).lerp(_cB.set(b.fog), k);
    return {
        name: k < 0.5 ? a.name : b.name,
        top: _topC, bottom: _botC, fog: _fogC,
        fogNear: a.fogNear + (b.fogNear - a.fogNear) * k,
        fogFar: a.fogFar + (b.fogFar - a.fogFar) * k,
        sun: a.sun + (b.sun - a.sun) * k,
        amb: a.amb + (b.amb - a.amb) * k,
    };
}

// Gradient sky rendered to a canvas texture
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 2; skyCanvas.height = 256;
const skyCtx = skyCanvas.getContext('2d');
const skyTex = new THREE.CanvasTexture(skyCanvas);
skyTex.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTex;

function paintSky(top, bottom) {
    const g = skyCtx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#' + top.getHexString());
    g.addColorStop(1, '#' + bottom.getHexString());
    skyCtx.fillStyle = g;
    skyCtx.fillRect(0, 0, 2, 256);
    skyTex.needsUpdate = true;
}

scene.fog = new THREE.Fog(0x2f8fb0, 45, 165);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 600);
const HOME_POS = new THREE.Vector3(48, 30, 48);
camera.position.copy(HOME_POS);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 18;
controls.maxDistance = 130;
controls.maxPolarAngle = Math.PI * 0.495;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

// ---------------------------------------------------------------------------
//  LIGHTING
// ---------------------------------------------------------------------------
const hemi = new THREE.HemisphereLight(0xbdf0ff, 0x2a7f6a, 0.85);
scene.add(hemi);

// Near-white ambient so coral pigments read as their own colour rather
// than being tinted uniformly blue.
const ambient = new THREE.AmbientLight(0xf0fbff, 0.55);
scene.add(ambient);

// Sun shafts filtering down from the surface
const sun = new THREE.DirectionalLight(0xffffff, 1.9);
sun.position.set(30, 90, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 260;
const S = 70;
sun.shadow.camera.left = -S; sun.shadow.camera.right = S;
sun.shadow.camera.top = S; sun.shadow.camera.bottom = -S;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.6;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x2f8fb0, 0.3);
fill.position.set(-40, 30, -35);
scene.add(fill);

// ---------------------------------------------------------------------------
//  BUILD THE WORLD
// ---------------------------------------------------------------------------
const world = new VoxelWorld();
const root = new THREE.Group();
scene.add(root);

const { bioLights, kelpAnchors, reefRadius } = buildScene({ world, root });

const { updateEffects, setFishOn, setBubbleCount, setBubbleSpeed } =
    createEffects({ root, kelpAnchors, reefRadius });

// ---------------------------------------------------------------------------
//  UI WIRING
// ---------------------------------------------------------------------------
const elFish = document.getElementById('fish-toggle');
const elRotate = document.getElementById('rotate');
const elShadows = document.getElementById('shadows');
const elBioglow = document.getElementById('bioglow-toggle');
const elBubbleCount = document.getElementById('bubble-count');
const elBubbleCountVal = document.getElementById('bubble-count-val');
const elBubbleSpeed = document.getElementById('bubble-speed');
const elBubbleSpeedVal = document.getElementById('bubble-speed-val');
const elDepth = document.getElementById('depth-slider');
const elDepthVal = document.getElementById('depth-val');

elFish.addEventListener('change', e => setFishOn(e.target.checked));
elRotate.addEventListener('change', e => controls.autoRotate = e.target.checked);

elShadows.addEventListener('change', e => {
    renderer.shadowMap.enabled = e.target.checked;
    scene.traverse(o => { if (o.isMesh) o.material.needsUpdate = true; });
});

let bioglowOn = true;
elBioglow.addEventListener('change', e => {
    bioglowOn = e.target.checked;
    for (const b of bioLights) b.light.visible = bioglowOn;
});

elBubbleCount.addEventListener('input', e => {
    const n = parseInt(e.target.value, 10);
    setBubbleCount(n);
    if (elBubbleCountVal) elBubbleCountVal.textContent = n;
});

elBubbleSpeed.addEventListener('input', e => {
    const v = parseInt(e.target.value, 10) / 100;
    setBubbleSpeed(v);
    if (elBubbleSpeedVal) elBubbleSpeedVal.textContent = v.toFixed(1) + 'x';
});

function applyDepth(v) {
    const p = depthProfile(v);
    paintSky(p.top, p.bottom);
    scene.fog.color.copy(p.fog);
    scene.fog.near = p.fogNear;
    scene.fog.far = p.fogFar;
    sun.intensity = p.sun;
    ambient.intensity = p.amb;
    hemi.intensity = 0.25 + p.amb;
    // Bioluminescence reads stronger the deeper you go
    depthGlowBoost = 1 + v * 1.6;
    if (elDepthVal) elDepthVal.textContent = p.name;
}

let depthGlowBoost = 1;
elDepth.addEventListener('input', e => applyDepth(parseInt(e.target.value, 10) / 100));

// Home button navigates back to the portfolio index
const elHomeLabel = document.querySelector('label[title="Home"]');
if (elHomeLabel) elHomeLabel.addEventListener('click', () => goToHome());

// Initial state from the markup's default values
setBubbleCount(parseInt(elBubbleCount.value, 10));
setBubbleSpeed(parseInt(elBubbleSpeed.value, 10) / 100);
applyDepth(parseInt(elDepth.value, 10) / 100);

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

// ---------------------------------------------------------------------------
//  RENDER LOOP
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
let firstFrame = true;

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    updateEffects(dt, t);

    // Bioluminescent pulse
    if (bioglowOn) {
        for (const b of bioLights) {
            const pulse = 0.75 + Math.sin(t * 1.3 + b.phase) * 0.25;
            b.light.intensity = b.baseIntensity * pulse * depthGlowBoost;
        }
    }

    controls.update();
    renderer.render(scene, camera);

    if (firstFrame) {
        firstFrame = false;
        window.__kiroReady = true;
        const ld = document.getElementById('loader');
        if (ld) { ld.classList.add('hidden'); setTimeout(() => ld.remove(), 700); }
    }
}
animate();
