import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { VoxelWorld } from './voxel-world.js';
import { buildScene } from './scene-builder.js';
import { createPetals } from './petals.js';
import {
    showLoaderError,
    initDiagnostics,
    initDock,
    initSunPanel,
    initTypewriter,
} from './ui.js';

// On-screen diagnostics + DOM UI behaviors (independent of the 3D scene).
initDiagnostics();
initDock();
initSunPanel();
initTypewriter();

// ---------------------------------------------------------------------------
//  RENDERER / SCENE / CAMERA
// ---------------------------------------------------------------------------
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (err) {
    showLoaderError('WebGL is not available',
        'Your browser could not create a WebGL context, so the 3D scene cannot render.<br><br>' +
        'In Chrome go to <b>Settings → System</b> and enable <b>"Use hardware acceleration when available"</b>, then relaunch. ' +
        'You can also check <b>chrome://gpu</b> to see if WebGL is blocklisted.');
    throw err;
}
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Gradient sky background
function makeSky() {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.00, '#8ec9f2'); // top — clear blue
    g.addColorStop(0.38, '#a9dbef'); // mid sky
    g.addColorStop(0.72, '#f3d9e6'); // pink haze
    g.addColorStop(1.00, '#ffe9d6'); // warm horizon
    ctx.fillStyle = g; ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
scene.background = makeSky();
scene.fog = new THREE.Fog(0xdfe7f2, 120, 260);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 600);
camera.position.set(62, 46, 74);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 15, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 28;
controls.maxDistance = 160;
controls.maxPolarAngle = Math.PI * 0.49;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.55;

// ---------------------------------------------------------------------------
//  LIGHTING
// ---------------------------------------------------------------------------
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6b5b73, 0.85);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0xffffff, 0.18);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff2dd, 2.1);
sun.position.set(58, 78, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 260;
const S = 95;
sun.shadow.camera.left = -S; sun.shadow.camera.right = S;
sun.shadow.camera.top = S; sun.shadow.camera.bottom = -S;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.6;
scene.add(sun);
scene.add(sun.target);

// Soft fill from the cool side
const fill = new THREE.DirectionalLight(0x9fc0ff, 0.4);
fill.position.set(-50, 40, -30);
scene.add(fill);

// ---------------------------------------------------------------------------
//  BUILD THE WORLD
// ---------------------------------------------------------------------------
const world = new VoxelWorld();
const root = new THREE.Group();
scene.add(root);

const { lanternLights, R } = buildScene({ scene, world, root });

// Petals + clouds
const { updatePetals, setPetalsOn, cloudGroup } = createPetals({ scene, R });

// ---------------------------------------------------------------------------
//  UI WIRING — connect dock controls to scene objects
// ---------------------------------------------------------------------------
const elRotate = document.getElementById('rotate');
const elPetals = document.getElementById('petals');
const elShadows = document.getElementById('shadows');
const elSun = document.getElementById('sun');
elRotate.addEventListener('change', e => controls.autoRotate = e.target.checked);
elPetals.addEventListener('change', e => { setPetalsOn(e.target.checked); });
elShadows.addEventListener('change', e => { renderer.shadowMap.enabled = e.target.checked; scene.traverse(o => { if (o.isMesh) o.material.needsUpdate = true; }); });
const elSunVal = document.getElementById('sun-val');
elSun.addEventListener('input', e => {
    const v = e.target.value / 100;          // 0..1 -> arc across sky
    const ang = Math.PI * (0.12 + v * 0.76);
    sun.position.set(Math.cos(ang) * 80, Math.sin(ang) * 85 + 8, 40);
    const warm = new THREE.Color().lerpColors(new THREE.Color(0xffb066), new THREE.Color(0xfff2dd), Math.min(1, v * 1.4));
    sun.color.copy(warm);
    sun.intensity = 1.2 + v * 1.4;
    if (elSunVal) {
        const label = v < 0.18 ? 'Sunrise' : v < 0.4 ? 'Golden hour'
            : v < 0.7 ? 'Midday' : v < 0.88 ? 'Afternoon' : 'High noon';
        elSunVal.textContent = label;
    }
});

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

// ---------------------------------------------------------------------------
//  RENDER LOOP
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
let flick = 0;
let firstFrame = true;
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    updatePetals(dt, t);

    // gentle lantern flicker
    flick += dt;
    const f = 0.85 + Math.sin(flick * 7) * 0.06 + Math.sin(flick * 13.7) * 0.04;
    for (const l of lanternLights) l.intensity = (l.userData.base ?? (l.userData.base = l.intensity)) * f;

    // drift clouds slowly
    cloudGroup.position.x = (Math.sin(t * 0.02) * 6);

    controls.update();
    renderer.render(scene, camera);

    // hide loader only after the first real frame has actually drawn
    if (firstFrame) {
        firstFrame = false;
        window.__kiroReady = true;
        const ld = document.getElementById('loader');
        if (ld) { ld.classList.add('hidden'); setTimeout(() => ld.remove(), 700); }
    }
}
animate();
