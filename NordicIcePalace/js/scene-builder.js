import * as THREE from '../vendor/three.module.js';
import { PAL, pick } from './palette.js';

// ---------------------------------------------------------------------------
//  SCENE BUILDER — constructs the Nordic Ice Palace static geometry:
//  terrain, frozen lake, palace, sculptures, vegetation, frost overlays.
// ---------------------------------------------------------------------------

const TERRAIN = {
    radius: 35,
    lakeInnerRadius: 8,
    lakeOuterOffset: 4,
    treeCount: [8, 15],
    rockCount: [10, 20],
    minSpacing: 3,
    taperRate: 0.5,
};

// ---------------------------------------------------------------------------
//  buildTerrain — floating island with snow surface and rock strata
//  Circular island radius 35 centered at Y=0, tapered underside.
// ---------------------------------------------------------------------------
export function buildTerrain(world) {
    const radius = TERRAIN.radius;
    const taperRate = 0.7; // reduce radius per layer downward (≥0.5 per req)
    const strataDepth = 5; // layers of rock beneath surface (3–6 range)

    // Surface layer (Y=0) — snow
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            if (x * x + z * z <= radius * radius) {
                world.add(x, 0, z, pick(PAL.snow), { rough: 0.9, jitter: 0.05 });
            }
        }
    }

    // Rock strata beneath surface (Y=-1 to Y=-strataDepth) with taper
    for (let layer = 1; layer <= strataDepth; layer++) {
        const layerRadius = radius - layer * taperRate;
        if (layerRadius <= 0) break;
        for (let x = -Math.ceil(layerRadius); x <= Math.ceil(layerRadius); x++) {
            for (let z = -Math.ceil(layerRadius); z <= Math.ceil(layerRadius); z++) {
                if (x * x + z * z <= layerRadius * layerRadius) {
                    world.add(x, -layer, z, pick(PAL.rock), { rough: 0.95 });
                }
            }
        }
    }

    // Tapered underside — continue narrowing below strata until pointed tip
    let currentRadius = radius - strataDepth * taperRate;
    let y = -(strataDepth + 1);
    while (currentRadius > 0.5) {
        currentRadius -= taperRate;
        if (currentRadius <= 0) break;
        for (let x = -Math.ceil(currentRadius); x <= Math.ceil(currentRadius); x++) {
            for (let z = -Math.ceil(currentRadius); z <= Math.ceil(currentRadius); z++) {
                if (x * x + z * z <= currentRadius * currentRadius) {
                    world.add(x, y, z, pick(PAL.rock), { rough: 0.95 });
                }
            }
        }
        y--;
    }
    // Final pointed tip
    world.add(0, y, 0, pick(PAL.rock), { rough: 0.95 });
}

// ---------------------------------------------------------------------------
//  buildFrozenLake — translucent ice ring at Y=-1
//  Ring from inner radius 8 to outer radius (TERRAIN.radius - 4).
//  Surface layer uses lighter blue-white voxels; 2 layers beneath are
//  progressively darker to simulate translucent depth.
// ---------------------------------------------------------------------------
export function buildFrozenLake(world) {
    const innerR = TERRAIN.lakeInnerRadius;
    const outerR = TERRAIN.radius - TERRAIN.lakeOuterOffset;

    // Surface layer colors (lightest — simulates translucency / opacity ≤ 0.6)
    const surfaceColors = ['#5a9ec7', '#6aaed7', '#7abee7'];
    // Layer 2 — mid-depth (darker)
    const midColors = ['#3a7ca3', '#4a8eb5'];
    // Layer 3 — deepest (darkest)
    const deepColors = ['#2d6a8f', '#1d5a7f'];

    const lakeOpts = { rough: 0.1, metal: 0.1 };

    for (let x = -outerR; x <= outerR; x++) {
        for (let z = -outerR; z <= outerR; z++) {
            const dist = Math.sqrt(x * x + z * z);

            // Only place voxels within the ring (inner to outer radius)
            if (dist < innerR || dist > outerR) continue;

            // Surface layer at Y = -1
            const surfColor = surfaceColors[(Math.abs(x * 7 + z * 13)) % surfaceColors.length];
            world.add(x, -1, z, surfColor, lakeOpts);

            // Layer 2 at Y = -2 (progressively darker)
            const midColor = midColors[(Math.abs(x * 11 + z * 3)) % midColors.length];
            world.add(x, -2, z, midColor, lakeOpts);

            // Layer 3 at Y = -3 (darkest)
            const deepColor = deepColors[(Math.abs(x * 5 + z * 17)) % deepColors.length];
            world.add(x, -3, z, deepColor, lakeOpts);
        }
    }
}

