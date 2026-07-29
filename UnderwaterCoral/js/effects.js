import * as THREE from '../vendor/three.module.js';
import { PALETTE } from './palette.js';

// ---------------------------------------------------------------------------
//  EFFECTS — fish schools, rising bubbles, swaying kelp, drifting motes
// ---------------------------------------------------------------------------
export function createEffects({ root, kelpAnchors, reefRadius }) {

    const _m = new THREE.Matrix4();
    const _q = new THREE.Quaternion();
    const _p = new THREE.Vector3();
    const _s = new THREE.Vector3(1, 1, 1);
    const _up = new THREE.Vector3(0, 1, 0);

    // ---- FISH SCHOOLS -----------------------------------------------------
    // Three schools, each orbiting its own centre with per-fish offsets.
    const SCHOOL_DEFS = [
        { count: 70, color: PALETTE.fishBlue, cx: 0, cy: 14, cz: 0, radius: 24, speed: 0.22, size: 0.55 },
        { count: 50, color: PALETTE.fishYellow, cx: -16, cy: 10, cz: 12, radius: 14, speed: -0.3, size: 0.45 },
        { count: 40, color: PALETTE.fishOrange, cx: 18, cy: 18, cz: -10, radius: 17, speed: 0.26, size: 0.5 },
    ];

    const fishGeo = new THREE.BoxGeometry(1.6, 0.7, 0.5);
    const schools = [];

    for (const def of SCHOOL_DEFS) {
        const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(def.color),
            roughness: 0.55,
            emissive: new THREE.Color(def.color),
            emissiveIntensity: 0.18,
        });
        const mesh = new THREE.InstancedMesh(fishGeo, mat, def.count);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.frustumCulled = false;
        mesh.castShadow = false;
        root.add(mesh);

        const fish = [];
        for (let i = 0; i < def.count; i++) {
            fish.push({
                angle: Math.random() * Math.PI * 2,
                radiusOff: (Math.random() - 0.5) * 7,
                yOff: (Math.random() - 0.5) * 6,
                bobPhase: Math.random() * Math.PI * 2,
                bobAmp: 0.4 + Math.random() * 0.8,
                speedMul: 0.85 + Math.random() * 0.3,
            });
        }
        schools.push({ def, mesh, fish });
    }

    // ---- BUBBLES ----------------------------------------------------------
    const BUBBLE_MAX = 200;
    const bubbleGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const bubbleMat = new THREE.MeshStandardMaterial({
        color: 0xd8f6ff,
        roughness: 0.15,
        transparent: true,
        opacity: 0.55,
        emissive: 0x9fe4ff,
        emissiveIntensity: 0.25,
    });
    const bubbleMesh = new THREE.InstancedMesh(bubbleGeo, bubbleMat, BUBBLE_MAX);
    bubbleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    bubbleMesh.frustumCulled = false;
    root.add(bubbleMesh);

    const bubbles = [];
    function resetBubble(b, stagger) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * reefRadius;
        b.x = Math.cos(a) * r;
        b.z = Math.sin(a) * r;
        b.y = stagger ? Math.random() * 44 : Math.random() * 3;
        b.vy = 2.2 + Math.random() * 2.6;
        b.wobble = Math.random() * Math.PI * 2;
        b.wobbleAmp = 0.3 + Math.random() * 0.7;
        b.scale = 0.5 + Math.random() * 0.9;
    }
    for (let i = 0; i < BUBBLE_MAX; i++) {
        const b = {};
        resetBubble(b, true);
        bubbles.push(b);
    }

    let bubbleActive = 100;
    let bubbleSpeed = 1.0;

    // ---- KELP -------------------------------------------------------------
    // Each kelp segment is an instance we reposition every frame so the
    // stalks can bend with the current.
    let kelpSegTotal = 0;
    for (const k of kelpAnchors) kelpSegTotal += k.height;

    const kelpGeo = new THREE.BoxGeometry(0.55, 1, 0.55);
    const kelpMat = new THREE.MeshStandardMaterial({
        color: 0x3d7a4a, roughness: 0.95,
    });
    const kelpMesh = new THREE.InstancedMesh(kelpGeo, kelpMat, Math.max(1, kelpSegTotal));
    kelpMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    kelpMesh.frustumCulled = false;
    kelpMesh.castShadow = true;
    root.add(kelpMesh);

    const kelpColor = new THREE.Color();
    {
        // Bake per-segment colour once: darker at the base, lighter at the tip.
        let idx = 0;
        for (const k of kelpAnchors) {
            for (let s = 0; s < k.height; s++) {
                const t = s / Math.max(1, k.height - 1);
                kelpColor.setStyle(PALETTE.kelp[s % PALETTE.kelp.length]);
                kelpColor.offsetHSL(0, 0, t * 0.12 - 0.04);
                kelpMesh.setColorAt(idx++, kelpColor);
            }
        }
        if (kelpMesh.instanceColor) kelpMesh.instanceColor.needsUpdate = true;
    }

    // ---- DRIFTING MOTES (marine snow) -------------------------------------
    const MOTE_COUNT = 140;
    const moteGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const moteMat = new THREE.MeshStandardMaterial({
        color: 0xcfeaf2, roughness: 0.7, transparent: true, opacity: 0.4,
        emissive: 0x8fd8ea, emissiveIntensity: 0.3,
    });
    const moteMesh = new THREE.InstancedMesh(moteGeo, moteMat, MOTE_COUNT);
    moteMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    moteMesh.frustumCulled = false;
    root.add(moteMesh);

    const motes = [];
    for (let i = 0; i < MOTE_COUNT; i++) {
        motes.push({
            x: (Math.random() - 0.5) * reefRadius * 2,
            y: Math.random() * 40,
            z: (Math.random() - 0.5) * reefRadius * 2,
            phase: Math.random() * Math.PI * 2,
            speed: 0.15 + Math.random() * 0.35,
            drift: 0.4 + Math.random() * 1.2,
        });
    }

    // ---- CONTROLS ---------------------------------------------------------
    let fishOn = true;
    function setFishOn(on) {
        fishOn = on;
        for (const s of schools) s.mesh.visible = on;
    }
    function setBubbleCount(n) {
        bubbleActive = Math.max(0, Math.min(BUBBLE_MAX, n | 0));
    }
    function setBubbleSpeed(mult) { bubbleSpeed = mult; }

    // ---- UPDATE -----------------------------------------------------------
    function updateEffects(dt, t) {
        // Fish
        if (fishOn) {
            for (const school of schools) {
                const { def, mesh, fish } = school;
                for (let i = 0; i < fish.length; i++) {
                    const f = fish[i];
                    f.angle += def.speed * f.speedMul * dt;
                    const r = def.radius + f.radiusOff;
                    const x = def.cx + Math.cos(f.angle) * r;
                    const z = def.cz + Math.sin(f.angle) * r;
                    const y = def.cy + f.yOff + Math.sin(t * 1.4 + f.bobPhase) * f.bobAmp;

                    // Face along the direction of travel
                    const heading = f.angle + (def.speed > 0 ? Math.PI / 2 : -Math.PI / 2);
                    _q.setFromAxisAngle(_up, -heading);
                    _p.set(x, y, z);
                    _s.set(def.size, def.size, def.size);
                    _m.compose(_p, _q, _s);
                    mesh.setMatrixAt(i, _m);
                }
                mesh.instanceMatrix.needsUpdate = true;
            }
        }

        // Bubbles — inactive ones are collapsed to zero scale
        for (let i = 0; i < BUBBLE_MAX; i++) {
            const b = bubbles[i];
            if (i < bubbleActive) {
                b.y += b.vy * bubbleSpeed * dt;
                if (b.y > 46) resetBubble(b, false);
                const wob = Math.sin(t * 2.0 + b.wobble) * b.wobbleAmp;
                _p.set(b.x + wob, b.y, b.z + Math.cos(t * 1.7 + b.wobble) * b.wobbleAmp);
                _s.set(b.scale, b.scale, b.scale);
            } else {
                _p.set(0, -999, 0);
                _s.set(0.0001, 0.0001, 0.0001);
            }
            _q.identity();
            _m.compose(_p, _q, _s);
            bubbleMesh.setMatrixAt(i, _m);
        }
        bubbleMesh.instanceMatrix.needsUpdate = true;

        // Kelp sway — offset grows toward the tip so stalks bend, not shear
        let ki = 0;
        for (const k of kelpAnchors) {
            for (let s = 0; s < k.height; s++) {
                const t01 = s / Math.max(1, k.height - 1);
                const bend = Math.sin(t * 0.8 + k.phase + t01 * 1.6) * k.sway * t01 * t01 * 3.0;
                const bendZ = Math.cos(t * 0.6 + k.phase * 1.3 + t01 * 1.2) * k.sway * t01 * t01 * 2.0;
                _p.set(k.x + bend, k.y + s, k.z + bendZ);
                _q.identity();
                _s.set(1, 1, 1);
                _m.compose(_p, _q, _s);
                kelpMesh.setMatrixAt(ki++, _m);
            }
        }
        kelpMesh.instanceMatrix.needsUpdate = true;

        // Marine snow
        for (let i = 0; i < MOTE_COUNT; i++) {
            const p = motes[i];
            p.y -= p.speed * dt;
            if (p.y < 0) p.y = 42;
            _p.set(
                p.x + Math.sin(t * 0.25 + p.phase) * p.drift,
                p.y,
                p.z + Math.cos(t * 0.2 + p.phase) * p.drift
            );
            _q.identity();
            _s.set(1, 1, 1);
            _m.compose(_p, _q, _s);
            moteMesh.setMatrixAt(i, _m);
        }
        moteMesh.instanceMatrix.needsUpdate = true;
    }

    return { updateEffects, setFishOn, setBubbleCount, setBubbleSpeed };
}
