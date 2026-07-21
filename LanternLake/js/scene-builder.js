import * as THREE from '../vendor/three.module.js';
import { PAL, pick } from './palette.js';

// ---------------------------------------------------------------------------
//  SCENE BUILDER — Lantern Lake: terrain, lake, boat, dock, vegetation, hills
// ---------------------------------------------------------------------------

const TERRAIN = { radius: 45, lakeRadius: 35, shoreStart: 35, shoreEnd: 43 };

// ---------------------------------------------------------------------------
//  buildTerrain — floating island with grass surface and rock strata
// ---------------------------------------------------------------------------
export function buildTerrain(world) {
    const radius = TERRAIN.radius;
    const taperRate = 0.7;
    const strataDepth = 5;

    // Flower colors for shoreline
    const flowers = ['#ff6b8a', '#ff9ecb', '#ffcc44', '#aa66ff', '#66ccff', '#ff8844', '#ffffff'];

    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            const dist = Math.sqrt(x * x + z * z);
            if (dist > radius) continue;

            if (dist <= TERRAIN.lakeRadius) {
                // Lake water — vivid pure blue
                world.add(x, 0, z, pick(['#4090e0', '#4898f0', '#3888e8', '#5098f0', '#4590e8']), { rough: 0.08, metal: 0.15 });
                world.add(x, -1, z, pick(['#3078d0', '#3880d8', '#2870c8']), { rough: 0.1 });
                world.add(x, -2, z, pick(['#2060b0', '#2868b8']), { rough: 0.15 });
            } else if (dist <= TERRAIN.shoreEnd) {
                // Lush shoreline — grass with scattered flowers
                world.add(x, 0, z, pick(PAL.grass), { rough: 0.8, jitter: 0.03 });

                // Flowers scattered along shore (15% chance)
                if (Math.random() < 0.15) {
                    world.add(x, 1, z, pick(flowers), { rough: 0.4, emissive: pick(flowers), emissiveI: 0.15 });
                }
                // Tall grass tufts (10% chance)
                if (Math.random() < 0.1) {
                    world.add(x, 1, z, pick(['#3a8c4a', '#4a9c5c']), { rough: 0.7, sy: 1.5, sx: 0.5, sz: 0.5 });
                }
            } else {
                // Outer area — rich grass
                world.add(x, 0, z, pick(PAL.grass), { rough: 0.85, jitter: 0.03 });
                // More flowers on outer ring
                if (Math.random() < 0.08) {
                    world.add(x, 1, z, pick(flowers), { rough: 0.4, emissive: pick(flowers), emissiveI: 0.1 });
                }
            }
        }
    }

    // Rock strata beneath
    for (let layer = 1; layer <= strataDepth; layer++) {
        const layerRadius = radius - layer * taperRate;
        if (layerRadius <= 0) break;
        for (let x = -Math.ceil(layerRadius); x <= Math.ceil(layerRadius); x++) {
            for (let z = -Math.ceil(layerRadius); z <= Math.ceil(layerRadius); z++) {
                if (x * x + z * z <= layerRadius * layerRadius) {
                    world.add(x, -2 - layer, z, pick(PAL.rock), { rough: 0.95 });
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
//  buildBoat — small wooden rowboat at lake center
// ---------------------------------------------------------------------------
export function buildBoat(world) {
    const boatOpts = { rough: 0.7 };
    const cx = 0, cy = 1, cz = 0;

    // Hull (8x4, curved)
    for (let x = -3; x <= 4; x++) {
        for (let z = -1; z <= 1; z++) {
            // Bottom
            world.add(cx + x, cy, cz + z, pick(PAL.boat), boatOpts);
        }
    }
    // Sides (raised edges)
    for (let x = -3; x <= 4; x++) {
        world.add(cx + x, cy + 1, cz - 2, pick(PAL.boat), boatOpts);
        world.add(cx + x, cy + 1, cz + 2, pick(PAL.boat), boatOpts);
    }
    // Bow and stern (higher)
    for (let z = -1; z <= 1; z++) {
        world.add(cx - 4, cy + 1, cz + z, pick(PAL.boat), boatOpts);
        world.add(cx + 5, cy + 1, cz + z, pick(PAL.boat), boatOpts);
        world.add(cx - 4, cy + 2, cz + z, pick(PAL.boatTrim), boatOpts);
        world.add(cx + 5, cy + 2, cz + z, pick(PAL.boatTrim), boatOpts);
    }
    // Seat plank
    for (let z = -1; z <= 1; z++) {
        world.add(cx + 1, cy + 1, cz + z, pick(PAL.boatTrim), boatOpts);
    }
    // Lanterns resting in boat
    const lanternOpts = { rough: 0.3, emissive: '#ffcc44', emissiveI: 0.4 };
    world.add(cx - 1, cy + 2, cz, pick(PAL.lanternPaper), lanternOpts);
    world.add(cx - 2, cy + 2, cz, pick(PAL.lanternPaper), lanternOpts);
    world.add(cx - 1, cy + 3, cz, pick(PAL.lanternFrame), { rough: 0.5 });
}

// ---------------------------------------------------------------------------
//  buildDock — wooden dock extending into the lake from south
// ---------------------------------------------------------------------------
export function buildDock(world) {
    const dockZ = TERRAIN.lakeRadius - 2;
    const dockOpts = { rough: 0.75 };

    // Plank surface
    for (let x = -1; x <= 1; x++) {
        for (let z = dockZ; z <= dockZ + 8; z++) {
            world.add(x, 1, z, pick(PAL.dock), dockOpts);
        }
    }
    // Support posts
    for (let z = dockZ; z <= dockZ + 8; z += 3) {
        world.add(-1, 0, z, pick(PAL.trunk), { rough: 0.9 });
        world.add(1, 0, z, pick(PAL.trunk), { rough: 0.9 });
    }
    // Lantern post at dock end
    for (let y = 1; y <= 5; y++) {
        world.add(0, y, dockZ + 8, pick(PAL.trunk), { rough: 0.8 });
    }
    world.add(0, 6, dockZ + 8, pick(PAL.glow), { rough: 0.1, emissive: '#ffcc44', emissiveI: 0.6 });
}

// ---------------------------------------------------------------------------
//  buildVegetation — willow trees, cherry trees, reeds, bushes, shore lanterns
// ---------------------------------------------------------------------------
export function buildVegetation(world) {
    const placed = [];
    const flowers = ['#ff6b8a', '#ff9ecb', '#ffcc44', '#aa66ff', '#66ccff', '#ff8844', '#ffffff', '#ffaacc'];

    function canPlace(x, z, spacing) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist < TERRAIN.shoreStart || dist > TERRAIN.radius - 2) return false;
        for (const p of placed) {
            if (Math.sqrt((x - p.x) ** 2 + (z - p.z) ** 2) < spacing) return false;
        }
        return true;
    }

    // Willow trees (6) — large and dramatic
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
        const r = TERRAIN.shoreStart + 1 + Math.random() * 5;
        const x = Math.round(Math.cos(angle) * r);
        const z = Math.round(Math.sin(angle) * r);
        if (!canPlace(x, z, 7)) continue;
        placed.push({ x, z });

        const height = 5 + Math.floor(Math.random() * 3);
        for (let y = 1; y <= height; y++) {
            world.add(x, y, z, pick(PAL.trunk), { rough: 0.9 });
        }
        // Wide canopy
        const canopyY = height + 1;
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                if (Math.abs(dx) + Math.abs(dz) <= 4) {
                    world.add(x + dx, canopyY, z + dz, pick(PAL.willow), { rough: 0.8 });
                }
            }
        }
        // Long cascading vines
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                const edgeDist = Math.abs(dx) + Math.abs(dz);
                if (edgeDist >= 3 && edgeDist <= 4) {
                    const dropLen = 3 + Math.floor(Math.random() * 4);
                    for (let dy = 0; dy < dropLen; dy++) {
                        world.add(x + dx, canopyY - 1 - dy, z + dz, pick(PAL.willow), { rough: 0.7 });
                    }
                }
            }
        }
    }

    // Flowering trees (4) — colorful accents
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + 0.8;
        const r = TERRAIN.shoreStart + 2 + Math.random() * 4;
        const x = Math.round(Math.cos(angle) * r);
        const z = Math.round(Math.sin(angle) * r);
        if (!canPlace(x, z, 6)) continue;
        placed.push({ x, z });

        const height = 3 + Math.floor(Math.random() * 2);
        for (let y = 1; y <= height; y++) {
            world.add(x, y, z, pick(PAL.trunk), { rough: 0.9 });
        }
        // Blossom canopy with mixed colors
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (Math.abs(dx) + Math.abs(dz) <= 2) {
                    for (let dy = 0; dy <= 1; dy++) {
                        world.add(x + dx, height + 1 + dy, z + dz, pick(PAL.blossom), { rough: 0.5 });
                    }
                }
            }
        }
    }

    // Flower bushes (dense clusters along shore)
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = TERRAIN.shoreStart + Math.random() * 6;
        const x = Math.round(Math.cos(angle) * r);
        const z = Math.round(Math.sin(angle) * r);
        // Low flower bush (2-3 voxels)
        for (let dx = 0; dx <= 1; dx++) {
            for (let dz = 0; dz <= 1; dz++) {
                world.add(x + dx, 1, z + dz, pick(flowers), { rough: 0.4, emissive: pick(flowers), emissiveI: 0.1 });
            }
        }
    }

    // Reeds/cattails at water's edge (15 clusters)
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = TERRAIN.lakeRadius - 0.5 + Math.random() * 2;
        const x = Math.round(Math.cos(angle) * r);
        const z = Math.round(Math.sin(angle) * r);
        const reedHeight = 2 + Math.floor(Math.random() * 3);
        for (let y = 1; y <= reedHeight; y++) {
            world.add(x, y, z, pick(PAL.reeds), { rough: 0.8, sy: 1.5, sx: 0.4, sz: 0.4 });
        }
    }

    // Shore lantern posts (4 at cardinal points)
    const lanternAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
    lanternAngles.forEach(angle => {
        const r = TERRAIN.shoreStart + 2;
        const x = Math.round(Math.cos(angle) * r);
        const z = Math.round(Math.sin(angle) * r);
        for (let y = 1; y <= 4; y++) {
            world.add(x, y, z, pick(PAL.stone), { rough: 0.7 });
        }
        world.add(x, 5, z, pick(PAL.glow), { rough: 0.1, emissive: '#ffaa22', emissiveI: 0.7 });
    });

    // Scattered decorative rocks
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = TERRAIN.shoreStart + Math.random() * 6;
        const x = Math.round(Math.cos(angle) * r);
        const z = Math.round(Math.sin(angle) * r);
        world.add(x, 1, z, pick(PAL.stone), { rough: 0.95 });
    }
}