// ---------------------------------------------------------------------------
//  PALACE GEOMETRY CONSTANTS
// ---------------------------------------------------------------------------
const PALACE = {
    hallWidth: 14,
    hallDepth: 14,
    wallHeight: 12,
    spireCount: 4,
    spireHeight: 14,   // above hall roof
    bridgeCount: 2,
    platformHeight: 3, // raised above lake
    stairCount: 2,
};

// ---------------------------------------------------------------------------
//  buildPalace — elaborate ice palace with:
//  - Raised platform with decorative border
//  - Great hall with arched windows and pillar columns
//  - Crenellated roof parapet
//  - Central dome above the hall
//  - Four tapered spires with tiered rings
//  - Flying buttresses
//  - Arced ice bridges with full railings
//  - Grand entrance stairways with flanking pillars
// ---------------------------------------------------------------------------
export function buildPalace(world) {
    const placed = new Set();
    const wallOpts = { rough: 0.2, emissive: '#88ccff', emissiveI: 0.15 };
    const glowOpts = { rough: 0.1, emissive: '#aaeeff', emissiveI: 0.35 };
    const crystalOpts = { rough: 0.05, emissive: '#66eeff', emissiveI: 0.5 };
    const darkIceOpts = { rough: 0.3, emissive: '#446688', emissiveI: 0.1 };

    function placeVoxel(x, y, z, color, opts) {
        const key = `${x},${y},${z}`;
        if (placed.has(key)) return;
        placed.add(key);
        world.add(x, y, z, color, opts);
    }

    // --- Platform with decorative border ---
    const platHalfW = Math.floor(PALACE.hallWidth / 2) + 3;
    const platHalfD = Math.floor(PALACE.hallDepth / 2) + 3;
    for (let y = -1; y <= 1; y++) {
        for (let x = -platHalfW; x <= platHalfW; x++) {
            for (let z = -platHalfD; z <= platHalfD; z++) {
                const isEdge = Math.abs(x) === platHalfW || Math.abs(z) === platHalfD;
                const color = isEdge ? pick(PAL.ice) : pick(PAL.platform);
                const opts = isEdge ? glowOpts : { rough: 0.5 };
                placeVoxel(x, y, z, color, opts);
            }
        }
    }

    // Platform border posts (every 4 voxels along edge)
    for (let x = -platHalfW; x <= platHalfW; x += 4) {
        placeVoxel(x, 2, -platHalfD, pick(PAL.ice), glowOpts);
        placeVoxel(x, 3, -platHalfD, pick(PAL.spireGlow), crystalOpts);
        placeVoxel(x, 2, platHalfD, pick(PAL.ice), glowOpts);
        placeVoxel(x, 3, platHalfD, pick(PAL.spireGlow), crystalOpts);
    }
    for (let z = -platHalfD; z <= platHalfD; z += 4) {
        placeVoxel(-platHalfW, 2, z, pick(PAL.ice), glowOpts);
        placeVoxel(-platHalfW, 3, z, pick(PAL.spireGlow), crystalOpts);
        placeVoxel(platHalfW, 2, z, pick(PAL.ice), glowOpts);
        placeVoxel(platHalfW, 3, z, pick(PAL.spireGlow), crystalOpts);
    }

    // --- Great Hall ---
    const hallX0 = -Math.floor(PALACE.hallWidth / 2);
    const hallZ0 = -Math.floor(PALACE.hallDepth / 2);
    const hallY0 = 2;
    const hallW = PALACE.hallWidth;
    const hallD = PALACE.hallDepth;
    const wallH = PALACE.wallHeight;

    // Floor with checkered pattern
    for (let x = 0; x < hallW; x++) {
        for (let z = 0; z < hallD; z++) {
            const checker = (x + z) % 2 === 0;
            const color = checker ? pick(PAL.ice) : pick(['#d0f0ff', '#c8e8f8']);
            placeVoxel(hallX0 + x, hallY0, hallZ0 + z, color, { rough: 0.15 });
        }
    }

    // Walls with arched windows
    for (let y = 1; y <= wallH; y++) {
        for (let x = 0; x < hallW; x++) {
            for (let z = 0; z < hallD; z++) {
                const onNorth = z === 0;
                const onSouth = z === hallD - 1;
                const onWest = x === 0;
                const onEast = x === hallW - 1;
                if (!(onNorth || onSouth || onWest || onEast)) continue;

                // Arched window cutouts on walls (not corners)
                let isWindow = false;
                if (onNorth || onSouth) {
                    const wx = x % 4;
                    if (x > 1 && x < hallW - 2 && wx >= 1 && wx <= 2 && y >= 4 && y <= 9) {
                        isWindow = true;
                        // Arch top
                        if (y === 9 && wx === 1) isWindow = true;
                        if (y === 9 && wx === 2) isWindow = true;
                        if (y === 10 && (wx === 1 || wx === 2)) isWindow = false;
                    }
                }
                if (onWest || onEast) {
                    const wz = z % 4;
                    if (z > 1 && z < hallD - 2 && wz >= 1 && wz <= 2 && y >= 4 && y <= 9) {
                        isWindow = true;
                    }
                }

                if (!isWindow) {
                    // Corner pillars get a different color
                    const isCorner = (onNorth || onSouth) && (onWest || onEast);
                    const color = isCorner ? pick(['#e8ffff', '#ffffff']) : pick(PAL.ice);
                    const opts = isCorner ? glowOpts : wallOpts;
                    placeVoxel(hallX0 + x, hallY0 + y, hallZ0 + z, color, opts);
                }
            }
        }
    }

    // --- Interior Pillars (4 columns inside the hall) ---
    const pillarPositions = [
        { x: hallX0 + 3, z: hallZ0 + 3 },
        { x: hallX0 + hallW - 4, z: hallZ0 + 3 },
        { x: hallX0 + 3, z: hallZ0 + hallD - 4 },
        { x: hallX0 + hallW - 4, z: hallZ0 + hallD - 4 },
    ];

    pillarPositions.forEach(({ x, z }) => {
        for (let y = 1; y <= wallH; y++) {
            placeVoxel(x, hallY0 + y, z, pick(['#e0ffff', '#ffffff']), glowOpts);
        }
        // Pillar capital (wider at top)
        placeVoxel(x - 1, hallY0 + wallH, z, pick(PAL.ice), wallOpts);
        placeVoxel(x + 1, hallY0 + wallH, z, pick(PAL.ice), wallOpts);
        placeVoxel(x, hallY0 + wallH, z - 1, pick(PAL.ice), wallOpts);
        placeVoxel(x, hallY0 + wallH, z + 1, pick(PAL.ice), wallOpts);
    });

    // --- Roof slab ---
    const roofY = hallY0 + wallH + 1;
    for (let x = 0; x < hallW; x++) {
        for (let z = 0; z < hallD; z++) {
            placeVoxel(hallX0 + x, roofY, hallZ0 + z, pick(PAL.ice), wallOpts);
        }
    }

    // --- Crenellated Parapet ---
    for (let x = 0; x < hallW; x++) {
        for (let z = 0; z < hallD; z++) {
            const onEdge = x === 0 || x === hallW - 1 || z === 0 || z === hallD - 1;
            if (!onEdge) continue;
            // Merlon pattern: 2 up, 1 gap
            const pos = x === 0 || x === hallW - 1 ? z : x;
            if (pos % 3 !== 2) {
                placeVoxel(hallX0 + x, roofY + 1, hallZ0 + z, pick(PAL.ice), wallOpts);
            }
        }
    }

    // --- Central Dome (hemisphere above the roof center) ---
    const domeRadius = 4;
    const domeCenterY = roofY + 1;
    for (let dx = -domeRadius; dx <= domeRadius; dx++) {
        for (let dz = -domeRadius; dz <= domeRadius; dz++) {
            for (let dy = 0; dy <= domeRadius; dy++) {
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist <= domeRadius && dist >= domeRadius - 1.2) {
                    placeVoxel(dx, domeCenterY + dy, dz, pick(PAL.ice), glowOpts);
                }
            }
        }
    }
    // Dome finial crystal
    for (let y = 0; y < 3; y++) {
        placeVoxel(0, domeCenterY + domeRadius + y, 0, pick(PAL.spireGlow), crystalOpts);
    }

    // --- Spires at corners (tapered with tiered rings) ---
    const spirePositions = [
        { x: hallX0, z: hallZ0 },
        { x: hallX0 + hallW - 1, z: hallZ0 },
        { x: hallX0, z: hallZ0 + hallD - 1 },
        { x: hallX0 + hallW - 1, z: hallZ0 + hallD - 1 },
    ];

    const spireBaseY = roofY + 1;

    spirePositions.forEach((sp) => {
        // Main spire column (2x2)
        for (let y = 0; y < PALACE.spireHeight; y++) {
            for (let dx = -1; dx <= 0; dx++) {
                for (let dz = -1; dz <= 0; dz++) {
                    placeVoxel(sp.x + dx, spireBaseY + y, sp.z + dz, pick(PAL.ice), wallOpts);
                }
            }
        }

        // Tiered rings at 1/3 and 2/3 height
        const ringHeights = [Math.floor(PALACE.spireHeight / 3), Math.floor(2 * PALACE.spireHeight / 3)];
        ringHeights.forEach(h => {
            for (let dx = -2; dx <= 1; dx++) {
                for (let dz = -2; dz <= 1; dz++) {
                    const isOuter = Math.abs(dx) === 2 || Math.abs(dz) === 2 || dx === 1 || dz === 1;
                    if (isOuter) {
                        placeVoxel(sp.x + dx, spireBaseY + h, sp.z + dz, pick(PAL.ice), glowOpts);
                    }
                }
            }
        });

        // Tapered top (1x1 narrowing)
        for (let y = 0; y < 5; y++) {
            placeVoxel(sp.x, spireBaseY + PALACE.spireHeight + y, sp.z, pick(PAL.ice), glowOpts);
        }

        // Spire crystal tip
        for (let y = 0; y < 3; y++) {
            placeVoxel(sp.x, spireBaseY + PALACE.spireHeight + 5 + y, sp.z, pick(PAL.spireGlow), crystalOpts);
        }
    });

    // --- Flying Buttresses (arced, not just straight lines) ---
    const buttressTargets = [
        { spire: spirePositions[0], wallMid: { x: hallX0 + Math.floor(hallW / 2), z: hallZ0 } },
        { spire: spirePositions[1], wallMid: { x: hallX0 + Math.floor(hallW / 2), z: hallZ0 } },
        { spire: spirePositions[2], wallMid: { x: hallX0 + Math.floor(hallW / 2), z: hallZ0 + hallD - 1 } },
        { spire: spirePositions[3], wallMid: { x: hallX0 + Math.floor(hallW / 2), z: hallZ0 + hallD - 1 } },
    ];

    buttressTargets.forEach(({ spire, wallMid }) => {
        const startY = roofY - 1;
        const endY = hallY0 + Math.floor(wallH / 2);
        const steps = startY - endY;

        for (let i = 0; i <= steps; i++) {
            const t = steps > 0 ? i / steps : 0;
            const bx = Math.round(spire.x + (wallMid.x - spire.x) * t);
            const bz = Math.round(spire.z + (wallMid.z - spire.z) * t);
            // Parabolic arc: slight upward bow
            const arc = Math.sin(t * Math.PI) * 2;
            const by = Math.round(startY - i + arc);
            placeVoxel(bx, by, bz, pick(PAL.ice), wallOpts);
            // Thicken the buttress
            placeVoxel(bx, by - 1, bz, pick(PAL.ice), darkIceOpts);
        }
    });

    // --- Ice Bridges with full railings and arc ---
    const bridgePairs = [
        [spirePositions[0], spirePositions[1]],
        [spirePositions[2], spirePositions[3]],
    ];

    const bridgeY = roofY + 3;
    const bridgeOpts = { rough: 0.15, emissive: '#88ccff', emissiveI: 0.2 };

    bridgePairs.forEach(([from, to]) => {
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        const dist = Math.max(Math.abs(dx), Math.abs(dz));

        for (let i = 0; i <= dist; i++) {
            const t = dist > 0 ? i / dist : 0;
            const bx = Math.round(from.x + dx * t);
            const bz = Math.round(from.z + dz * t);
            // Slight arc
            const arc = Math.round(Math.sin(t * Math.PI) * 1.5);

            // Bridge deck (3 voxels wide for grander look)
            const offsetDir = dz === 0 ? 'z' : 'x';
            for (let w = -1; w <= 1; w++) {
                const wx = offsetDir === 'z' ? bx : bx + w;
                const wz = offsetDir === 'z' ? bz + w : bz;
                placeVoxel(wx, bridgeY + arc, wz, pick(PAL.ice), bridgeOpts);
            }

            // Railings on both sides
            const r1 = offsetDir === 'z' ? bz - 2 : bx - 2;
            const r2 = offsetDir === 'z' ? bz + 2 : bx + 2;
            if (offsetDir === 'z') {
                placeVoxel(bx, bridgeY + arc + 1, bz - 2, pick(PAL.ice), bridgeOpts);
                placeVoxel(bx, bridgeY + arc + 1, bz + 2, pick(PAL.ice), bridgeOpts);
            } else {
                placeVoxel(bx - 2, bridgeY + arc + 1, bz, pick(PAL.ice), bridgeOpts);
                placeVoxel(bx + 2, bridgeY + arc + 1, bz, pick(PAL.ice), bridgeOpts);
            }
        }
    });

    // --- Grand Entrance Stairways with flanking pillars ---
    const stairDirections = [
        { baseZ: -(platHalfD + 1), dz: -1, x: 0 },
        { baseZ: platHalfD + 1, dz: 1, x: 0 },
    ];

    stairDirections.forEach(({ baseZ, dz, x: stairCenterX }) => {
        // 5-wide staircase (grander entrance)
        const stairWidth = 5;
        const halfW = Math.floor(stairWidth / 2);

        for (let step = 0; step < PALACE.platformHeight + 1; step++) {
            const sy = -1 + step;
            const sz = baseZ + dz * (PALACE.platformHeight - step);

            for (let sx = stairCenterX - halfW; sx <= stairCenterX + halfW; sx++) {
                placeVoxel(sx, sy, sz, pick(PAL.platform), { rough: 0.4 });
            }
        }

        // Flanking pillars at stair entrance
        const pillarZ = baseZ + dz * PALACE.platformHeight;
        for (let py = -1; py <= 5; py++) {
            placeVoxel(stairCenterX - halfW - 1, py, pillarZ, pick(PAL.ice), glowOpts);
            placeVoxel(stairCenterX + halfW + 1, py, pillarZ, pick(PAL.ice), glowOpts);
        }
        // Crystal tops on entrance pillars
        placeVoxel(stairCenterX - halfW - 1, 6, pillarZ, pick(PAL.spireGlow), crystalOpts);
        placeVoxel(stairCenterX + halfW + 1, 6, pillarZ, pick(PAL.spireGlow), crystalOpts);
    });
}

