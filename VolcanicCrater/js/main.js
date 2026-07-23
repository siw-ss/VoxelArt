import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { VoxelWorld } from './voxel-world.js';
import { buildScene } from './scene-builder.js';
import { createEffects } from './effects.js';
import {
    showLoaderError,
    initDiagnostics,
    initDock,
    initSunPanel,
    initLavaPanel,
    initTypewriter,
} from './ui.js';

// Navigation helper
function goToHome() {
    window.location.href = '../index.html';
}

// Init UI
initDiagnostics();
initDock();
initSunPanel();
initLavaPanel();
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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Sky gradient
function makeSky(night = false) {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    if (night) {
        g.addColorStop(0.00, '#050205');
        g.addColorStop(0.40, '#1a0808');
        g.addColorStop(0.70, '#2d0a0a');
        g.addColorStop(1.00, '#3a1010');
    } else {
        g.addColorStop(0.00, '#4a5568');
        g.addColorStop(0.35, '#5a4040');
        g.addColorStop(0.65, '#8a5030');
        g.addColorStop(1.00, '#FF6347');
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
scene.background = makeSky(false);
scene.fog = new THREE.Fog(0x4a3020, 80, 200);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 600);
camera.position.set(45, 35, 45);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 20;
controls.maxDistance = 120;
controls.maxPolarAngle = Math.PI * 0.48;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

// ---------------------------------------------------------------------------
//  LIGHTING
// ---------------------------------------------------------------------------
const hemi = new THREE.HemisphereLight(0x4a5568, 0x2d1a0a, 0.6);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0xff8040, 0.15);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffa060, 1.8);
sun.position.set(50, 70, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 250;
const S = 80;
sun.shadow.camera.left = -S; sun.shadow.camera.right = S;
sun.shadow.camera.top = S; sun.shadow.camera.bottom = -S;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.6;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0x4488cc, 0.25);
fill.position.set(-40, 50, -30);
scene.add(fill);

// ---------------------------------------------------------------------------
//  BUILD THE WORLD
// ---------------------------------------------------------------------------
const world = new VoxelWorld();
const root = new THREE.Group();
scene.add(root);

const { lavaChannels, ventPositions, crystalMeshPositions, lavaLight, lavaLight2 } =
    buildScene({ scene, world, root });

// Effects
const { updateEffects, triggerSeismic, setLavaOn, setSteamOn, setLavaSpeed } =
    createEffects({ scene, root, lavaChannels, ventPositions });

// ---------------------------------------------------------------------------
//  UI WIRING
// ---------------------------------------------------------------------------
const elRotate = document.getElementById('rotate');
const elLavaFlow = document.getElementById('lava-flow');
const elSteam = document.getElementById('steam');
const elSeismicBtn = document.getElementById('seismic-btn');
const elSun = document.getElementById('sun');
const elNightMode = document.getElementById('night-mode');
const elSunBtn = document.getElementById('sun-btn');
const elSunVal = document.getElementById('sun-val');
const elLavaSpeed = document.getElementById('lava-speed');
const elLavaVal = document.getElementById('lava-val');

elRotate.addEventListener('change', e => controls.autoRotate = e.target.checked);
elLavaFlow.addEventListener('change', e => setLavaOn(e.target.checked));
elSteam.addEventListener('change', e => setSteamOn(e.target.checked));

elSeismicBtn.addEventListener('click', () => {
    triggerSeismic();
    elSeismicBtn.classList.add('active');
    setTimeout(() => elSeismicBtn.classList.remove('active'), 3000);
});

elLavaSpeed.addEventListener('input', e => {
    const val = parseInt(e.target.value) / 100;
    setLavaSpeed(val);
    if (elLavaVal) elLavaVal.textContent = val.toFixed(1) + '×';
});

elSun.addEventListener('input', e => {
    const v = e.target.value / 100;
    const ang = Math.PI * (0.12 + v * 0.76);
    sun.position.set(Math.cos(ang) * 60, Math.sin(ang) * 70 + 5, 30);
    const warm = new THREE.Color().lerpColors(
        new THREE.Color(0xff4020), new THREE.Color(0xffa060), Math.min(1, v * 1.4)
    );
    sun.color.copy(warm);
    sun.intensity = 0.8 + v * 1.5;
    if (elSunVal) {
        const label = v < 0.18 ? 'Dawn' : v < 0.4 ? 'Morning'
            : v < 0.7 ? 'Midday' : v < 0.88 ? 'Afternoon' : 'Dusk';
        elSunVal.textContent = label;
    }
});

// Home view
const elHomeLabel = document.querySelector('label[title="Home view"]');
if (elHomeLabel) {
    elHomeLabel.addEventListener('click', () => goToHome());
}

// Night mode
let isNightMode = false;
if (elNightMode) {
    elNightMode.addEventListener('change', (e) => {
        isNightMode = e.target.checked;
        scene.background = makeSky(isNightMode);
        scene.fog = new THREE.Fog(isNightMode ? 0x1a0808 : 0x4a3020, isNightMode ? 60 : 80, isNightMode ? 160 : 200);

        if (isNightMode) {
            sun.color.set(0x332222);
            sun.intensity = 0.1;
            hemi.intensity = 0.15;
            ambient.intensity = 0.05;
            lavaLight.intensity = 25;
            lavaLight2.intensity = 15;
        } else {
            hemi.intensity = 0.6;
            ambient.intensity = 0.15;
            lavaLight.intensity = 15;
            lavaLight2.intensity = 8;
            elSun.dispatchEvent(new Event('input'));
        }

        if (elSunBtn) {
            elSunBtn.style.opacity = isNightMode ? '0.35' : '';
            elSunBtn.style.pointerEvents = isNightMode ? 'none' : '';
        }
    });
}

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

    const { seismicShake, seismicActive } = updateEffects(dt, t, camera);

    // Apply seismic camera shake
    if (seismicActive) {
        camera.position.x += seismicShake.x;
        camera.position.y += seismicShake.y;
    }

    // Lava pool pulsing glow
    const pulse = 0.8 + Math.sin(t * 1.5) * 0.2;
    lavaLight.intensity = (isNightMode ? 25 : 15) * pulse;
    lavaLight2.intensity = (isNightMode ? 15 : 8) * (1.1 - pulse * 0.2);

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
