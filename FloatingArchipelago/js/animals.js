import * as THREE from '../vendor/three.module.js';

// ---------------------------------------------------------------------------
//  ANIMALS — Small bunnies hopping between islands via crystal bridges.
//  They pick a random bridge, hop along it step-by-step, rest on the
//  destination island, then pick another bridge to cross.
// ---------------------------------------------------------------------------

function fur(color, roughness = 0.92) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function buildBunny() {
    const root = new THREE.Group();
    const bodyCol = 0xE8E0D8;
    const innerEarCol = 0xFFADB5;
    const eyeCol = 0x1A1010;
    const noseCol = 0x5C3A28;

    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), fur(bodyCol));
    body.scale.set(0.28, 0.3, 0.45);
    body.position.set(0, 0.3, 0);
    body.castShadow = true;
    root.add(body);

    const head = new THREE.Group();
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), fur(bodyCol));
    skull.scale.set(0.22, 0.23, 0.22);
    head.add(skull);

    [-1, 1].forEach(side => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), fur(eyeCol, 0.2));
        eye.position.set(side * 0.1, 0.04, 0.17);
        head.add(eye);
        const shine = new THREE.Mesh(new THREE.SphereGeometry(0.015, 5, 5),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 0.5, roughness: 0.1 }));
        shine.position.set(side * 0.08, 0.06, 0.19);
        head.add(shine);
    });

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), fur(noseCol, 0.5));
    nose.position.set(0, -0.02, 0.21);
    head.add(nose);

    const earGeo = new THREE.CapsuleGeometry(0.04, 0.35, 4, 8);
    const earInnerGeo = new THREE.CapsuleGeometry(0.025, 0.28, 3, 6);

    const earL = new THREE.Group();
    earL.add(new THREE.Mesh(earGeo, fur(bodyCol)));
    earL.add(new THREE.Mesh(earInnerGeo, fur(innerEarCol, 0.85)));
    earL.children[1].position.z = 0.015;
    earL.position.set(-0.07, 0.3, -0.02);
    earL.rotation.set(-0.1, 0, 0.1);
    head.add(earL);
    root.userData.earL = earL;

    const earR = new THREE.Group();
    earR.add(new THREE.Mesh(earGeo, fur(bodyCol)));
    earR.add(new THREE.Mesh(earInnerGeo, fur(innerEarCol, 0.85)));
    earR.children[1].position.z = 0.015;
    earR.position.set(0.07, 0.3, -0.02);
    earR.rotation.set(-0.1, 0, -0.1);
    head.add(earR);
    root.userData.earR = earR;

    head.position.set(0, 0.58, 0.18);
    root.add(head);
    root.userData.head = head;

    const legGeo = new THREE.CapsuleGeometry(0.035, 0.12, 3, 5);
    const legMat = fur(bodyCol);
    const legFL = new THREE.Mesh(legGeo, legMat); legFL.position.set(-0.1, 0.07, 0.15); root.add(legFL); root.userData.legFL = legFL;
    const legFR = new THREE.Mesh(legGeo, legMat); legFR.position.set(0.1, 0.07, 0.15); root.add(legFR); root.userData.legFR = legFR;
    const backLegGeo = new THREE.CapsuleGeometry(0.045, 0.14, 3, 5);
    const legBL = new THREE.Mesh(backLegGeo, legMat); legBL.position.set(-0.12, 0.07, -0.15); root.add(legBL); root.userData.legBL = legBL;
    const legBR = new THREE.Mesh(backLegGeo, legMat); legBR.position.set(0.12, 0.07, -0.15); root.add(legBR); root.userData.legBR = legBR;

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 7), fur(0xFFFFFF));
    tail.position.set(0, 0.28, -0.32);
    root.add(tail);
    root.userData.tail = tail;

    root.scale.setScalar(1.3);
    return root;
}