// ---------------------------------------------------------------------------
//  buildSculptures — decorative ice sculptures around palace exterior
//  Places ≥6 sculptures at radius 9–14 from center (between platform edge
//  and lake). Each sculpture is a cluster of 3–8 emissive white/cyan voxels.
// ---------------------------------------------------------------------------
export function buildSculptures(world) {
    const sculptureCount = 8;
    const minRadius = 9;
    const maxRadius = 14;
    const sculptureColors = ['#ffffff', '#e0ffff', '#b0e0e6', '#aff0ef'];
    const placed = [];

    // Distribute sculptures evenly around the palace
    for (let i = 0; i < sculptureCount; i++) {
        const angle = (i / sculptureCount) * Math.PI * 2 + (Math.random() * 0.3 - 0.15);
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const cx = Math.round(Math.cos(angle) * radius);
        const cz = Math.round(Math.sin(angle) * radius);

        // Check spacing against previously placed sculptures
        const dist = Math.sqrt(cx * cx + cz * cz);
        if (dist < TERRAIN.lakeInnerRadius) continue;

        let tooClose = false;
        for (const pos of placed) {
            const dx = cx - pos.x;
            const dz = cz - pos.z;
            if (Math.sqrt(dx * dx + dz * dz) < TERRAIN.minSpacing) {
                tooClose = true;
                break;
            }
        }
        if (tooClose) continue;

        placed.push({ x: cx, z: cz });

        // Build a cluster of 3–8 emissive voxels
        const clusterSize = 3 + Math.floor(Math.random() * 6); // 3 to 8
        const emissiveOpts = { emissive: '#ffffff', emissiveI: 0.6, rough: 0.1 };
        const cyanOpts = { emissive: '#00e5ff', emissiveI: 0.5, rough: 0.1 };

        for (let v = 0; v < clusterSize; v++) {
            const vx = cx + Math.floor(Math.random() * 3) - 1;
            const vy = 1 + v; // stack upward from ground level
            const vz = cz + Math.floor(Math.random() * 3) - 1;
            const color = pick(sculptureColors);
            const opts = Math.random() > 0.5 ? emissiveOpts : cyanOpts;
            world.add(vx, vy, vz, color, opts);
        }
    }

    return { positions: placed };
}

