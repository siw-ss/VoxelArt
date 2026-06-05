import * as THREE from '../vendor/three.module.js';

// ---------------------------------------------------------------------------
//  ANIMALS — Small chickens hopping between islands via crystal bridges.
//  Each chicken has a unique brownish color palette.
// ---------------------------------------------------------------------------

function fur(color, roughness = 0.92) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

// Color palettes for unique chickens (various brown shades)
const CHICKEN_PALETTES = [
    { body: 0x8B5E3C, wing: 0x6B4226, tail: 0x4A2E1A, comb: 0xCC2200, beak: 0xE8A020 },
    { body: 0xA0714A, wing: 0x7D5030, tail: 0x5C3820, comb: 0xDD3311, beak: 0xF0B030 },
    { body: 0xC4956A, wing: 0x9B7048, tail: 0x6E4A2E, comb: 0xBB1100, beak: 0xDDA030 },
    { body: 0x6E4028, wing: 0x4D2C18, tail: 0x3A2010, comb: 0xEE3322, beak: 0xF5C040 },
    { body: 0xB08050, wing: 0x8A5C38, tail: 0x604020, comb: 0xCC1500, beak: 0xE09020 },
];

function buildChicken(paletteIdx) {
    const root = new THREE.Group();
    const pal = CHICKEN_PALETTES[paletteIdx % CHICKEN_PALETTES.length];

    const bodyMat = fur(pal.body);
    const wingMat = fur(pal.wing);
    const tailMat = fur(pal.tail);
    const combMat = fur(pal.comb, 0.7);
    const beakMat = fur(pal.beak, 0.6);
    const legMat = fur(0xE8A830, 0.6);
    const eyeMat = fur(0x0A0505, 0.2);

    // Body (round, plump)
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), bodyMat);
    body.scale.set(0.32, 0.3, 0.4);
    body.position.set(0, 0.35, 0);
    body.castShadow = true;
    root.add(body);

    // Breast (lighter/puffed front)
    const breast = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), fur(
        new THREE.Color(pal.body).lerp(new THREE.Color(0xFFFFFF), 0.15).getHex()
    ));
    breast.scale.set(0.22, 0.24, 0.25);
    breast.position.set(0, 0.32, 0.12);
    root.add(breast);

    // Head (smaller, round)
    const head = new THREE.Group();
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 10), bodyMat);
    skull.scale.set(0.16, 0.17, 0.16);
    head.add(skull);

    // Eyes
    [-1, 1].forEach(side => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 7, 7), eyeMat);
        eye.position.set(side * 0.09, 0.03, 0.11);
        head.add(eye);
        // Tiny white highlight
        const shine = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 5),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 0.4, roughness: 0.1 }));
        shine.position.set(side * 0.075, 0.045, 0.12);
        head.add(shine);
    });

    // Beak (small cone pointing forward)
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 6), beakMat);
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, -0.01, 0.17);
    head.add(beak);

    // Comb (on top of head)
    const comb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), combMat);
    comb.scale.set(0.6, 1.2, 0.8);
    comb.position.set(0, 0.15, 0.03);
    head.add(comb);
    root.userData.comb = comb;

    // Wattle (small red bit under beak)
    const wattle = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 5), combMat);
    wattle.scale.set(0.8, 1.2, 0.6);
    wattle.position.set(0, -0.08, 0.12);
    head.add(wattle);

    head.position.set(0, 0.62, 0.22);
    root.add(head);
    root.userData.head = head;

    // Wings (leaf-shaped, tucked to sides)
    const wingGeo = new THREE.SphereGeometry(1, 8, 6);

    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.scale.set(0.08, 0.18, 0.28);
    wingL.position.set(-0.25, 0.35, -0.03);
    wingL.rotation.z = 0.2;
    wingL.castShadow = true;
    root.add(wingL);
    root.userData.wingL = wingL;

    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.scale.set(0.08, 0.18, 0.28);
    wingR.position.set(0.25, 0.35, -0.03);
    wingR.rotation.z = -0.2;
    wingR.castShadow = true;
    root.add(wingR);
    root.userData.wingR = wingR;

    // Tail feathers (fanned upward)
    for (let i = -1; i <= 1; i++) {
        const feather = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.025, 0.2, 3, 5),
            tailMat
        );
        feather.position.set(i * 0.06, 0.45, -0.32);
        feather.rotation.x = 0.6 + Math.abs(i) * 0.15;
        feather.rotation.z = i * 0.15;
        root.add(feather);
    }
    // Extra fluffy tail base
    const tailFluff = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), tailMat);
    tailFluff.position.set(0, 0.38, -0.28);
    root.add(tailFluff);
    root.userData.tailFluff = tailFluff;

    // Legs (thin, yellow/orange)
    const legGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.18, 5);
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.1, 0.08, 0.02);
    root.add(legL);
    root.userData.legL = legL;

    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.1, 0.08, 0.02);
    root.add(legR);
    root.userData.legR = legR;

    // Feet (small flat triangles)
    const footGeo = new THREE.ConeGeometry(0.04, 0.08, 3);
    const footL = new THREE.Mesh(footGeo, legMat);
    footL.rotation.x = -Math.PI / 2;
    footL.position.set(-0.1, 0.0, 0.05);
    root.add(footL);

    const footR = new THREE.Mesh(footGeo, legMat);
    footR.rotation.x = -Math.PI / 2;
    footR.position.set(0.1, 0.0, 0.05);
    root.add(footR);

    root.scale.setScalar(1.3);
    return root;
}

