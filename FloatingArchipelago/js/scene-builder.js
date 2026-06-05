import * as THREE from '../vendor/three.module.js';
import { PAL, pick } from './palette.js';

// ---------------------------------------------------------------------------
//  SCENE BUILDER — constructs 5 floating islands at varying altitudes,
//  crystal bridges, temple ruins, watchtower, hanging gardens, and a shrine.
//  Each island has distinctive silhouette, geological layering, and rich detail.
// ---------------------------------------------------------------------------
export function buildScene({ scene, world, root }) {

    // Island definitions
    const islands = [
        { cx: 0, cz: 0, y: 0, rx: 22, rz: 22, name: 'central' },
        { cx: 0, cz: -50, y: 15, rx: 14, rz: 12, name: 'north' },
        { cx: 48, cz: 8, y: 8, rx: 12, rz: 11, name: 'east' },
        { cx: -46, cz: 5, y: 5, rx: 15, rz: 13, name: 'west' },
        { cx: 5, cz: 48, y: -8, rx: 10, rz: 10, name: 'south' },
    ];

    const surfaceData = new Map();

    islands.forEach((isl, idx) => buildIsland(isl, idx));

    function buildIsland(isl, idx) {
        const { cx, cz, y: baseY, rx, rz } = isl;

        // More dramatic height map with multiple noise octaves
        const heightAt = (lx, lz) => {
            const d = Math.hypot(lx / rx, lz / rz);
            let h = Math.sin(lx * 0.15) * 1.8 + Math.cos(lz * 0.13) * 1.5
                + Math.sin((lx + lz) * 0.08) * 2.0
                + Math.cos(lx * 0.22 - lz * 0.18) * 0.9;
            // Flatten center for structures
            const flat = Math.max(0, 1 - d * 1.8);
            h *= (1 - flat * 0.7);
            // Raise edges slightly for dramatic cliffs
            if (d > 0.7) h += (d - 0.7) * 3;
            return Math.round(h);
        };

        // Organic coastline with more wobble
        const islandMask = (lx, lz) => {
            const ang = Math.atan2(lz, lx);
            const wob = Math.sin(ang * 3) * 2.0 + Math.cos(ang * 5 + 0.7) * 1.5
                + Math.sin(ang * 7 + 2.1) * 0.8 + Math.cos(ang * 11) * 0.5;
            const dx = lx / rx, dz = lz / rz;
            return Math.sqrt(dx * dx + dz * dz) <= 1 + wob / Math.max(rx, rz);
        };

        for (let lx = -rx - 3; lx <= rx + 3; lx++) {
            for (let lz = -rz - 3; lz <= rz + 3; lz++) {
                if (!islandMask(lx, lz)) continue;
                const top = heightAt(lx, lz);
                const wx = cx + lx, wy = baseY + top, wz = cz + lz;
                const dist = Math.sqrt((lx / rx) ** 2 + (lz / rz) ** 2);

                surfaceData.set(`${idx}:${lx},${lz}`, wy);

                // Surface: grass with scattered mossy patches
                const isMoss = Math.sin(lx * 0.7 + lz * 0.5) > 0.6;
                world.add(wx, wy, wz, isMoss ? pick(PAL.mossDark) : pick(PAL.grassTop), { jitter: 0.04 });
                world.add(wx, wy - 1, wz, pick(PAL.mossDark));

                // Dirt layer
                const dirtDepth = 3 + Math.floor(Math.abs(Math.sin(lx * 0.25 + lz * 0.2)) * 2);
                for (let dy = 2; dy <= dirtDepth + 2; dy++) {
                    world.add(wx, wy - dy, wz, pick(PAL.dirt));
                }

                // Geological layering on cliff faces
                const under = wy - dirtDepth - 2;
                const taper = Math.max(0, (1 - dist) * 12 + 4);
                for (let dy = 1; dy <= taper; dy++) {
                    const yy = under - dy;
                    // Layered rock strata
                    let col;
                    if (dy < 3) col = pick(PAL.stoneLight);
                    else if (dy < 6) col = pick(PAL.stoneMed);
                    else if (dy < 10) col = pick(PAL.stoneDark);
                    else col = pick(PAL.rock);
                    // Occasional mineral veins
                    if (Math.random() < 0.02) col = '#4A7A8A';
                    world.add(wx, yy, wz, col, { jitter: dy > 4 ? 0.18 : 0.05 });
                }

                // Stalactite-style bottom for floating feel
                if (dist < 0.4 && Math.random() < 0.15) {
                    const stalLen = 2 + Math.floor(Math.random() * 4);
                    for (let s = 0; s < stalLen; s++) {
                        world.add(wx, under - taper - s, wz, pick(PAL.stoneDark), {
                            sx: 0.6 - s * 0.08, sz: 0.6 - s * 0.08, jitter: 0.1
                        });
                    }
                }
            }
        }

        // Rock outcroppings on surface (boulders)
        for (let i = 0; i < Math.floor(rx * rz * 0.02); i++) {
            const lx = Math.floor((Math.random() * 2 - 1) * (rx - 3));
            const lz = Math.floor((Math.random() * 2 - 1) * (rz - 3));
            const key = `${idx}:${lx},${lz}`;
            if (!surfaceData.has(key)) continue;
            const sy = surfaceData.get(key);
            const bh = 1 + Math.floor(Math.random() * 3);
            const bw = 1 + Math.floor(Math.random() * 2);
            for (let bx = -bw; bx <= bw; bx++) {
                for (let bz = -bw; bz <= bw; bz++) {
                    if (Math.random() < 0.6) continue;
                    for (let by = 0; by < bh; by++) {
                        world.add(cx + lx + bx, sy + 1 + by, cz + lz + bz, pick(PAL.rock), { jitter: 0.2, rough: 0.9 });
                    }
                }
            }
        }

        // Build structures
        if (isl.name === 'central') buildTemple(isl, idx);
        if (isl.name === 'north') buildWatchtower(isl, idx);
        if (isl.name === 'east') buildRuins(isl, idx);
        if (isl.name === 'west') buildHangingGardens(isl, idx);
        if (isl.name === 'south') buildShrine(isl, idx);

        // Scatter vegetation
        scatterVegetation(isl, idx);
    }

    // ========================================================================
    //  CENTRAL TEMPLE — grand stepped pyramid with palace architecture
    // ========================================================================
    function buildTemple(isl, idx) {
        const { cx, cz, y: baseY } = isl;
        const py = baseY + 2;

        // Central plaza floor
        for (let x = -10; x <= 10; x++) {
            for (let z = -10; z <= 10; z++) {
                if (Math.max(Math.abs(x), Math.abs(z)) > 10) continue;
                const checker = ((x + z) & 1) ? pick(PAL.brick) : pick(PAL.stoneMed);
                world.add(cx + x, py - 1, cz + z, checker, { rough: 0.8 });
            }
        }

        // Stepped pyramid (4 tiers, each with ornate rim)
        for (let tier = 0; tier < 4; tier++) {
            const half = 8 - tier * 2;
            const ty = py + tier * 4;
            for (let x = -half; x <= half; x++) {
                for (let z = -half; z <= half; z++) {
                    // Solid platform
                    for (let y = 0; y < 3; y++) {
                        const edge = Math.abs(x) === half || Math.abs(z) === half;
                        if (edge || y < 2) {
                            const col = (y === 0 && edge) ? pick(PAL.gold) : pick(PAL.brick);
                            world.add(cx + x, ty + y, cz + z, col, { rough: 0.65, metal: y === 0 && edge ? 0.3 : 0 });
                        }
                    }
                    // Gold trim on top edge
                    if (Math.abs(x) === half || Math.abs(z) === half) {
                        world.add(cx + x, ty + 3, cz + z, pick(PAL.gold), { metal: 0.4, rough: 0.3 });
                    }
                }
            }
            // Corner pillars per tier
            const corners = [[-half, -half], [half, -half], [-half, half], [half, half]];
            corners.forEach(([ox, oz]) => {
                world.add(cx + ox, ty + 4, cz + oz, pick(PAL.gold), { metal: 0.5, rough: 0.3, sx: 1.2, sy: 1.5, sz: 1.2 });
            });
        }

        // Central spire / obelisk
        const spireBase = py + 16;
        for (let y = 0; y < 12; y++) {
            const w = y < 4 ? 2 : y < 8 ? 1 : 0;
            for (let x = -w; x <= w; x++) {
                for (let z = -w; z <= w; z++) {
                    const col = y < 8 ? pick(PAL.brick) : pick(PAL.gold);
                    world.add(cx + x, spireBase + y, cz + z, col, { rough: 0.5, metal: y >= 8 ? 0.5 : 0 });
                }
            }
        }
        // Glowing apex crystal
        world.add(cx, spireBase + 12, cz, '#FFD700', {
            emissive: '#FFD700', emissiveI: 2.0, metal: 0.6, rough: 0.2,
            sx: 1.4, sy: 2.0, sz: 1.4
        });
        const templeLight = new THREE.PointLight(0xFFD700, 15, 50, 2);
        templeLight.position.set(cx, spireBase + 13, cz);
        root.add(templeLight);

        // Flanking colonnade (6 pillars per side)
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 6; i++) {
                const pz = cz - 8 + i * 3;
                const px = cx + side * 9;
                for (let y = 0; y < 7; y++) {
                    world.add(px, py + y, pz, pick(PAL.brick), { rough: 0.6 });
                }
                // Pillar capital
                world.add(px, py + 7, pz, pick(PAL.gold), { metal: 0.3, rough: 0.4, sx: 1.4, sz: 1.4 });
            }
        }

        // Entrance stairway (south-facing)
        for (let step = 0; step < 5; step++) {
            for (let x = -3; x <= 3; x++) {
                world.add(cx + x, py - step - 1, cz + 10 + step, pick(PAL.stoneMed), { rough: 0.8 });
            }
        }
    }

    // ========================================================================
    //  NORTH WATCHTOWER — tall tower with observation deck & beacon
    // ========================================================================
    function buildWatchtower(isl, idx) {
        const { cx, cz, y: baseY } = isl;
        const py = baseY + 2;

        // Foundation platform
        for (let x = -5; x <= 5; x++) {
            for (let z = -5; z <= 5; z++) {
                world.add(cx + x, py - 1, cz + z, pick(PAL.stoneMed), { rough: 0.85 });
            }
        }

        // Tower body — circular-ish, tapers slightly
        for (let y = 0; y < 18; y++) {
            const radius = y < 12 ? 3 : y < 15 ? 2.5 : 2;
            for (let x = -4; x <= 4; x++) {
                for (let z = -4; z <= 4; z++) {
                    if (Math.hypot(x, z) > radius + 0.5) continue;
                    const edge = Math.hypot(x, z) > radius - 0.8;
                    if (edge) {
                        // Windows every few rows
                        const isWindow = y >= 4 && y <= 16 && y % 3 === 0 && (x === 0 || z === 0) && Math.abs(x) + Math.abs(z) > 2;
                        if (isWindow) {
                            world.add(cx + x, py + y, cz + z, '#2a1a0a', { emissive: '#ffa040', emissiveI: 0.4, rough: 0.3 });
                        } else {
                            world.add(cx + x, py + y, cz + z, pick(PAL.brick), { rough: 0.7 });
                        }
                    }
                }
            }
        }

        // Observation deck (wider platform at top)
        for (let x = -5; x <= 5; x++) {
            for (let z = -5; z <= 5; z++) {
                if (Math.hypot(x, z) > 5.5) continue;
                world.add(cx + x, py + 18, cz + z, pick(PAL.stoneMed), { rough: 0.75 });
                // Crenellations
                if (Math.hypot(x, z) > 4.2 && Math.hypot(x, z) <= 5.5) {
                    if ((Math.abs(x) + Math.abs(z)) % 3 === 0) {
                        world.add(cx + x, py + 19, cz + z, pick(PAL.stoneMed), { rough: 0.75 });
                        world.add(cx + x, py + 20, cz + z, pick(PAL.stoneDark), { rough: 0.8 });
                    }
                }
            }
        }

        // Beacon fire at top
        world.add(cx, py + 19, cz, '#FF6600', {
            emissive: '#FF4400', emissiveI: 2.5, rough: 0.3,
            sx: 1.5, sy: 2.0, sz: 1.5
        });
        const beaconLight = new THREE.PointLight(0xFF6600, 12, 45, 2);
        beaconLight.position.set(cx, py + 21, cz);
        root.add(beaconLight);

        // Spiral staircase carved into cliff (external)
        for (let i = 0; i < 20; i++) {
            const ang = (i / 20) * Math.PI * 2;
            const sx = cx + Math.round(Math.cos(ang) * 5);
            const sz = cz + Math.round(Math.sin(ang) * 5);
            const sy = baseY - 1 + Math.floor(i * 0.8);
            world.add(sx, sy, sz, pick(PAL.stoneMed), { rough: 0.85 });
            world.add(sx, sy, sz + 1, pick(PAL.stoneMed), { rough: 0.85 });
        }
    }

    // ========================================================================
    //  EAST RUINS — ancient crumbling temple with vine-covered pillars
    // ========================================================================
    function buildRuins(isl, idx) {
        const { cx, cz, y: baseY } = isl;
        const py = baseY + 1;

        // Broken mosaic floor
        for (let x = -8; x <= 8; x++) {
            for (let z = -7; z <= 7; z++) {
                if (Math.random() < 0.55) {
                    const col = Math.random() < 0.2 ? pick(PAL.gold) : pick(PAL.ruinStone);
                    world.add(cx + x, py, cz + z, col, { rough: 0.9, jitter: 0.06 });
                }
            }
        }

        // Crumbling pillars at varied heights
        const pillarPos = [
            [-6, -5], [6, -5], [-6, 5], [6, 5],
            [-3, -6], [3, -6], [-3, 6], [3, 6],
            [0, -7], [0, 7]
        ];
        pillarPos.forEach(([ox, oz]) => {
            const maxH = 3 + Math.floor(Math.random() * 7);
            for (let y = 0; y < maxH; y++) {
                world.add(cx + ox, py + y + 1, cz + oz, pick(PAL.ruinStone), { rough: 0.9, jitter: 0.08 });
                // Vine growth on some pillars
                if (Math.random() < 0.3 && y > 1) {
                    const vDir = Math.floor(Math.random() * 4);
                    const vx = vDir === 0 ? 1 : vDir === 1 ? -1 : 0;
                    const vz = vDir === 2 ? 1 : vDir === 3 ? -1 : 0;
                    world.add(cx + ox + vx, py + y + 1, cz + oz + vz, pick(PAL.vine), { rough: 0.95, sx: 0.5, sz: 0.5 });
                }
            }
            // Moss cap on some
            if (Math.random() < 0.6) {
                world.add(cx + ox, py + maxH + 1, cz + oz, pick(PAL.ruinMoss), { rough: 0.95, sx: 1.3, sz: 1.3 });
            }
        });

        // Fallen/broken archway
        for (let y = 0; y < 6; y++) {
            world.add(cx - 5, py + y + 1, cz, pick(PAL.ruinStone), { rough: 0.9, jitter: 0.05 });
            if (y < 5) world.add(cx + 5, py + y + 1, cz, pick(PAL.ruinStone), { rough: 0.9, jitter: 0.05 });
        }
        // Arch span (partially broken)
        for (let x = -5; x <= 3; x++) {
            world.add(cx + x, py + 7, cz, pick(PAL.ruinStone), { rough: 0.9 });
            if (Math.random() < 0.4) {
                world.add(cx + x, py + 6, cz, pick(PAL.vine), { rough: 0.95 });
            }
        }
        // Fallen blocks on ground
        for (let i = 0; i < 8; i++) {
            const fx = cx + 3 + Math.floor(Math.random() * 5);
            const fz = cz + Math.floor(Math.random() * 4) - 2;
            world.add(fx, py + 1, fz, pick(PAL.ruinStone), { rough: 0.9, jitter: 0.15, sx: 1.2, sy: 0.8, sz: 1.2 });
        }

        // Ancient rune-engraved slab (central altar)
        for (let x = -2; x <= 2; x++) {
            for (let z = -1; z <= 1; z++) {
                world.add(cx + x, py + 1, cz + z, pick(PAL.ruinStone), { rough: 0.7 });
            }
        }
        // Glowing rune
        world.add(cx, py + 2, cz, '#8B00FF', {
            emissive: '#8B00FF', emissiveI: 1.2, rough: 0.3,
            sx: 0.8, sy: 0.3, sz: 0.8
        });
        const runeLight = new THREE.PointLight(0x8B00FF, 5, 15, 2);
        runeLight.position.set(cx, py + 3, cz);
        root.add(runeLight);
    }

    // ========================================================================
    //  WEST HANGING GARDENS — tiered platforms with lush cascading greenery
    // ========================================================================
    function buildHangingGardens(isl, idx) {
        const { cx, cz, y: baseY } = isl;
        const py = baseY + 1;

        // 4 ascending garden terraces
        for (let tier = 0; tier < 4; tier++) {
            const half = 7 - tier * 1.5;
            const ty = py + tier * 3;
            const halfI = Math.floor(half);

            for (let x = -halfI; x <= halfI; x++) {
                for (let z = -halfI; z <= halfI; z++) {
                    // Stone retaining wall
                    world.add(cx + x, ty, cz + z, pick(PAL.stoneMed), { rough: 0.8 });
                    // Rich soil layer
                    world.add(cx + x, ty + 1, cz + z, pick(PAL.dirt), { rough: 0.95 });
                    // Lush grass with varied vegetation
                    const vegRoll = Math.random();
                    if (vegRoll < 0.5) {
                        world.add(cx + x, ty + 2, cz + z, pick(PAL.grassTop), { rough: 0.9, jitter: 0.05 });
                    } else if (vegRoll < 0.7) {
                        world.add(cx + x, ty + 2, cz + z, pick(PAL.vegetation), { rough: 0.9, jitter: 0.08 });
                    } else if (vegRoll < 0.82) {
                        // Flower
                        const flowers = ['#FF69B4', '#FFD700', '#9370DB', '#FF6347'];
                        world.add(cx + x, ty + 2, cz + z, flowers[Math.floor(Math.random() * flowers.length)], {
                            rough: 0.8, sx: 0.5, sy: 0.7, sz: 0.5, emissive: '#FFD700', emissiveI: 0.15
                        });
                    }
                }
            }

            // Cascading vines hanging off edges
            for (let x = -halfI; x <= halfI; x++) {
                for (let z = -halfI; z <= halfI; z++) {
                    const edge = Math.abs(x) === halfI || Math.abs(z) === halfI;
                    if (edge && Math.random() < 0.4) {
                        const vineLen = 3 + Math.floor(Math.random() * 5);
                        for (let v = 0; v < vineLen; v++) {
                            world.add(cx + x, ty - v - 1, cz + z, pick(PAL.vine), {
                                rough: 0.95, sx: 0.35, sz: 0.35, jitter: 0.08
                            });
                            // Occasional flower on vine
                            if (Math.random() < 0.15) {
                                world.add(cx + x, ty - v - 1, cz + z + (Math.random() < 0.5 ? 1 : -1) * 0.3, '#FF69B4', {
                                    sx: 0.3, sy: 0.3, sz: 0.3, emissive: '#FF69B4', emissiveI: 0.3
                                });
                            }
                        }
                    }
                }
            }
        }

        // Small waterfall/fountain at center
        for (let y = 0; y < 5; y++) {
            world.add(cx, py + y + 2, cz, pick(PAL.stoneMed), { rough: 0.7 });
        }
        world.add(cx, py + 7, cz, pick(PAL.water), { emissive: '#00FFFF', emissiveI: 0.5, rough: 0.2, sx: 1.5, sy: 0.5, sz: 1.5 });

        // Natural rock formations (dramatic outcrops)
        for (let i = 0; i < 6; i++) {
            const rx2 = cx + Math.floor((Math.random() - 0.5) * 14);
            const rz2 = cz + Math.floor((Math.random() - 0.5) * 12);
            const rh = 3 + Math.floor(Math.random() * 4);
            for (let y = 0; y < rh; y++) {
                world.add(rx2, py + y, rz2, pick(PAL.rock), { rough: 0.9, jitter: 0.2 });
                if (Math.random() < 0.4) world.add(rx2 + 1, py + y, rz2, pick(PAL.rock), { rough: 0.9, jitter: 0.15 });
            }
        }
    }

    // ========================================================================
    //  SOUTH SHRINE — floating stone shrine with observation point
    // ========================================================================
    function buildShrine(isl, idx) {
        const { cx, cz, y: baseY } = isl;
        const py = baseY + 1;

        // Raised circular platform
        for (let x = -5; x <= 5; x++) {
            for (let z = -5; z <= 5; z++) {
                if (Math.hypot(x, z) > 5.5) continue;
                world.add(cx + x, py, cz + z, pick(PAL.stoneMed), { rough: 0.8 });
                if (Math.hypot(x, z) > 4) {
                    world.add(cx + x, py + 1, cz + z, pick(PAL.stoneDark), { rough: 0.8 });
                }
            }
        }

        // Inner ring of smaller pillars
        for (let a = 0; a < 8; a++) {
            const ang = (a / 8) * Math.PI * 2;
            const px = cx + Math.round(Math.cos(ang) * 4);
            const pz = cz + Math.round(Math.sin(ang) * 4);
            for (let y = 1; y <= 5; y++) {
                world.add(px, py + y, pz, pick(PAL.stoneLight), { rough: 0.7, sx: 0.7, sz: 0.7 });
            }
            // Crystal tip
            world.add(px, py + 6, pz, pick(PAL.crystal), {
                emissive: '#00E5FF', emissiveI: 0.8, rough: 0.2, sx: 0.5, sy: 1.0, sz: 0.5
            });
        }

        // Central large crystal formation (the shrine's focal point)
        for (let y = 0; y < 4; y++) {
            world.add(cx, py + 2 + y, cz, '#00E5FF', {
                emissive: '#00E5FF', emissiveI: 1.8 - y * 0.3, rough: 0.15,
                sx: 1.8 - y * 0.3, sy: 1.5, sz: 1.8 - y * 0.3
            });
        }
        // Smaller surrounding crystals
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([ox, oz]) => {
            const ch = 2 + Math.floor(Math.random() * 2);
            for (let y = 0; y < ch; y++) {
                world.add(cx + ox, py + 2 + y, cz + oz, '#33EEFF', {
                    emissive: '#00E5FF', emissiveI: 1.0, rough: 0.2,
                    sx: 0.6, sy: 1.2, sz: 0.6
                });
            }
        });

        const shrineLight = new THREE.PointLight(0x00E5FF, 18, 35, 2);
        shrineLight.position.set(cx, py + 7, cz);
        root.add(shrineLight);
    }

    // ========================================================================
    //  CRYSTAL BRIDGES — luminescent arced connections between islands
    // ========================================================================
    const bridgePairs = [
        [0, 1], // central -> north
        [0, 2], // central -> east
        [0, 3], // central -> west
        [0, 4], // central -> south
    ];

    const bridgeLights = [];

    bridgePairs.forEach(([a, b]) => {
        const ia = islands[a], ib = islands[b];
        // Start/end at island edges rather than centers
        const dirX = ib.cx - ia.cx, dirZ = ib.cz - ia.cz;
        const len = Math.hypot(dirX, dirZ);
        const nx = dirX / len, nz = dirZ / len;

        const startX = ia.cx + nx * ia.rx * 0.8;
        const startZ = ia.cz + nz * ia.rz * 0.8;
        const startY = ia.y + 2;
        const endX = ib.cx - nx * ib.rx * 0.8;
        const endZ = ib.cz - nz * ib.rz * 0.8;
        const endY = ib.y + 2;

        const steps = Math.ceil(Math.hypot(endX - startX, endZ - startZ) / 1.8);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.round(THREE.MathUtils.lerp(startX, endX, t));
            const z = Math.round(THREE.MathUtils.lerp(startZ, endZ, t));
            const arc = Math.sin(t * Math.PI) * 8;
            const y = Math.round(THREE.MathUtils.lerp(startY, endY, t) + arc);

            // Bridge deck (wider, 3 voxels)
            for (let w = -1; w <= 1; w++) {
                const perpX = Math.round(-nz * w);
                const perpZ = Math.round(nx * w);
                world.add(x + perpX, y, z + perpZ, pick(PAL.crystal), {
                    emissive: '#00E5FF', emissiveI: 0.5, rough: 0.2, metal: 0.1,
                    sy: 0.5
                });
            }

            // Railing posts every 4 steps
            if (i % 4 === 0 && i > 0 && i < steps) {
                for (let ry = 1; ry <= 2; ry++) {
                    const perpX1 = Math.round(-nz * 1.5);
                    const perpZ1 = Math.round(nx * 1.5);
                    world.add(x + perpX1, y + ry, z + perpZ1, pick(PAL.crystal), {
                        emissive: '#00E5FF', emissiveI: 0.4, rough: 0.25, sx: 0.35, sz: 0.35
                    });
                    world.add(x - perpX1, y + ry, z - perpZ1, pick(PAL.crystal), {
                        emissive: '#00E5FF', emissiveI: 0.4, rough: 0.25, sx: 0.35, sz: 0.35
                    });
                }
            }

            // Rune markings on bridge edges (every 6 steps)
            if (i % 6 === 0 && i > 0 && i < steps) {
                world.add(x, y + 0.5, z, '#8800FF', {
                    emissive: '#8800FF', emissiveI: 0.6, rough: 0.2, sx: 0.3, sy: 0.15, sz: 0.3
                });
            }
        }

        // Light at bridge midpoint
        const midX = (startX + endX) / 2;
        const midZ = (startZ + endZ) / 2;
        const midY = (startY + endY) / 2 + 8;
        const bl = new THREE.PointLight(0x00E5FF, 6, 30, 2);
        bl.position.set(midX, midY, midZ);
        root.add(bl);
        bridgeLights.push(bl);
    });

    // ========================================================================
    //  VEGETATION — trees, shrubs, crystalline grass, floating moss
    // ========================================================================
    function scatterVegetation(isl, idx) {
        const { cx, cz, y: baseY, rx, rz } = isl;

        // Trees (different per island character)
        const treeCount = isl.name === 'west' ? 4 : isl.name === 'south' ? 1 : 5;
        for (let i = 0; i < treeCount; i++) {
            const lx = Math.floor((Math.random() * 2 - 1) * (rx - 4));
            const lz = Math.floor((Math.random() * 2 - 1) * (rz - 4));
            const key = `${idx}:${lx},${lz}`;
            if (!surfaceData.has(key)) continue;
            const sy = surfaceData.get(key);
            // Don't place near center structures
            if (Math.hypot(lx, lz) < 6) continue;

            const trunkH = 4 + Math.floor(Math.random() * 4);
            for (let y = 0; y < trunkH; y++) {
                world.add(cx + lx, sy + 1 + y, cz + lz, pick(PAL.dirt), { rough: 0.95, jitter: 0.05 });
            }
            // Canopy (spherical blob)
            const canR = 2 + Math.floor(Math.random() * 2);
            const canY = sy + 1 + trunkH;
            for (let bx = -canR; bx <= canR; bx++) {
                for (let by = -canR; by <= canR; by++) {
                    for (let bz = -canR; bz <= canR; bz++) {
                        if (Math.sqrt(bx * bx + by * by * 1.2 + bz * bz) <= canR + Math.random() * 0.4) {
                            if (Math.random() < 0.8) {
                                world.add(cx + lx + bx, canY + by, cz + lz + bz, pick(PAL.vegetation), { jitter: 0.15, rough: 0.92 });
                            }
                        }
                    }
                }
            }
        }

        // Crystalline grass tufts
        for (let i = 0; i < 40; i++) {
            const lx = Math.floor((Math.random() * 2 - 1) * rx);
            const lz = Math.floor((Math.random() * 2 - 1) * rz);
            const key = `${idx}:${lx},${lz}`;
            if (!surfaceData.has(key)) continue;
            const sy = surfaceData.get(key);
            if (Math.random() < 0.15) {
                // Small crystal shard
                world.add(cx + lx, sy + 1, cz + lz, pick(PAL.crystal), {
                    sx: 0.25, sy: 0.8, sz: 0.25, emissive: '#00E5FF', emissiveI: 0.3
                });
            } else {
                world.add(cx + lx, sy + 1, cz + lz, pick(PAL.grass), {
                    sx: 0.3, sy: 0.5 + Math.random() * 0.4, sz: 0.3, jitter: 0.1, rough: 0.9
                });
            }
        }

        // Floating moss patches
        if (isl.name !== 'south') {
            for (let i = 0; i < 6; i++) {
                const lx = Math.floor((Math.random() - 0.5) * rx * 1.5);
                const lz = Math.floor((Math.random() - 0.5) * rz * 1.5);
                const fy = baseY + 4 + Math.floor(Math.random() * 5);
                world.add(cx + lx, fy, cz + lz, pick(PAL.mossDark), {
                    sx: 1.2 + Math.random(), sy: 0.25, sz: 1.2 + Math.random(), rough: 0.95, jitter: 0.08
                });
            }
        }
    }

    // Commit all voxels to GPU
    world.commit(root);

    return { bridgeLights, islands };
}