// ---------------------------------------------------------------------------
//  scatterVegetation — pine trees and ice-dusted rocks outside the lake
//  Trees: 8–15 with trunk (2–4 tall) + canopy (3–5 layers)
//  Rocks: 10–20 with 1–3 voxels each
//  All placed outside lake outer radius (dist > 31) within island (dist < 35)
//  Minimum spacing of 3 voxels between any two placed objects.
//  Returns { positions: [{x, z}] } for property test validation.
// ---------------------------------------------------------------------------
export function scatterVegetation(world) {
    const lakeOuterRadius = TERRAIN.radius - TERRAIN.lakeOuterOffset; // 31
    const islandRadius = TERRAIN.radius; // 35
    const minSpacing = TERRAIN.minSpacing;
    const placed = [];

    // Helper: check if a candidate position respects spacing constraints
    function canPlace(x, z) {
        // Must be outside lake outer radius
        const dist = Math.sqrt(x * x + z * z);
        if (dist <= lakeOuterRadius || dist >= islandRadius) return false;
        // Must be outside palace exclusion zone
        if (dist < TERRAIN.lakeInnerRadius) return false;
        // Check spacing against all placed objects
        for (const pos of placed) {
            const dx = x - pos.x;
            const dz = z - pos.z;
            if (Math.sqrt(dx * dx + dz * dz) < minSpacing) return false;
        }
        return true;
    }

    // Helper: find a valid random position in the vegetation ring
    function findPosition(maxAttempts) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const r = lakeOuterRadius + 1 + Math.random() * (islandRadius - lakeOuterRadius - 2);
            const x = Math.round(Math.cos(angle) * r);
            const z = Math.round(Math.sin(angle) * r);
            if (canPlace(x, z)) return { x, z };
        }
        return null;
    }

    // --- Place pine trees (8–15) ---
    const treeCount = TERRAIN.treeCount[0] + Math.floor(Math.random() * (TERRAIN.treeCount[1] - TERRAIN.treeCount[0] + 1));
    for (let i = 0; i < treeCount; i++) {
        const pos = findPosition(50);
        if (!pos) continue;
        placed.push(pos);

        // Trunk: 2–4 voxels tall
        const trunkHeight = 2 + Math.floor(Math.random() * 3); // 2–4
        for (let y = 1; y <= trunkHeight; y++) {
            world.add(pos.x, y, pos.z, pick(PAL.pineTrunk), { rough: 0.9 });
        }

        // Canopy: 3–5 layers, pyramid shape tapering upward
        const canopyLayers = 3 + Math.floor(Math.random() * 3); // 3–5
        const canopyBase = trunkHeight + 1;
        for (let layer = 0; layer < canopyLayers; layer++) {
            const layerRadius = Math.max(1, canopyLayers - layer - 1);
            const ly = canopyBase + layer;
            for (let dx = -layerRadius; dx <= layerRadius; dx++) {
                for (let dz = -layerRadius; dz <= layerRadius; dz++) {
                    if (Math.abs(dx) + Math.abs(dz) <= layerRadius) {
                        world.add(pos.x + dx, ly, pos.z + dz, pick(PAL.pine), { rough: 0.8 });
                    }
                }
            }
        }
        // Snow cap on top
        world.add(pos.x, canopyBase + canopyLayers, pos.z, pick(PAL.snow), { rough: 0.9 });
    }

    // --- Place rocks (10–20) ---
    const rockCount = TERRAIN.rockCount[0] + Math.floor(Math.random() * (TERRAIN.rockCount[1] - TERRAIN.rockCount[0] + 1));
    for (let i = 0; i < rockCount; i++) {
        const pos = findPosition(50);
        if (!pos) continue;
        placed.push(pos);

        // Rock: 1–3 voxels
        const rockSize = 1 + Math.floor(Math.random() * 3); // 1–3
        for (let r = 0; r < rockSize; r++) {
            const rx = pos.x + (r > 0 ? Math.floor(Math.random() * 2) - 1 : 0);
            const ry = 1 + Math.floor(r / 2);
            const rz = pos.z + (r > 0 ? Math.floor(Math.random() * 2) - 1 : 0);
            world.add(rx, ry, rz, pick(PAL.rock), { rough: 0.95 });
        }
    }

    return { positions: placed };
}

