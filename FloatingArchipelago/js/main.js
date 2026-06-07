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
    initTypewriter,
} from './ui.js';
import { createAnimals } from './animals.js';

// Navigation helper
function goToHome() {
    window.location.href = '../index.html';
}

// Init UI
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
        'Your browser could not create a WebGL context.<br><br>' +
        'Enable hardware acceleration in your browser settings.');
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

// Starfield — hidden by default
const starGeometry = new THREE.BufferGeometry();
const starCount = 400;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 500;
    starPositions[i * 3 + 1] = 60 + Math.random() * 200;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 500;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xFFFACD, size: 1.5, transparent: true, opacity: 0 });
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// Sky gradient
function makeSky(night = false) {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    if (night) {
        g.addColorStop(0.00, '#050510');
        g.addColorStop(0.38, '#191970');
        g.addColorStop(0.72, '#1a2545');
        g.addColorStop(1.00, '#2d3b6e');
    } else {
        g.addColorStop(0.00, '#1E90FF');
        g.addColorStop(0.38, '#4AA8E8');
        g.addColorStop(0.72, '#87CEEB');
        g.addColorStop(1.00, '#B0E0FF');
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
scene.background = makeSky(false);
scene.fog = new THREE.Fog(0x87CEEB, 140, 300);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 800);
camera.position.set(50, 30, 50);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 20;
controls.maxDistance = 160;
controls.maxPolarAngle = Math.PI * 0.52;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;

// ---------------------------------------------------------------------------
//  LIGHTING
// ---------------------------------------------------------------------------
const hemi = new THREE.HemisphereLight(0x87CEEB, 0x4A6741, 0.8);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff8e8, 2.0);
sun.position.set(60, 80, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 300;
const S = 100;
sun.shadow.camera.left = -S; sun.shadow.camera.right = S;
sun.shadow.camera.top = S; sun.shadow.camera.bottom = -S;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.6;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0x9fc0ff, 0.35);
fill.position.set(-50, 40, -30);
scene.add(fill);

// ---------------------------------------------------------------------------
//  BUILD THE WORLD
// ---------------------------------------------------------------------------
const world = new VoxelWorld();
const root = new THREE.Group();
scene.add(root);

const { bridgeLights, islands } = buildScene({ scene, world, root });

// Effects (waterfalls, particles, clouds)
const { updateEffects, setWaterfallsOn, cloudGroup } = createEffects({ scene, root, islands });

// Animals (chickens and chicks on bridges)
const { updateAnimals, setChickCount } = createAnimals({ scene, root, islands });

// ---------------------------------------------------------------------------
//  GRAVITY TOGGLE — rotate islands independently around their centers
// ---------------------------------------------------------------------------
let gravityShifted = false;
const originalPositions = islands.map(isl => ({ y: isl.y }));
let gravityProgress = 1;
const GRAVITY_ANIMATION_SPEED = 0.5; // seconds to reach full rotation speed

// Rotation state for each island
const islandRotations = islands.map((isl, idx) => ({
    quaternion: new THREE.Quaternion(),
    angularVelocity: new THREE.Vector3(),
    center: new THREE.Vector3(isl.cx, isl.y, isl.cz),
    speedMultiplier: idx === 0 ? 2.0 : 0.8 + Math.random() * 0.6, // central faster
    direction: idx % 2 === 0 ? 1 : -1, // alternating directions
}));

// ---------------------------------------------------------------------------
//  UI WIRING
// ---------------------------------------------------------------------------
const elRotate = document.getElementById('rotate');
const elWaterfalls = document.getElementById('waterfalls');
const elGravity = document.getElementById('gravity');
const elSun = document.getElementById('sun');
const elNightMode = document.getElementById('night-mode');
const elSunBtn = document.getElementById('sun-btn');
const elSunVal = document.getElementById('sun-val');

elRotate.addEventListener('change', e => controls.autoRotate = e.target.checked);
elWaterfalls.addEventListener('change', e => setWaterfallsOn(e.target.checked));

elGravity.addEventListener('change', e => {
    gravityShifted = e.target.checked;
    gravityProgress = 0;
    if (gravityShifted) {
        // Start rotations with random angular velocities
        for (let i = 0; i < islandRotations.length; i++) {
            const rot = islandRotations[i];
            const speed = 3 + Math.random() * 2; // rad/sec
            const randomAxis = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            rot.angularVelocity = randomAxis.multiplyScalar(speed * rot.direction * rot.speedMultiplier);
        }
    } else {
        // Stop rotations
        for (const rot of islandRotations) {
            rot.angularVelocity.set(0, 0, 0);
        }
    }
});

