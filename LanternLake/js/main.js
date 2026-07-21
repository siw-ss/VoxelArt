// Lantern Lake — main entry point
import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { VoxelWorld } from './voxel-world.js';
import { buildScene } from './scene-builder.js';
import { createLanternSystem } from './lanterns.js';
import { createFireflies, createWaterReflection, createClouds } from './effects.js';
import {
    showLoaderError, initDiagnostics, initDock, initPanels, initTypewriter,
} from './ui.js';

initDiagnostics();

// --- Renderer ---
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (err) {
    showLoaderError('WebGL is not available', 'Enable hardware acceleration in your browser settings.');
    throw err;
}
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();

// --- Sky gradient (adjustable via sunset slider) ---
function makeSky(t = 0.3) {
    // t: 0 = bright afternoon, 0.5 = golden hour, 1.0 = deep night
    const c = document.createElement('canvas');
    c.width = 2; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);

    // Interpolate sky colors based on time
    if (t < 0.3) {
        // Afternoon: bright blue sky
        const s = t / 0.3;
        g.addColorStop(0.0, lerpHex('#4a90d9', '#2d5a8b', s));
        g.addColorStop(0.4, lerpHex('#87ceeb', '#6ba5d4', s));
        g.addColorStop(0.7, lerpHex('#a8d8ea', '#ffb347', s));
        g.addColorStop(1.0, lerpHex('#d4e8f0', '#ffd080', s));
    } else if (t < 0.6) {
        // Golden hour: warm amber/rose
        const s = (t - 0.3) / 0.3;
        g.addColorStop(0.0, lerpHex('#2d5a8b', '#1a0d2e', s));
        g.addColorStop(0.3, lerpHex('#6b4090', '#7b2d8b', s));
        g.addColorStop(0.6, lerpHex('#ff8866', '#ff6b6b', s));
        g.addColorStop(0.85, lerpHex('#ffb347', '#ffb347', s));
        g.addColorStop(1.0, lerpHex('#ffd080', '#ffd080', s));
    } else {
        // Twilight to night
        const s = (t - 0.6) / 0.4;
        g.addColorStop(0.0, lerpHex('#1a0d2e', '#080410', s));
        g.addColorStop(0.3, lerpHex('#7b2d8b', '#2a1040', s));
        g.addColorStop(0.6, lerpHex('#ff6b6b', '#4a2040', s));
        g.addColorStop(0.85, lerpHex('#ffb347', '#2d1530', s));
        g.addColorStop(1.0, lerpHex('#ffd080', '#1a0d1e', s));
    }

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function lerpHex(a, b, t) {
    const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
    const r = Math.round(ar + (br - ar) * t), g2 = Math.round(ag + (bg - ag) * t), b2 = Math.round(ab + (bb - ab) * t);
    return '#' + r.toString(16).padStart(2, '0') + g2.toString(16).padStart(2, '0') + b2.toString(16).padStart(2, '0');
}

let sunsetValue = 0.3; // Start at golden hour
scene.background = makeSky(sunsetValue);

// --- Starfield (sparse, twilight) ---
const starGeo = new THREE.BufferGeometry();
const starCount = 200;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 400;
    starPos[i * 3 + 1] = 60 + Math.random() * 140;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 400;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.4, sizeAttenuation: false });
scene.add(new THREE.Points(starGeo, starMat));

// --- Fog ---
scene.fog = new THREE.Fog(0x2d1845, 80, 200);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 600);
camera.position.set(55, 30, 55);

// --- OrbitControls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 18;
controls.maxDistance = 120;
controls.maxPolarAngle = Math.PI * 0.52;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.25;