// ---------------------------------------------------------------------------
//  buildFrostOverlay — pre-built frost voxels on palace walls and spire tops
//  Returns a THREE.Group (visible = false) for the season toggle.
//  Uses InstancedMesh directly (not VoxelWorld) for independent toggling.
// ---------------------------------------------------------------------------
export function buildFrostOverlay(root) {
    const group = new THREE.Group();
    group.visible = false;

    // Collect frost positions
    const positions = [];

    // Palace hall perimeter frost — scattered on walls at various heights
    const hallX0 = -Math.floor(PALACE.hallWidth / 2);  // -7
    const hallZ0 = -Math.floor(PALACE.hallDepth / 2);  // -7
    const hallW = PALACE.hallWidth;
    const hallD = PALACE.hallDepth;
    const hallY0 = 2; // platform top

    // Frost on wall surfaces (outer face of the hall)
    for (let y = 1; y <= PALACE.wallHeight; y++) {
        for (let i = 0; i < hallW; i++) {
            // North wall (Z = hallZ0 - 1)
            if (Math.random() < 0.35) {
                positions.push({ x: hallX0 + i, y: hallY0 + y, z: hallZ0 - 1 });
            }
            // South wall (Z = hallZ0 + hallD)
            if (Math.random() < 0.35) {
                positions.push({ x: hallX0 + i, y: hallY0 + y, z: hallZ0 + hallD });
            }
        }
        for (let j = 0; j < hallD; j++) {
            // West wall (X = hallX0 - 1)
            if (Math.random() < 0.35) {
                positions.push({ x: hallX0 - 1, y: hallY0 + y, z: hallZ0 + j });
            }
            // East wall (X = hallX0 + hallW)
            if (Math.random() < 0.35) {
                positions.push({ x: hallX0 + hallW, y: hallY0 + y, z: hallZ0 + j });
            }
        }
    }

    // Frost on spire upper portions
    const roofY = hallY0 + PALACE.wallHeight + 1; // Y = 15
    const spireBaseY = roofY + 1; // Y = 16
    const spirePositions = [
        { x: hallX0, z: hallZ0 },
        { x: hallX0 + hallW - 1, z: hallZ0 },
        { x: hallX0, z: hallZ0 + hallD - 1 },
        { x: hallX0 + hallW - 1, z: hallZ0 + hallD - 1 },
    ];

    spirePositions.forEach((sp) => {
        // Add frost to upper half of each spire
        const startH = Math.floor(PALACE.spireHeight / 2);
        for (let y = startH; y < PALACE.spireHeight; y++) {
            // Scattered around the spire (adjacent positions)
            if (Math.random() < 0.5) {
                positions.push({ x: sp.x + 1, y: spireBaseY + y, z: sp.z });
            }
            if (Math.random() < 0.5) {
                positions.push({ x: sp.x - 2, y: spireBaseY + y, z: sp.z });
            }
            if (Math.random() < 0.5) {
                positions.push({ x: sp.x, y: spireBaseY + y, z: sp.z + 1 });
            }
            if (Math.random() < 0.5) {
                positions.push({ x: sp.x, y: spireBaseY + y, z: sp.z - 2 });
            }
        }
    });

    if (positions.length === 0) return group;

    // Build InstancedMesh
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(PAL.frost[0]),
        roughness: 0.2,
        metalness: 0.1,
        emissive: new THREE.Color('#aaddff'),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
    const dummy = new THREE.Object3D();
    const frostColors = PAL.frost;

    for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, new THREE.Color(pick(frostColors)));
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    group.add(mesh);
    root.add(group);
    return group;
}