elSun.addEventListener('input', e => {
    const v = e.target.value / 100;
    const ang = Math.PI * (0.12 + v * 0.76);
    sun.position.set(Math.cos(ang) * 80, Math.sin(ang) * 85 + 8, 40);
    const warm = new THREE.Color().lerpColors(new THREE.Color(0xffb066), new THREE.Color(0xfff8e8), Math.min(1, v * 1.4));
    sun.color.copy(warm);
    sun.intensity = 1.2 + v * 1.4;
    if (elSunVal) {
        const label = v < 0.18 ? 'Sunrise' : v < 0.4 ? 'Golden hour'
            : v < 0.7 ? 'Midday' : v < 0.88 ? 'Afternoon' : 'High noon';
        elSunVal.textContent = label;
    }
});

// Home view
const elHomeLabel = document.querySelector('label[title="Home view"]');
if (elHomeLabel) {
    elHomeLabel.addEventListener('click', () => goToHome());
}

// Chick count panel
const elChickBtn = document.getElementById('chick-btn');
const elChickPanel = document.getElementById('chick-panel');
const elChickCount = document.getElementById('chick-count');
const elChickVal = document.getElementById('chick-val');

if (elChickBtn && elChickPanel && elChickCount) {
    function openChickPanel() {
        elChickPanel.classList.add('open');
        elChickBtn.classList.add('panel-open');
    }
    function closeChickPanel() {
        elChickPanel.classList.remove('open');
        elChickBtn.classList.remove('panel-open');
    }

    elChickBtn.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (elChickPanel.classList.contains('open')) {
            closeChickPanel();
        } else {
            openChickPanel();
        }
    });

    elChickPanel.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
    });

    document.addEventListener('pointerdown', function (e) {
        if (!elChickPanel.classList.contains('open')) return;
        if (elChickBtn.contains(e.target) || elChickPanel.contains(e.target)) return;
        closeChickPanel();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeChickPanel();
    });

    elChickCount.addEventListener('input', function (e) {
        const count = parseInt(e.target.value, 10);
        setChickCount(count);
        if (elChickVal) elChickVal.textContent = count;
    });

    if (elChickVal) elChickVal.textContent = elChickCount.value;
}

// Night mode
let isNightMode = false;
if (elNightMode) {
    elNightMode.addEventListener('change', (e) => {
        isNightMode = e.target.checked;
        scene.background = makeSky(isNightMode);
        starField.material.opacity = isNightMode ? 1 : 0;
        scene.fog = new THREE.Fog(isNightMode ? 0x191970 : 0x87CEEB, 140, 300);

        if (isNightMode) {
            sun.color.set(0x3355aa);
            sun.intensity = 0.15;
            hemi.intensity = 0.2;
            ambient.intensity = 0.08;
        } else {
            hemi.intensity = 0.8;
            ambient.intensity = 0.15;
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

    updateEffects(dt, t);

    // Animate animals
    updateAnimals(dt, t);

    // Animate island rotations
    if (gravityShifted && gravityProgress < 1) {
        gravityProgress = Math.min(1, gravityProgress + dt / GRAVITY_ANIMATION_SPEED);
    }
    
    if (gravityShifted) {
        // Update island rotations
        for (let i = 0; i < islandRotations.length; i++) {
            const rot = islandRotations[i];
            
            // Ease in the angular velocity
            const speedScale = Math.min(1, gravityProgress / (GRAVITY_ANIMATION_SPEED * 0.5));
            const scaledVelocity = rot.angularVelocity.clone().multiplyScalar(speedScale);
            
            // Update rotation using angular velocity
            const deltaQuat = new THREE.Quaternion();
            const angle = scaledVelocity.length() * dt;
            if (angle > 0.001) {
                deltaQuat.setFromAxisAngle(scaledVelocity.normalize(), angle);
                rot.quaternion.multiplyQuaternions(deltaQuat, rot.quaternion);
            }
        }
        
        // Apply cumulative rotation to root
        // This creates a unified spin effect where all islands rotate together
        const mainAxis = new THREE.Vector3(0.2, 1, 0.15).normalize();
        const mainAngle = t * 0.6; // continuous rotation speed
        const mainQuat = new THREE.Quaternion();
        mainQuat.setFromAxisAngle(mainAxis, mainAngle);
        root.quaternion.copy(mainQuat);
    } else {
        // Return to identity
        root.quaternion.identity();
    }

    // Crystal bridge glow pulse
    const pulse = 0.4 + Math.sin(t * 2.1) * 0.15;
    for (const bl of bridgeLights) {
        bl.intensity = 4 * (pulse + 0.3);
    }

    // Drift clouds
    cloudGroup.position.x = Math.sin(t * 0.015) * 8;
    cloudGroup.position.z = Math.cos(t * 0.01) * 4;

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
