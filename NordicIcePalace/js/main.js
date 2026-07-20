// Nordic Ice Palace — main entry point
// Integrates: scene-builder, aurora, voxel-world, ui, palette, snow, time-of-day, dragons

import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { VoxelWorld } from './voxel-world.js';
import { buildScene } from './scene-builder.js';
import { createAurora } from './aurora.js';
import { createSnowSystem } from './snow.js';
import { createTODSystem } from './time-of-day.js';
import { createDragons } from './dragons.js';
import { PAL } from './palette.js';
import {
    showLoaderError,
    initDiagnostics,
    initDock,
    initPanels,
    initTypewriter,
} from './ui.js';

// ---------------------------------------------------------------------------
//  Init UI (early — catches load errors)
// ---------------------------------------------------------------------------
initDiagnostics();

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

// ---------------------------------------------------------------------------
//  SKY GRADIENT
// ---------------------------------------------------------------------------
function makeSky(colors = ['#0a1a1a', '#0d2b2b', '#1a3d3d']) {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    const step = 1 / (colors.length - 1);
    colors.forEach((col, i) => g.addColorStop(i * step, col));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
scene.background = makeSky();

// ---------------------------------------------------------------------------
//  STARFIELD (450 stars)
// ---------------------------------------------------------------------------
const starGeometry = new THREE.BufferGeometry();
const starCount = 450;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 500;
    starPositions[i * 3 + 1] = Math.random() * 200;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 500;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({
    color: 0xFFFACD, size: 1.5, transparent: true, opacity: 0.9, sizeAttenuation: false,
});
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// ---------------------------------------------------------------------------
//  FOG
// ---------------------------------------------------------------------------
scene.fog = new THREE.Fog(0x0a1428, 120, 280);

// ---------------------------------------------------------------------------
//  CAMERA
// ---------------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 800);
camera.position.set(55, 35, 55);

// ---------------------------------------------------------------------------
//  ORBIT CONTROLS
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 20;
controls.maxDistance = 160;
controls.maxPolarAngle = Math.PI * 0.52;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;

// ---------------------------------------------------------------------------
//  LIGHTING
// ---------------------------------------------------------------------------
const hemi = new THREE.HemisphereLight(0x4488aa, 0x1a2a3a, 0.8);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0xaaccff, 0.2);
moon.position.set(40, 80, -30);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 300;
const S = 100;
moon.shadow.camera.left = -S; moon.shadow.camera.right = S;
moon.shadow.camera.top = S; moon.shadow.camera.bottom = -S;
moon.shadow.bias = -0.0004;
moon.shadow.normalBias = 0.6;
scene.add(moon);
scene.add(moon.target);

const fill = new THREE.DirectionalLight(0x667799, 0.12);
fill.position.set(-40, 30, 40);
scene.add(fill);

// ---------------------------------------------------------------------------
//  BUILD THE WORLD
// ---------------------------------------------------------------------------
const world = new VoxelWorld();
const root = new THREE.Group();
scene.add(root);

const { spireLights, frostGroup, thickIceGroup } = buildScene({ scene, world, root });

// ---------------------------------------------------------------------------
//  SUBSYSTEMS
// ---------------------------------------------------------------------------
const auroraAPI = createAurora({ scene, root });
const snowSystem = createSnowSystem({ root });
const todSystem = createTODSystem({ auroraAPI });
const dragonSystem = createDragons({ root });

// ---------------------------------------------------------------------------
//  UI INITIALIZATION
// ---------------------------------------------------------------------------
initDock();
initPanels();
initTypewriter();

// ---------------------------------------------------------------------------
//  WIRE DOCK TOGGLES
// ---------------------------------------------------------------------------
const elRotate = document.getElementById('rotate');
const elSnowToggle = document.getElementById('snow-toggle');
const elShadows = document.getElementById('shadows');
const elSeason = document.getElementById('season');
const elDragons = document.getElementById('dragons-toggle');
const elHome = document.querySelector('label[title="Home"]');

if (elRotate) {
    elRotate.addEventListener('change', (e) => {
        controls.autoRotate = e.target.checked;
    });
}

if (elSnowToggle) {
    elSnowToggle.addEventListener('change', (e) => {
        snowSystem.setCount(e.target.checked ? parseInt(document.getElementById('snow-density').value, 10) : 0);
    });
}

if (elShadows) {
    elShadows.addEventListener('change', (e) => {
        renderer.shadowMap.enabled = e.target.checked;
        scene.traverse((obj) => {
            if (obj.isMesh && obj.material) obj.material.needsUpdate = true;
        });
    });
}