// ---------------------------------------------------------------------------
//  buildThickIce — 2 additional ice layers above the frozen lake surface
//  Returns a THREE.Group (visible = false) for the season toggle.
//  Lake ring: inner radius 8, outer radius 31 (TERRAIN.radius - lakeOuterOffset).
// ---------------------------------------------------------------------------
export function buildThickIce(root) {
    const group = new THREE.Group();
    group.visible = false;

    const innerR = TERRAIN.lakeInnerRadius;
    const outerR = TERRAIN.radius - TERRAIN.lakeOuterOffset;

    // Collect positions for 2 layers (Y=0 and Y=1) within the lake ring
    const positions = [];

    for (let x = -outerR; x <= outerR; x++) {
        for (let z = -outerR; z <= outerR; z++) {
            const dist = Math.sqrt(x * x + z * z);
            if (dist < innerR || dist > outerR) continue;

            positions.push({ x, y: 0, z });
            positions.push({ x, y: 1, z });
        }
    }

    if (positions.length === 0) return group;

    // Build InstancedMesh with lighter lake colors
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#6aaed7'),
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.7,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
    const dummy = new THREE.Object3D();
    const iceColors = ['#7abee7', '#8acef7', '#6aaed7', '#9adeff'];

    for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, new THREE.Color(pick(iceColors)));
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    group.add(mesh);
    root.add(group);
    return group;
}