// --- Lighting ---
const hemi = new THREE.HemisphereLight(0x88ccff, 0x446633, 1.0);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(-40, 60, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 200;
const S = 80;
sun.shadow.camera.left = -S; sun.shadow.camera.right = S;
sun.shadow.camera.top = S; sun.shadow.camera.bottom = -S;
scene.add(sun);

// --- Build world ---
const world = new VoxelWorld();
const root = new THREE.Group();
scene.add(root);

const { shoreLights, boatLight } = buildScene({ scene, world, root });

// --- Subsystems ---
const lanternSystem = createLanternSystem({ root });
const fireflies = createFireflies({ root });
const waterReflection = createWaterReflection({ root });
const clouds = createClouds({ root });

// --- UI ---
initDock();
initPanels();
initTypewriter();

// --- Wire controls ---
const elRotate = document.getElementById('rotate');
const elFireflies = document.getElementById('fireflies-toggle');
const elBoat = document.getElementById('boat-toggle');
const elShadows = document.getElementById('shadows');
const elReflections = document.getElementById('reflections-toggle');
const elHome = document.querySelector('label[title="Home"]');

if (elRotate) elRotate.addEventListener('change', (e) => { controls.autoRotate = e.target.checked; });
if (elFireflies) elFireflies.addEventListener('change', (e) => { fireflies.setVisible(e.target.checked); });
if (elBoat) elBoat.addEventListener('change', (e) => { lanternSystem._config.releaseInterval = e.target.checked ? 10 : 99999; });
if (elShadows) elShadows.addEventListener('change', (e) => {
    renderer.shadowMap.enabled = e.target.checked;
    scene.traverse((obj) => { if (obj.isMesh && obj.material) obj.material.needsUpdate = true; });
});
if (elReflections) elReflections.addEventListener('change', (e) => {
    waterReflection.mesh.visible = e.target.checked;
});
if (elHome) elHome.addEventListener('click', () => { window.location.href = '../index.html'; });

// --- Lantern panel ---
const lanternCount = document.getElementById('lantern-count');
const lanternCountVal = document.getElementById('lantern-count-val');
const lanternSpeed = document.getElementById('lantern-speed');
const lanternSpeedVal = document.getElementById('lantern-speed-val');
const lanternInterval = document.getElementById('lantern-interval');
const lanternIntervalVal = document.getElementById('lantern-interval-val');

if (lanternCount) lanternCount.addEventListener('input', () => {
    lanternSystem.setCount(parseInt(lanternCount.value, 10));
    if (lanternCountVal) lanternCountVal.textContent = lanternCount.value;
});
if (lanternSpeed) lanternSpeed.addEventListener('input', () => {
    const v = parseFloat(lanternSpeed.value) / 100;
    lanternSystem.setSpeed(v);
    if (lanternSpeedVal) lanternSpeedVal.textContent = v.toFixed(1) + 'x';
});
if (lanternInterval) lanternInterval.addEventListener('input', () => {
    lanternSystem.setReleaseInterval(parseInt(lanternInterval.value, 10));
    if (lanternIntervalVal) lanternIntervalVal.textContent = lanternInterval.value + 's';
});

// --- Time of Day slider ---
const elSun = document.getElementById('sun');
const elSunVal = document.getElementById('sun-val');

if (elSun) {
    const sunDot = document.getElementById('sun-dot');
    function syncSunDot(v) {
        if (!sunDot) return;
        // Bezier arc: P0=(10,55) P1=(100,-15) P2=(190,55)
        const t = v;
        const x = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 100 + t * t * 190;
        const y = (1 - t) * (1 - t) * 55 + 2 * (1 - t) * t * -15 + t * t * 55;
        sunDot.setAttribute('cx', x.toFixed(1));
        sunDot.setAttribute('cy', y.toFixed(1));
    }

    function applyTimeOfDay(v) {
        sunsetValue = v;
        syncSunDot(v);

        // Update sky
        scene.background = makeSky(v);

        // Fog warmth → dark
        const fogR = 0.18 * (1 - v) + 0.03 * v;
        const fogG = 0.09 * (1 - v) + 0.015 * v;
        const fogB = 0.27 * (1 - v) + 0.06 * v;
        scene.fog.color.setRGB(fogR, fogG, fogB);

        // Stars
        starMat.opacity = v > 0.5 ? (v - 0.5) * 2 * 0.8 : 0;

        // Hemisphere
        hemi.intensity = 0.7 - v * 0.45;

        // Sun angle and warmth
        sun.intensity = Math.max(0.05, 0.4 * (1 - v));
        const sunColor = new THREE.Color().lerpColors(
            new THREE.Color(0xffcc88), new THREE.Color(0x222244), v
        );
        sun.color.copy(sunColor);
        sun.position.y = 15 - v * 25;

        // Ambient
        ambient.intensity = 0.3 - v * 0.2;

        // Water color shifts with time of day
        waterReflection.setTimeOfDay(v);

        // Label
        if (elSunVal) {
            const label = v < 0.2 ? 'Afternoon' : v < 0.45 ? 'Golden Hour' : v < 0.7 ? 'Twilight' : 'Night';
            elSunVal.textContent = label;
        }
    }

    // Apply initial time so lighting matches the slider's start position
    applyTimeOfDay(0.3);

    elSun.addEventListener('input', () => {
        const v = parseInt(elSun.value, 10) / 100;
        applyTimeOfDay(v);
    });
}

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

// --- Render loop ---
let lastTime = performance.now();
let elapsedTime = 0;
let firstFrame = true;

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    elapsedTime += dt;

    controls.update();
    lanternSystem.update(dt, elapsedTime);
    fireflies.update(dt, elapsedTime);
    waterReflection.update(dt, elapsedTime);
    clouds.update(dt);

    // Shore lantern flicker
    const flick = 0.8 + Math.sin(elapsedTime * 3.5) * 0.15 + Math.sin(elapsedTime * 7.3) * 0.05;
    for (const l of shoreLights) l.intensity = 1.5 * flick;
    boatLight.intensity = 2.0 * flick;

    renderer.render(scene, camera);

    if (firstFrame) {
        firstFrame = false;
        window.__kiroReady = true;
        const ld = document.getElementById('loader');
        if (ld) { ld.classList.add('hidden'); setTimeout(() => ld.remove(), 700); }
    }
}
animate();