// ============================================================================
//  Compute bridge waypoints (matching the scene-builder bridge arc logic)
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

    // Sample waypoints every ~3 units along the bridge
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
    const BUNNY_COUNT = 4;
    const bunnies = [];

    // Pre-compute all bridge waypoint paths (both directions)
    const bridges = [];
    for (let i = 0; i < 4; i++) {
        const fwd = computeBridgeWaypoints(islands, i);
        bridges.push(fwd);
    }

    for (let b = 0; b < BUNNY_COUNT; b++) {
        const model = buildBunny();
        scene.add(model);

        // Start each bunny on a random bridge at a random position
        const bridgeIdx = b % bridges.length;
        const startWp = Math.floor(Math.random() * 3);

        bunnies.push({
            model,
            // Current path state
            bridgeIdx,
            waypoints: bridges[bridgeIdx].waypoints,
            currentWp: startWp,
            direction: 1, // 1 = forward (to island), -1 = backward (to central)
            // Hop state
            hopProgress: 0, // 0..1 between current waypoint and next
            hopping: false,
            // Rest state
            resting: true,
            restTimer: 1 + b * 0.7,
            // Island rest (longer pause when reaching an island end)
            onIsland: false,
            islandRestTimer: 0,
            // Anim
            phase: b * 1.7,
        });
    }

    function pickNewBridge(bunny) {
        // Pick a random different bridge
        let newIdx;
        do {
            newIdx = Math.floor(Math.random() * bridges.length);
        } while (newIdx === bunny.bridgeIdx && Math.random() > 0.3);
        bunny.bridgeIdx = newIdx;
        bunny.waypoints = bridges[newIdx].waypoints;
        // Start from beginning or end depending on direction
        bunny.direction = Math.random() < 0.5 ? 1 : -1;
        bunny.currentWp = bunny.direction === 1 ? 0 : bunny.waypoints.length - 2;
    }

    function updateAnimals(dt, t) {
        for (const bunny of bunnies) {
            const wps = bunny.waypoints;

            // Resting on island (longer pause at endpoints)
            if (bunny.onIsland) {
                bunny.islandRestTimer -= dt;
                if (bunny.islandRestTimer <= 0) {
                    bunny.onIsland = false;
                    // Pick a new bridge to cross
                    pickNewBridge(bunny);
                    bunny.resting = true;
                    bunny.restTimer = 0.3;
                }
            }
            // Short rest between hops
            else if (bunny.resting) {
                bunny.restTimer -= dt;
                if (bunny.restTimer <= 0) {
                    bunny.resting = false;
                    bunny.hopping = true;
                    bunny.hopProgress = 0;
                }
            }
            // Hopping to next waypoint
            else if (bunny.hopping) {
                bunny.hopProgress += dt * 2.8;
                if (bunny.hopProgress >= 1) {
                    bunny.hopProgress = 1;
                    bunny.hopping = false;
                    // Advance waypoint
                    bunny.currentWp += bunny.direction;
                    // Check if reached end of bridge
                    if (bunny.currentWp >= wps.length - 1 || bunny.currentWp <= 0) {
                        bunny.currentWp = Math.max(0, Math.min(wps.length - 2, bunny.currentWp));
                        bunny.onIsland = true;
                        bunny.islandRestTimer = 2 + Math.random() * 3;
                    } else {
                        // Short rest before next hop
                        bunny.resting = true;
                        bunny.restTimer = 0.15 + Math.random() * 0.25;
                    }
                }
            }

            // Compute current position
            const fromWp = wps[bunny.currentWp];
            const toIdx = Math.min(wps.length - 1, bunny.currentWp + (bunny.direction > 0 ? 1 : 0));
            const nextIdx = bunny.direction > 0 ? Math.min(wps.length - 1, bunny.currentWp + 1) : Math.max(0, bunny.currentWp - 1);
            const toWp = wps[nextIdx];

            const p = bunny.hopping ? bunny.hopProgress : 0;
            const ease = 1 - Math.pow(1 - p, 2.5); // ease-out for snappy landing

            const px = THREE.MathUtils.lerp(fromWp.x, toWp.x, ease);
            const pz = THREE.MathUtils.lerp(fromWp.z, toWp.z, ease);
            const baseY = THREE.MathUtils.lerp(fromWp.y, toWp.y, ease);
            const hopArc = bunny.hopping ? Math.sin(p * Math.PI) * 1.4 : 0;

            bunny.model.position.set(px, baseY + hopArc, pz);

            // Face direction of travel
            const dx = toWp.x - fromWp.x;
            const dz = toWp.z - fromWp.z;
            if (Math.abs(dx) + Math.abs(dz) > 0.1) {
                bunny.model.rotation.y = Math.atan2(dx, dz);
            }

            // Squash & stretch
            if (bunny.hopping) {
                const stretch = Math.sin(p * Math.PI);
                bunny.model.scale.set(
                    1.3 * (1 - stretch * 0.1),
                    1.3 * (1 + stretch * 0.15),
                    1.3 * (1 - stretch * 0.05)
                );
            } else {
                const breath = Math.sin(t * 2.5 + bunny.phase) * 0.012;
                bunny.model.scale.set(1.3, 1.3 + breath, 1.3);
            }

            // Ears
            const earBounce = bunny.hopping ? Math.sin(p * Math.PI) * 0.18 : 0;
            const earIdle = Math.sin(t * 3 + bunny.phase) * 0.08;
            bunny.model.userData.earL.rotation.x = -0.1 + earIdle + earBounce;
            bunny.model.userData.earR.rotation.x = -0.1 - earIdle * 0.6 + earBounce;

            // Head look-around when resting or on island
            if (bunny.resting || bunny.onIsland) {
                bunny.model.userData.head.rotation.y = Math.sin(t * 1.6 + bunny.phase) * 0.3;
                bunny.model.userData.head.rotation.z = Math.sin(t * 2.2 + bunny.phase) * 0.06;
            } else {
                bunny.model.userData.head.rotation.y *= 0.85;
                bunny.model.userData.head.rotation.z *= 0.85;
            }

            // Legs
            if (bunny.hopping) {
                const tuck = Math.sin(p * Math.PI) * 0.5;
                bunny.model.userData.legFL.rotation.x = -tuck;
                bunny.model.userData.legFR.rotation.x = -tuck;
                bunny.model.userData.legBL.rotation.x = tuck * 0.8;
                bunny.model.userData.legBR.rotation.x = tuck * 0.8;
            } else {
                ['legFL', 'legFR', 'legBL', 'legBR'].forEach(k => {
                    bunny.model.userData[k].rotation.x *= 0.8;
                });
            }

            // Tail
            bunny.model.userData.tail.position.x = Math.sin(t * 5 + bunny.phase) * 0.015;
        }
    }

    return { updateAnimals };
}