// ---------------------------------------------------------------------------
//  buildScene — orchestrates full scene construction and returns references
//  for main.js (lights for flicker animation, groups for season toggle).
// ---------------------------------------------------------------------------
export function buildScene({ scene, world, root }) {
    // 1–5: Build all static voxel geometry
    buildTerrain(world);
    buildFrozenLake(world);
    buildPalace(world);
    buildSculptures(world);
    scatterVegetation(world);

    // 6: Flush voxels to GPU
    world.commit(root);

    // 7–8: Build overlay groups (initially hidden, toggled by season control)
    const frostGroup = buildFrostOverlay(root);
    const thickIceGroup = buildThickIce(root);

    // 9: Create emissive point lights at spire tops and bridge midpoints
    const spireLights = [];

    // Spire top positions (corner coordinates from PALACE geometry)
    // Spire top Y = spireBaseY(16) + spireHeight(14) + 5 taper + 3 crystal = 38
    const spireTopY = 38;
    const spireCorners = [
        { x: -7, z: -7 },  // NW
        { x: 6, z: -7 },   // NE
        { x: -7, z: 6 },   // SW
        { x: 6, z: 6 },    // SE
    ];

    spireCorners.forEach(({ x, z }) => {
        const light = new THREE.PointLight('#aaeeff', 2.5, 30);
        light.position.set(x, spireTopY, z);
        light.castShadow = false;
        root.add(light);
        spireLights.push(light);
    });

    // Bridge midpoint lights
    // Bridge 1: NW(-7,-7) ↔ NE(6,-7) → midpoint ≈ (0, 18, -7)
    // Bridge 2: SW(-7,6) ↔ SE(6,6)  → midpoint ≈ (0, 18, 6)
    const bridgeY = 18; // roofY(15) + 3
    const bridgeMidpoints = [
        { x: 0, z: -7 },
        { x: 0, z: 6 },
    ];

    bridgeMidpoints.forEach(({ x, z }) => {
        const light = new THREE.PointLight('#aaeeff', 2.5, 30);
        light.position.set(x, bridgeY, z);
        light.castShadow = false;
        root.add(light);
        spireLights.push(light);
    });

    // 10: Return references for main.js
    return { spireLights, frostGroup, thickIceGroup };
}