if (elSeason) {
    elSeason.addEventListener('change', (e) => {
        const isThick = e.target.checked;
        frostGroup.visible = isThick;
        thickIceGroup.visible = isThick;
    });
}

if (elDragons) {
    elDragons.addEventListener('change', (e) => {
        dragonSystem.setVisible(e.target.checked);
    });
}

if (elHome) {
    elHome.addEventListener('click', () => {
        window.location.href = '../index.html';
    });
}

// ---------------------------------------------------------------------------
//  WIRE AURORA PANEL
// ---------------------------------------------------------------------------
const auroraSpeedSlider = document.getElementById('aurora-speed');
const auroraIntensitySlider = document.getElementById('aurora-intensity');
const auroraCycleCheckbox = document.getElementById('aurora-cycle');
const auroraSpeedVal = document.getElementById('aurora-speed-val');
const auroraIntensityVal = document.getElementById('aurora-intensity-val');

if (auroraSpeedSlider) {
    auroraSpeedSlider.addEventListener('input', () => {
        const mapped = parseFloat(auroraSpeedSlider.value) / 100;
        auroraAPI.setSpeed(mapped);
        if (auroraSpeedVal) auroraSpeedVal.textContent = mapped.toFixed(1) + 'x';
    });
}

if (auroraIntensitySlider) {
    auroraIntensitySlider.addEventListener('input', () => {
        const val = parseFloat(auroraIntensitySlider.value);
        auroraAPI.setIntensity(val / 100);
        if (auroraIntensityVal) auroraIntensityVal.textContent = val + '%';
    });
}

if (auroraCycleCheckbox) {
    auroraCycleCheckbox.addEventListener('change', () => {
        auroraAPI.setColorCycleEnabled(auroraCycleCheckbox.checked);
    });
}

// ---------------------------------------------------------------------------
//  WIRE SNOW PANEL
// ---------------------------------------------------------------------------
const snowDensitySlider = document.getElementById('snow-density');
const snowVal = document.getElementById('snow-val');

if (snowDensitySlider) {
    snowDensitySlider.addEventListener('input', () => {
        const count = parseInt(snowDensitySlider.value, 10);
        snowSystem.setCount(count);
        if (snowVal) snowVal.textContent = count;
        // Keep toggle in sync
        if (elSnowToggle) elSnowToggle.checked = count > 0;
    });
}

// ---------------------------------------------------------------------------
//  WIRE TIME-OF-DAY PANEL
// ---------------------------------------------------------------------------
const todButtons = document.querySelectorAll('.tod-btn');
const timeLabel = document.getElementById('time-label');

todButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        todButtons.forEach((x) => x.classList.remove('active'));
        btn.classList.add('active');
        todSystem.setPreset(btn.dataset.preset);
        if (timeLabel) timeLabel.textContent = btn.textContent;
    });
});

// ---------------------------------------------------------------------------
//  RESIZE
// ---------------------------------------------------------------------------
window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

// ---------------------------------------------------------------------------
//  RENDER LOOP
// ---------------------------------------------------------------------------
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

    // Update subsystems
    auroraAPI.updateAurora(dt, elapsedTime);
    snowSystem.update(dt);
    todSystem.update(dt);
    dragonSystem.update(dt, elapsedTime);

    // Apply TOD interpolated values
    const sky = todSystem.getInterpolatedColor('sky');
    const fog = todSystem.getInterpolatedColor('fog');
    const hemiSky = todSystem.getInterpolatedColor('hemiSky');
    const hemiGround = todSystem.getInterpolatedColor('hemiGround');
    const hemiIntensity = todSystem.getInterpolatedColor('hemiIntensity');

    if (sky) scene.background = makeSky(sky);
    if (fog) scene.fog.color.set(fog);
    if (hemiSky) hemi.color.set(hemiSky);
    if (hemiGround) hemi.groundColor.set(hemiGround);
    if (hemiIntensity !== undefined) hemi.intensity = hemiIntensity;

    // Spire light flicker
    const pulse = 0.4 + Math.sin(elapsedTime * 2.1) * 0.15;
    for (const light of spireLights) {
        light.intensity = 2.5 * (pulse + 0.3);
    }

    renderer.render(scene, camera);

    if (firstFrame) {
        firstFrame = false;
        window.__kiroReady = true;
        const ld = document.getElementById('loader');
        if (ld) { ld.classList.add('hidden'); setTimeout(() => ld.remove(), 700); }
    }
}

animate();

// ---------------------------------------------------------------------------
//  EXPORTS (for testing/external access)
// ---------------------------------------------------------------------------
export { renderer, scene, camera, controls, starField, hemi, moon, fill, makeSky };
export { auroraAPI, snowSystem, todSystem, dragonSystem };
export { showLoaderError };