// ============================================================================
//  CHICK — tiny fluffy yellow baby chicken
// ============================================================================
const CHICK_YELLOWS = [0xFFE040];

function buildChick() {
    const root = new THREE.Group();
    const col = 0xFFE040;
    const chickMat = fur(col, 0.95);
    const beakMat = fur(0xF08010, 0.6);
    const eyeMat = fur(0x0A0505, 0.2);

    // Body (round fluffy puffball)
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), chickMat);
    body.scale.set(0.18, 0.17, 0.2);
    body.position.set(0, 0.17, 0);
    body.castShadow = true;
    root.add(body);

    // Head (slightly smaller sphere)
    const head = new THREE.Group();
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), chickMat);
    skull.scale.set(0.13, 0.13, 0.12);
    head.add(skull);

    // Eyes (tiny dots)
    [-1, 1].forEach(side => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
        eye.position.set(side * 0.06, 0.02, 0.09);
        head.add(eye);
    });

    // Beak (tiny)
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 5), beakMat);
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, -0.01, 0.12);
    head.add(beak);

    head.position.set(0, 0.32, 0.1);
    root.add(head);
    root.userData.head = head;

    // Tiny wing nubs
    const wingGeo = new THREE.SphereGeometry(1, 6, 5);
    const wingL = new THREE.Mesh(wingGeo, chickMat);
    wingL.scale.set(0.04, 0.08, 0.1);
    wingL.position.set(-0.14, 0.18, 0);
    root.add(wingL);
    root.userData.wingL = wingL;

    const wingR = new THREE.Mesh(wingGeo, chickMat);
    wingR.scale.set(0.04, 0.08, 0.1);
    wingR.position.set(0.14, 0.18, 0);
    root.add(wingR);
    root.userData.wingR = wingR;

    // Tiny legs
    const legMat2 = fur(0xE8A020, 0.6);
    const legGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.08, 4);
    const legL = new THREE.Mesh(legGeo, legMat2);
    legL.position.set(-0.06, 0.04, 0.01);
    root.add(legL);
    root.userData.legL = legL;

    const legR = new THREE.Mesh(legGeo, legMat2);
    legR.position.set(0.06, 0.04, 0.01);
    root.add(legR);
    root.userData.legR = legR;

    root.scale.setScalar(0.9);
    return root;
}

// ============================================================================
//  Bridge waypoint calculation (matching scene-builder arc)
// ============================================================================
function computeBridgeWaypoints(islands, bridgeIdx) {
    const pairs = [[0, 1], [0, 2], [0, 3], [0, 4]];
    const [a, b] = pairs[bridgeIdx];
    const ia = islands[a], ib = islands[b];
    const dirX = ib.cx - ia.cx, dirZ = ib.cz - ia.cz;
    const len = Math.hypot(dirX, dirZ);
    const nx = dirX / len, nz = dirZ / len;

    const startX = ia.cx + nx * ia.rx * 0.8;
    const startZ = ia.cz + nz * ia.rz * 0.8;
    const startY = ia.y + 3;
    const endX = ib.cx - nx * ib.rx * 0.8;
    const endZ = ib.cz - nz * ib.rz * 0.8;
    const endY = ib.y + 3;

    const totalDist = Math.hypot(endX - startX, endZ - startZ);
    const numWaypoints = Math.max(8, Math.ceil(totalDist / 3));
    const waypoints = [];

    for (let i = 0; i <= numWaypoints; i++) {
        const t = i / numWaypoints;
        const x = THREE.MathUtils.lerp(startX, endX, t);
        const z = THREE.MathUtils.lerp(startZ, endZ, t);
        const arc = Math.sin(t * Math.PI) * 8;
        const y = THREE.MathUtils.lerp(startY, endY, t) + arc;
        waypoints.push({ x, y, z });
    }

    return { waypoints, fromIsland: a, toIsland: b };
}

