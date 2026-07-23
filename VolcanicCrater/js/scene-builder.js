import * as THREE from '../vendor/three.module.js';
import { PAL, pick } from './palette.js';

// ---------------------------------------------------------------------------
//  SCENE BUILDER — constructs the volcanic crater complex with caldera,
//  obsidian peaks, basalt columns, lava channels, crystal deposits,
//  mining platforms, stone bridges, and vent stacks.
// ---------------------------------------------------------------------------
export function buildScene({ scene, world, root }) {

    const CRATER_RADIUS = 35;
    const CRATER_DEPTH = 8;
    const RIM_HEIGHT = 18;

    // Track lava channel paths for particle system
    const lavaChannels = [];

    // Lava channel angles (defined early so isInLavaChannel can reference them)
    const channelAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

    function isInLavaChannel(x, z) {
        const ang = Math.atan2(z, x);
        const dist = Math.hypot(x, z);
        if (dist < 10 || dist > 28) return false;
        for (const ca of channelAngles) {
            let diff = Math.abs(ang - ca);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            const width = 0.08 + Math.sin(dist * 0.3) * 0.02;
            if (diff < width) return true;
        }
        return false;
    }

    // ========================================================================
    //  TERRAIN — crater bowl with obsidian rim and geological layering
    // ========================================================================
    for (let x = -CRATER_RADIUS - 5; x <= CRATER_RADIUS + 5; x++) {
        for (let z = -CRATER_RADIUS - 5; z <= CRATER_RADIUS + 5; z++) {
            const dist = Math.hypot(x, z);
            if (dist > CRATER_RADIUS + 4) continue;

            // Caldera shape: bowl with raised rim
            const normDist = dist / CRATER_RADIUS;
            let height;

            if (normDist < 0.3) {
                // Inner pool area — flat lava surface
                height = -CRATER_DEPTH;
            } else if (normDist < 0.5) {
                // Inner slope rising from pool
                const t = (normDist - 0.3) / 0.2;
                height = -CRATER_DEPTH + t * CRATER_DEPTH;
            } else if (normDist < 0.75) {
                // Mid terrain — relatively flat ash fields
                const t = (normDist - 0.5) / 0.25;
                const noise = Math.sin(x * 0.3) * 1.5 + Math.cos(z * 0.25) * 1.2
                    + Math.sin((x + z) * 0.15) * 0.8;
                height = noise + t * 4;
            } else {
                // Outer rim — jagged peaks
                const t = (normDist - 0.75) / 0.25;
                const rimNoise = Math.sin(x * 0.4 + z * 0.3) * 3
                    + Math.cos(x * 0.7 - z * 0.5) * 2
                    + Math.sin((x - z) * 0.2) * 4;
                height = 4 + t * RIM_HEIGHT + rimNoise * (0.5 + t);
                // Some peaks go extra high
                if (Math.random() < 0.02 && normDist > 0.85) height += 4 + Math.random() * 6;
            }

            height = Math.round(height);
            const wy = height;

            // Skip lava pool area (will be handled separately)
            if (normDist < 0.3) continue;

            // Check if this is a lava channel
            const isChannel = isInLavaChannel(x, z);
            if (isChannel && normDist > 0.3 && normDist < 0.85) {
                // Lava channel floor
                const channelDepth = -2 + Math.floor(Math.random() * 2);
                world.add(x, channelDepth, z, pick(PAL.lavaHot), {
                    emissive: '#FF4500', emissiveI: 0.8, rough: 0.3
                });
                // Channel walls (1 voxel on each side would be cooled lava)
                continue;
            }

            // Surface material based on distance
            let surfaceColor;
            if (normDist < 0.55) {
                surfaceColor = pick(PAL.obsidian);
            } else if (normDist < 0.75) {
                surfaceColor = pick(PAL.ash);
            } else {
                surfaceColor = pick(PAL.obsidian);
            }

            world.add(x, wy, z, surfaceColor, { rough: 0.9, jitter: 0.05 });

            // Subsurface layers
            const depth = normDist > 0.75 ? 6 + Math.floor(Math.random() * 4) : 3;
            for (let dy = 1; dy <= depth; dy++) {
                let col;
                if (dy < 2) col = pick(PAL.obsidianLight);
                else if (dy < 4) col = pick(PAL.basalt);
                else col = pick(PAL.basaltDark);
                world.add(x, wy - dy, z, col, { rough: 0.92, jitter: dy > 2 ? 0.1 : 0 });
            }

            // Cooled lava with crack glow on inner slopes
            if (normDist > 0.35 && normDist < 0.6 && Math.random() < 0.08) {
                world.add(x, wy + 1, z, pick(PAL.lavaCrack), {
                    emissive: '#FF6B35', emissiveI: 0.4, rough: 0.5, sy: 0.3
                });
            }
        }
    }

    // ========================================================================
    //  LAVA POOL — emissive flat surface at crater bottom
    // ========================================================================
    for (let x = -12; x <= 12; x++) {
        for (let z = -12; z <= 12; z++) {
            const dist = Math.hypot(x, z);
            if (dist > 10) continue;
            // Lava pool surface
            const intensity = 0.7 + (1 - dist / 10) * 0.3;
            world.add(x, -CRATER_DEPTH, z, pick(PAL.lavaHot), {
                emissive: '#FF4500', emissiveI: intensity, rough: 0.2, sy: 0.5
            });
            // Glow layer slightly below
            if (Math.random() < 0.4) {
                world.add(x, -CRATER_DEPTH - 1, z, pick(PAL.lavaGlow), {
                    emissive: '#FF8C00', emissiveI: 0.5, rough: 0.3
                });
            }
        }
    }

    // ========================================================================
    //  LAVA CHANNELS — 4 radial rivers flowing outward
    // ========================================================================

    // Store channel endpoints for particle effects
    for (const ca of channelAngles) {
        const startDist = 10;
        const endDist = 28;
        lavaChannels.push({
            startX: Math.cos(ca) * startDist,
            startZ: Math.sin(ca) * startDist,
            endX: Math.cos(ca) * endDist,
            endZ: Math.sin(ca) * endDist,
            angle: ca,
        });
    }

    // ========================================================================
    //  BASALT COLUMNS — hexagonal clusters scattered in mid-ring
    // ========================================================================
    const columnClusters = [
        { cx: 15, cz: 10 }, { cx: -12, cz: 15 }, { cx: -18, cz: -8 },
        { cx: 10, cz: -16 }, { cx: 20, cz: -5 }, { cx: -8, cz: -20 },
        { cx: 5, cz: 22 }, { cx: -22, cz: 3 },
    ];

    for (const cluster of columnClusters) {
        const count = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            const cx = cluster.cx + Math.floor((Math.random() - 0.5) * 5);
            const cz = cluster.cz + Math.floor((Math.random() - 0.5) * 5);
            const colHeight = 6 + Math.floor(Math.random() * 10);
            const baseY = -2 + Math.floor(Math.random() * 3);

            for (let y = 0; y < colHeight; y++) {
                world.add(cx, baseY + y, cz, pick(PAL.basalt), {
                    rough: 0.85, jitter: 0.05
                });
            }
            // Flat top
            world.add(cx, baseY + colHeight, cz, pick(PAL.basaltDark), { rough: 0.9, sy: 0.3 });
        }
    }

    // ========================================================================
    //  CRYSTAL DEPOSITS — glowing mineral clusters
    // ========================================================================
    const crystalLocations = [
        { x: 18, z: 3, type: 'amber' },
        { x: -15, z: 12, type: 'ruby' },
        { x: 8, z: -20, type: 'emerald' },
        { x: -20, z: -10, type: 'amber' },
        { x: 25, z: -12, type: 'ruby' },
        { x: -5, z: 25, type: 'emerald' },
        { x: 12, z: 18, type: 'amber' },
        { x: -25, z: -3, type: 'ruby' },
        { x: -10, z: -22, type: 'emerald' },
        { x: 22, z: 15, type: 'amber' },
    ];

    const crystalMeshPositions = [];

    for (const loc of crystalLocations) {
        const palette = loc.type === 'amber' ? PAL.crystalAmber
            : loc.type === 'ruby' ? PAL.crystalRuby : PAL.crystalEmerald;
        const emissiveColor = loc.type === 'amber' ? '#FFBF00'
            : loc.type === 'ruby' ? '#DC143C' : '#00C853';

        const clusterSize = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < clusterSize; i++) {
            const ox = loc.x + Math.floor((Math.random() - 0.5) * 3);
            const oz = loc.z + Math.floor((Math.random() - 0.5) * 3);
            const baseY = 1 + Math.floor(Math.random() * 3);
            const height = 2 + Math.floor(Math.random() * 4);

            for (let y = 0; y < height; y++) {
                const scale = 1 - y * 0.15;
                world.add(ox, baseY + y, oz, pick(palette), {
                    emissive: emissiveColor,
                    emissiveI: 0.5 + (y / height) * 0.5,
                    rough: 0.2,
                    metal: 0.1,
                    sx: scale * 0.7,
                    sz: scale * 0.7,
                    sy: 1.2
                });
            }
            crystalMeshPositions.push({ x: ox, y: baseY + height, z: oz });
        }
    }

    // ========================================================================
    //  MINING PLATFORMS — scaffolding built into cliff faces
    // ========================================================================
    const platforms = [
        { x: 28, z: 0, facing: 'west' },
        { x: -26, z: 12, facing: 'east' },
        { x: 10, z: -28, facing: 'south' },
    ];

    for (const plat of platforms) {
        // Wooden platform base
        for (let px = -3; px <= 3; px++) {
            for (let pz = -2; pz <= 2; pz++) {
                world.add(plat.x + px, 5, plat.z + pz, pick(PAL.woodCharred), { rough: 0.95 });
            }
        }
        // Support struts (metal)
        for (let y = 0; y < 5; y++) {
            world.add(plat.x - 3, y, plat.z - 2, pick(PAL.metalScaffold), { rough: 0.6, metal: 0.4 });
            world.add(plat.x + 3, y, plat.z - 2, pick(PAL.metalScaffold), { rough: 0.6, metal: 0.4 });
            world.add(plat.x - 3, y, plat.z + 2, pick(PAL.metalScaffold), { rough: 0.6, metal: 0.4 });
            world.add(plat.x + 3, y, plat.z + 2, pick(PAL.metalScaffold), { rough: 0.6, metal: 0.4 });
        }
        // Cross-bracing
        for (let y = 1; y < 5; y += 2) {
            world.add(plat.x, y, plat.z - 2, pick(PAL.metalScaffold), {
                rough: 0.6, metal: 0.3, sx: 5, sy: 0.3, sz: 0.3
            });
        }
        // Railing
        for (let px = -3; px <= 3; px++) {
            world.add(plat.x + px, 6, plat.z - 2, pick(PAL.metalScaffold), {
                rough: 0.6, metal: 0.3, sy: 0.8, sx: 0.3, sz: 0.3
            });
            world.add(plat.x + px, 6, plat.z + 2, pick(PAL.metalScaffold), {
                rough: 0.6, metal: 0.3, sy: 0.8, sx: 0.3, sz: 0.3
            });
        }
    }

    // ========================================================================
    //  STONE BRIDGES — cooled lava bridges spanning channels
    // ========================================================================
    const bridges = [
        { x1: 8, z1: 5, x2: 15, z2: 5 },
        { x1: -5, z1: -10, x2: -5, z2: -18 },
    ];

    for (const br of bridges) {
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const bx = Math.round(br.x1 + (br.x2 - br.x1) * t);
            const bz = Math.round(br.z1 + (br.z2 - br.z1) * t);
            const arc = Math.sin(t * Math.PI) * 2;
            const by = Math.round(1 + arc);
            // Bridge deck
            for (let w = -1; w <= 1; w++) {
                const perpX = br.z2 === br.z1 ? 0 : w;
                const perpZ = br.x2 === br.x1 ? 0 : w;
                world.add(bx + perpX, by, bz + perpZ, pick(PAL.lavaCool), { rough: 0.85 });
            }
        }
    }

    // ========================================================================
    //  VENT STACKS — natural chimneys with sulfur staining
    // ========================================================================
    const ventPositions = [
        { x: 20, z: 18 }, { x: -18, z: 20 }, { x: -22, z: -15 },
        { x: 15, z: -22 }, { x: 25, z: 5 }, { x: -10, z: 26 },
    ];

    for (const vent of ventPositions) {
        const ventHeight = 5 + Math.floor(Math.random() * 6);
        for (let y = 0; y < ventHeight; y++) {
            const radius = y < ventHeight - 2 ? 1 : 0;
            for (let vx = -radius; vx <= radius; vx++) {
                for (let vz = -radius; vz <= radius; vz++) {
                    if (Math.hypot(vx, vz) > radius + 0.5) continue;
                    let col = pick(PAL.obsidian);
                    // Sulfur staining near top
                    if (y >= ventHeight - 3 && Math.random() < 0.4) col = pick(PAL.sulfur);
                    world.add(vent.x + vx, y + 2, vent.z + vz, col, { rough: 0.9, jitter: 0.08 });
                }
            }
        }
        // Hollow top (dark inside)
        world.add(vent.x, ventHeight + 2, vent.z, '#0a0a0a', { rough: 1.0, sy: 0.3 });
    }

    // ========================================================================
    //  WATCHTOWER — carved from obsidian on highest rim point
    // ========================================================================
    const towerX = 0, towerZ = -30;
    const towerBase = 12;

    for (let y = 0; y < 14; y++) {
        const r = y < 10 ? 2 : 1;
        for (let tx = -r; tx <= r; tx++) {
            for (let tz = -r; tz <= r; tz++) {
                if (Math.hypot(tx, tz) > r + 0.3) continue;
                const edge = Math.hypot(tx, tz) > r - 0.5;
                if (edge || y < 2) {
                    const col = y > 10 ? pick(PAL.obsidianLight) : pick(PAL.obsidian);
                    world.add(towerX + tx, towerBase + y, towerZ + tz, col, { rough: 0.85 });
                }
            }
        }
    }
    // Observation deck
    for (let tx = -3; tx <= 3; tx++) {
        for (let tz = -3; tz <= 3; tz++) {
            if (Math.hypot(tx, tz) > 3.5) continue;
            world.add(towerX + tx, towerBase + 14, towerZ + tz, pick(PAL.obsidianLight), { rough: 0.8 });
        }
    }
    // Beacon crystal on top
    world.add(towerX, towerBase + 15, towerZ, '#FFBF00', {
        emissive: '#FFBF00', emissiveI: 1.5, rough: 0.2, metal: 0.2, sx: 0.8, sy: 1.5, sz: 0.8
    });
    const towerLight = new THREE.PointLight(0xFFBF00, 10, 40, 2);
    towerLight.position.set(towerX, towerBase + 16, towerZ);
    root.add(towerLight);

    // ========================================================================
    //  LAVA POOL LIGHT
    // ========================================================================
    const lavaLight = new THREE.PointLight(0xFF4500, 15, 60, 2);
    lavaLight.position.set(0, -CRATER_DEPTH + 3, 0);
    root.add(lavaLight);

    const lavaLight2 = new THREE.PointLight(0xFF8C00, 8, 40, 2);
    lavaLight2.position.set(0, -CRATER_DEPTH + 1, 0);
    root.add(lavaLight2);

    // Commit all voxels
    world.commit(root);

    return { lavaChannels, ventPositions, crystalMeshPositions, lavaLight, lavaLight2 };
}