// ---------------------------------------------------------------------------
//  buildHills — distant backdrop silhouette
// ---------------------------------------------------------------------------
export function buildHills(world) {
    const hillRadius = 48;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
        const x = Math.round(Math.cos(angle) * hillRadius);
        const z = Math.round(Math.sin(angle) * hillRadius);
        const height = 2 + Math.floor(Math.sin(angle * 3) * 2 + Math.cos(angle * 5) * 1.5 + 3);
        for (let y = -2; y <= height; y++) {
            world.add(x, y, z, pick(PAL.hills), { rough: 0.95 });
            // Thicken
            world.add(x + 1, y, z, pick(PAL.hills), { rough: 0.95 });
            world.add(x, y, z + 1, pick(PAL.hills), { rough: 0.95 });
        }
    }
}

// ---------------------------------------------------------------------------
//  buildScene — orchestrator
// ---------------------------------------------------------------------------
export function buildScene({ scene, world, root }) {
    buildTerrain(world);
    buildBoat(world);
    buildDock(world);
    buildVegetation(world);
    buildHills(world);

    world.commit(root);

    // Shore lantern lights
    const shoreLights = [];
    const angles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
    angles.forEach(angle => {
        const r = TERRAIN.shoreStart + 2;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const light = new THREE.PointLight('#ffaa33', 1.5, 20);
        light.position.set(x, 5, z);
        root.add(light);
        shoreLights.push(light);
    });

    // Boat light
    const boatLight = new THREE.PointLight('#ffdd66', 2.0, 15);
    boatLight.position.set(0, 3, 0);
    root.add(boatLight);

    return { shoreLights, boatLight };
}