// ============================================================================
//  MAIN EXPORT
// ============================================================================
export function createAnimals({ scene, islands }) {
    const CHICKEN_COUNT = 4;
    const chickens = [];

    const bridges = [];
    for (let i = 0; i < 4; i++) {
        bridges.push(computeBridgeWaypoints(islands, i));
    }

    // Which bridges connect to which islands
    const bridgePairs = [[0, 1], [0, 2], [0, 3], [0, 4]];

    // Get bridges that touch a given island index
    function bridgesForIsland(islIdx) {
        const result = [];
        for (let i = 0; i < bridgePairs.length; i++) {
            if (bridgePairs[i][0] === islIdx || bridgePairs[i][1] === islIdx) {
                result.push(i);
            }
        }
        return result;
    }

    // Generate a random wander target on an island surface
    function randomIslandPos(islIdx) {
        const isl = islands[islIdx];
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 0.5; // stay within 50% of radius
        return {
            x: isl.cx + Math.cos(angle) * isl.rx * dist,
            y: isl.y + 3,
            z: isl.cz + Math.sin(angle) * isl.rz * dist,
        };
    }

    // Create a bird state object
    function createBirdState(islIdx) {
        const pos = randomIslandPos(islIdx);
        return {
            // State: 'wander' | 'bridge'
            mode: 'wander',
            currentIsland: islIdx,
            // Wander state
            wanderTarget: pos,
            wanderPos: { x: pos.x + (Math.random() - 0.5) * 3, y: pos.y, z: pos.z + (Math.random() - 0.5) * 3 },
            wanderTimer: 2 + Math.random() * 4, // time until next action
            wanderMoving: false,
            wanderProgress: 0,
            wanderFrom: { ...pos },
            // Bridge state
            bridgeIdx: 0,
            waypoints: null,
            currentWp: 0,
            direction: 1,
            hopProgress: 0,
            hopping: false,
            resting: true,
            restTimer: Math.random() * 2,
            // Shared
            phase: Math.random() * Math.PI * 2,
            pecking: false,
            peckTimer: 0,
        };
    }

    // Spawn chickens on random islands
    for (let c = 0; c < CHICKEN_COUNT; c++) {
        const model = buildChicken(c);
        scene.add(model);
        const islIdx = Math.floor(Math.random() * islands.length);
        const state = createBirdState(islIdx);
        chickens.push({ model, ...state });
    }

    // Start a bird crossing a bridge from its current island
    function startBridgeCrossing(bird) {
        const available = bridgesForIsland(bird.currentIsland);
        if (available.length === 0) return; // shouldn't happen
        const bIdx = available[Math.floor(Math.random() * available.length)];
        const bridge = bridges[bIdx];
        const pair = bridgePairs[bIdx];

        bird.mode = 'bridge';
        bird.bridgeIdx = bIdx;
        bird.waypoints = bridge.waypoints;

        // Determine direction: if current island is pair[0], go forward; else backward
        if (pair[0] === bird.currentIsland) {
            bird.direction = 1;
            bird.currentWp = 0;
            bird.currentIsland = pair[1]; // will arrive at this island
        } else {
            bird.direction = -1;
            bird.currentWp = bridge.waypoints.length - 2;
            bird.currentIsland = pair[0];
        }
        bird.hopping = false;
        bird.resting = true;
        bird.restTimer = 0.3;
    }

    // Transition from bridge arrival to island wandering
    function startWandering(bird) {
        bird.mode = 'wander';
        bird.wanderPos = { x: bird.model.position.x, y: islands[bird.currentIsland].y + 3, z: bird.model.position.z };
        bird.wanderTarget = randomIslandPos(bird.currentIsland);
        bird.wanderTimer = 3 + Math.random() * 5;
        bird.wanderMoving = false;
        bird.pecking = false;
    }

    // Spawn chicks
    const MAX_CHICKS = 900;
    const chicks = [];
    let activeChickCount = 3;

    function spawnChick() {
        const model = buildChick();
        scene.add(model);
        const islIdx = Math.floor(Math.random() * islands.length);
        const state = createBirdState(islIdx);
        return { model, ...state };
    }

    for (let c = 0; c < activeChickCount; c++) {
        chicks.push(spawnChick());
    }

    function setChickCount(count) {
        const target = Math.max(3, Math.min(MAX_CHICKS, Math.floor(count)));
        while (chicks.length < target) {
            chicks.push(spawnChick());
        }
        for (let i = 0; i < chicks.length; i++) {
            chicks[i].model.visible = i < target;
        }
        activeChickCount = target;
    }

    function updateAnimals(dt, t) {
        for (const chicken of chickens) {
            updateBird(chicken, dt, t, 1.3, 1.2);
        }
        for (let i = 0; i < activeChickCount && i < chicks.length; i++) {
            updateBird(chicks[i], dt, t, 0.9, 0.8);
        }
    }

    function updateBird(bird, dt, t, baseScale, hopHeight) {
        if (bird.mode === 'wander') {
            updateWander(bird, dt, t, baseScale, hopHeight);
        } else {
            updateBridge(bird, dt, t, baseScale, hopHeight);
        }
        // Shared animations
        animateBird(bird, dt, t, baseScale, hopHeight);
    }

    function updateWander(bird, dt, t, baseScale, hopHeight) {
        bird.wanderTimer -= dt;

        // Pecking while idle
        if (!bird.wanderMoving && !bird.pecking && Math.random() < 0.02) {
            bird.pecking = true;
            bird.peckTimer = 0.3 + Math.random() * 0.4;
        }
        if (bird.pecking) {
            bird.peckTimer -= dt;
            if (bird.peckTimer <= 0) bird.pecking = false;
        }

        // When timer expires, decide: wander to new spot or cross a bridge
        if (bird.wanderTimer <= 0) {
            if (Math.random() < 0.2) {
                // 20% chance to decide to cross a bridge
                startBridgeCrossing(bird);
                return;
            } else {
                // Pick new wander target on same island
                bird.wanderFrom = { ...bird.wanderPos };
                bird.wanderTarget = randomIslandPos(bird.currentIsland);
                bird.wanderMoving = true;
                bird.wanderProgress = 0;
                bird.wanderTimer = 3 + Math.random() * 5;
                bird.pecking = false;
            }
        }

        // Move toward target
        if (bird.wanderMoving) {
            bird.wanderProgress += dt * 0.6;
            if (bird.wanderProgress >= 1) {
                bird.wanderProgress = 1;
                bird.wanderMoving = false;
                bird.wanderPos = { ...bird.wanderTarget };
            }
            const ease = bird.wanderProgress;
            bird.model.position.x = THREE.MathUtils.lerp(bird.wanderFrom.x, bird.wanderTarget.x, ease);
            bird.model.position.z = THREE.MathUtils.lerp(bird.wanderFrom.z, bird.wanderTarget.z, ease);
            bird.model.position.y = bird.wanderTarget.y + Math.sin(bird.wanderProgress * Math.PI * 4) * 0.3; // little hop steps

            // Face movement direction
            const dx = bird.wanderTarget.x - bird.wanderFrom.x;
            const dz = bird.wanderTarget.z - bird.wanderFrom.z;
            if (Math.abs(dx) + Math.abs(dz) > 0.1) {
                bird.model.rotation.y = Math.atan2(dx, dz);
            }
        } else {
            // Idle on spot
            bird.model.position.set(bird.wanderPos.x, bird.wanderPos.y, bird.wanderPos.z);
            const bob = Math.sin(t * 6 + bird.phase) * 0.01;
            bird.model.position.y += bob;
        }

        // Mark not hopping for animation
        bird.hopping = false;
        bird.hopProgress = 0;
    }

    function updateBridge(bird, dt, t, baseScale, hopHeight) {
        const wps = bird.waypoints;

        if (bird.resting) {
            bird.restTimer -= dt;
            if (bird.restTimer <= 0) {
                bird.resting = false;
                bird.hopping = true;
                bird.hopProgress = 0;
            }
        } else if (bird.hopping) {
            bird.hopProgress += dt * (2.8 + Math.sin(bird.phase) * 0.6);
            if (bird.hopProgress >= 1) {
                bird.hopProgress = 1;
                bird.hopping = false;
                bird.currentWp += bird.direction;
                // Reached end of bridge?
                if (bird.currentWp >= wps.length - 1 || bird.currentWp <= 0) {
                    bird.currentWp = Math.max(0, Math.min(wps.length - 2, bird.currentWp));
                    // Arrived at island — start wandering
                    startWandering(bird);
                    return;
                } else {
                    bird.resting = true;
                    bird.restTimer = 0.1 + Math.random() * 0.2;
                    if (Math.random() < 0.06) {
                        bird.restTimer = 0.6 + Math.random() * 1.0;
                    }
                }
            }
        }

        // Position on bridge
        if (bird.mode !== 'bridge') return; // might have switched to wander
        const fromWp = wps[bird.currentWp];
        const nextIdx = bird.direction > 0
            ? Math.min(wps.length - 1, bird.currentWp + 1)
            : Math.max(0, bird.currentWp - 1);
        const toWp = wps[nextIdx];

        const p = bird.hopping ? bird.hopProgress : 0;
        const ease = 1 - Math.pow(1 - p, 2.5);

        const px = THREE.MathUtils.lerp(fromWp.x, toWp.x, ease);
        const pz = THREE.MathUtils.lerp(fromWp.z, toWp.z, ease);
        const baseY = THREE.MathUtils.lerp(fromWp.y, toWp.y, ease);
        const hopArc = bird.hopping ? Math.sin(p * Math.PI) * hopHeight : 0;

        bird.model.position.set(px, baseY + hopArc, pz);

        // Face direction
        const dx = toWp.x - fromWp.x;
        const dz = toWp.z - fromWp.z;
        if (Math.abs(dx) + Math.abs(dz) > 0.1) {
            bird.model.rotation.y = Math.atan2(dx, dz);
        }

        // Body bob when resting on bridge
        if (!bird.hopping) {
            bird.model.position.y += Math.sin(t * 6 + bird.phase) * 0.01;
        }
    }

    function animateBird(bird, dt, t, baseScale, hopHeight) {
        const isMoving = bird.wanderMoving || bird.hopping;
        const p = bird.hopProgress || 0;

        // Wing flap
        if (bird.hopping) {
            const flap = Math.sin(p * Math.PI * 3) * 0.4;
            bird.model.userData.wingL.rotation.z = 0.2 - flap;
            bird.model.userData.wingR.rotation.z = -0.2 + flap;
        } else if (bird.wanderMoving) {
            const walkFlap = Math.sin(t * 8 + bird.phase) * 0.08;
            bird.model.userData.wingL.rotation.z = 0.2 - walkFlap;
            bird.model.userData.wingR.rotation.z = -0.2 + walkFlap;
        } else {
            bird.model.userData.wingL.rotation.z = 0.2 + Math.sin(t * 2 + bird.phase) * 0.03;
            bird.model.userData.wingR.rotation.z = -0.2 - Math.sin(t * 2 + bird.phase) * 0.03;
        }

        // Head
        if (bird.pecking) {
            bird.model.userData.head.rotation.x = Math.sin(t * 15) * 0.4;
            bird.model.userData.head.rotation.y *= 0.9;
        } else if (!isMoving) {
            bird.model.userData.head.rotation.x = Math.sin(t * 4 + bird.phase) * 0.08;
            bird.model.userData.head.rotation.y = Math.sin(t * 1.8 + bird.phase) * 0.3;
        } else {
            bird.model.userData.head.rotation.x *= 0.85;
            bird.model.userData.head.rotation.y *= 0.85;
        }

        // Legs
        if (bird.hopping) {
            const tuck = Math.sin(p * Math.PI) * 0.3;
            bird.model.userData.legL.rotation.x = tuck;
            bird.model.userData.legR.rotation.x = -tuck * 0.7;
        } else if (bird.wanderMoving) {
            const stride = Math.sin(t * 10 + bird.phase) * 0.25;
            bird.model.userData.legL.rotation.x = stride;
            bird.model.userData.legR.rotation.x = -stride;
        } else {
            bird.model.userData.legL.rotation.x *= 0.8;
            bird.model.userData.legR.rotation.x *= 0.8;
        }

        // Comb jiggle (chickens only)
        if (bird.model.userData.comb) {
            bird.model.userData.comb.rotation.z = Math.sin(t * 5 + bird.phase) * 0.05;
        }

        // Squash & stretch
        if (bird.hopping) {
            const stretch = Math.sin(p * Math.PI);
            bird.model.scale.set(
                baseScale * (1 - stretch * 0.08),
                baseScale * (1 + stretch * 0.12),
                baseScale * (1 - stretch * 0.04)
            );
        } else {
            const breath = Math.sin(t * 2.5 + bird.phase) * 0.01;
            bird.model.scale.set(baseScale, baseScale + breath, baseScale);
        }
    }

    return { updateAnimals, setChickCount };
}
