import * as THREE from '../vendor/three.module.js';
import { PALETTE, pick } from './palette.js';

// ---------------------------------------------------------------------------
//  SCENE BUILDER — seabed dunes, coral formations, kelp forest,
//  sunken temple ruins, sponges, shells and bioluminescent accents.
// ---------------------------------------------------------------------------
export function buildScene({ world, root }) {

    const REEF_RADIUS = 40;
    const bioLights = [];
    const kelpAnchors = [];
    const surfaceAt = new Map();

    const key = (x, z) => `${x},${z}`;

    // ========================================================================
    //  SEABED — rippled sand dunes
    // ========================================================================
    for (let x = -REEF_RADIUS; x <= REEF_RADIUS; x++) {
        for (let z = -REEF_RADIUS; z <= REEF_RADIUS; z++) {
            if (Math.hypot(x, z) > REEF_RADIUS) continue;

            // Dune ripples from layered sine waves
            const ripple =
                Math.sin(x * 0.35) * 1.2 +
                Math.cos(z * 0.28) * 1.0 +
                Math.sin((x + z) * 0.15) * 0.8;
            const top = Math.round(ripple);

            surfaceAt.set(key(x, z), top);

            world.add(x, top, z, pick(PALETTE.sand), { rough: 1.0, jitter: 0.06 });
            for (let d = 1; d <= 3; d++) {
                world.add(x, top - d, z, pick(d < 2 ? PALETTE.sand : PALETTE.sandDark), { rough: 1.0 });
            }
        }
    }

    function groundY(x, z) {
        const v = surfaceAt.get(key(Math.round(x), Math.round(z)));
        return v === undefined ? 0 : v;
    }

    // ========================================================================
    //  ROCK OUTCROPS — dark anchors for coral to grow on
    // ========================================================================
    const outcrops = [
        { x: 16, z: 12 }, { x: -18, z: 9 }, { x: 6, z: -20 },
        { x: -12, z: -16 }, { x: 24, z: -6 }, { x: -26, z: -4 },
        { x: 10, z: 24 }, { x: -8, z: 26 },
    ];

    for (const o of outcrops) {
        const h = 3 + Math.floor(Math.random() * 4);
        const r = 2 + Math.floor(Math.random() * 2);
        const base = groundY(o.x, o.z);
        for (let y = 0; y < h; y++) {
            const rr = Math.max(0, r - Math.floor(y / 2));
            for (let dx = -rr; dx <= rr; dx++) {
                for (let dz = -rr; dz <= rr; dz++) {
                    if (dx * dx + dz * dz > rr * rr + 1) continue;
                    world.add(o.x + dx, base + y, o.z + dz, pick(PALETTE.rock), {
                        rough: 0.9, jitter: 0.12
                    });
                }
            }
        }
        o.topY = base + h;
    }

    // ========================================================================
    //  CORAL FORMATIONS
    // ========================================================================

    // Branching coral — recursive arms
    function branchCoral(cx, cy, cz, palette, len, dirX, dirZ, depth) {
        if (depth <= 0) return;
        let x = cx, y = cy, z = cz;
        for (let i = 0; i < len; i++) {
            x += dirX; z += dirZ; y += 1;
            world.add(Math.round(x), Math.round(y), Math.round(z), pick(palette), {
                rough: 0.75, jitter: 0.15, sx: 0.85, sz: 0.85
            });
            if (i === len - 1 || (i > 1 && Math.random() < 0.35)) {
                branchCoral(x, y, z, palette,
                    Math.max(2, len - 2),
                    (Math.random() - 0.5) * 1.1,
                    (Math.random() - 0.5) * 1.1,
                    depth - 1);
            }
        }
    }

    // Brain coral — hemispherical mound
    function brainCoral(cx, cz, radius, palette) {
        const base = groundY(cx, cz);
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const d = Math.hypot(dx, dz);
                if (d > radius) continue;
                const h = Math.round(Math.cos((d / radius) * Math.PI * 0.5) * radius * 0.85);
                for (let y = 0; y <= h; y++) {
                    // Grooved surface pattern
                    const groove = Math.sin(dx * 1.1) + Math.cos(dz * 1.1) > 1.2;
                    world.add(cx + dx, base + y, cz + dz,
                        groove ? pick(PALETTE.coralRed) : pick(palette),
                        { rough: 0.85, jitter: 0.05 });
                }
            }
        }
    }

    // Fan coral — flat vertical blade
    function fanCoral(cx, cz, w, h, palette, axis) {
        const base = groundY(cx, cz);
        for (let a = -Math.floor(w / 2); a <= Math.floor(w / 2); a++) {
            const colH = Math.round(h * Math.cos((a / (w / 2)) * Math.PI * 0.42));
            for (let y = 0; y < colH; y++) {
                if (Math.random() < 0.18) continue; // lacy holes
                const px = axis === 'x' ? cx + a : cx;
                const pz = axis === 'x' ? cz : cz + a;
                world.add(px, base + 1 + y, pz, pick(palette), {
                    rough: 0.7, jitter: 0.1,
                    sx: axis === 'x' ? 1 : 0.35,
                    sz: axis === 'x' ? 0.35 : 1,
                });
            }
        }
    }

    // Tube coral cluster — vertical pipes
    function tubeCoral(cx, cz, count, palette) {
        for (let i = 0; i < count; i++) {
            const ox = cx + Math.floor((Math.random() - 0.5) * 5);
            const oz = cz + Math.floor((Math.random() - 0.5) * 5);
            const base = groundY(ox, oz);
            const h = 3 + Math.floor(Math.random() * 5);
            for (let y = 0; y < h; y++) {
                world.add(ox, base + 1 + y, oz, pick(palette), {
                    rough: 0.8, sx: 0.7, sz: 0.7, jitter: 0.05
                });
            }
            // Bright rim at the mouth
            world.add(ox, base + 1 + h, oz, PALETTE.bioCyan, {
                emissive: PALETTE.bioCyan, emissiveI: 1.4, rough: 0.3, sx: 0.8, sy: 0.4, sz: 0.8
            });
        }
    }

    const coralPalettes = [
        PALETTE.coralPink, PALETTE.coralOrange, PALETTE.coralTeal,
        PALETTE.coralPurple, PALETTE.coralViolet,
    ];

    // Branching coral on/near outcrops
    for (const o of outcrops) {
        const p = coralPalettes[Math.floor(Math.random() * coralPalettes.length)];
        branchCoral(o.x, o.topY, o.z, p, 4 + Math.floor(Math.random() * 3),
            (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, 3);
    }

    brainCoral(-6, 6, 5, PALETTE.coralOrange);
    brainCoral(20, 18, 4, PALETTE.coralPink);
    brainCoral(-22, -14, 4, PALETTE.coralPurple);
    brainCoral(14, -14, 3, PALETTE.coralTeal);

    fanCoral(-16, 20, 9, 8, PALETTE.coralPink, 'x');
    fanCoral(26, 4, 8, 7, PALETTE.coralViolet, 'z');
    fanCoral(2, 30, 10, 9, PALETTE.coralTeal, 'x');
    fanCoral(-30, 6, 8, 7, PALETTE.coralOrange, 'z');

    tubeCoral(8, 14, 6, PALETTE.coralTeal);
    tubeCoral(-14, -6, 5, PALETTE.coralPurple);
    tubeCoral(22, -18, 6, PALETTE.coralPink);

    // ========================================================================
    //  BIOLUMINESCENT CLUSTERS — glowing pods with point lights
    // ========================================================================
    const bioSpots = [
        { x: -10, z: 14, color: PALETTE.bioGreen },
        { x: 18, z: -2, color: PALETTE.bioCyan },
        { x: -24, z: -10, color: PALETTE.bioBlue },
        { x: 4, z: -26, color: PALETTE.bioGreen },
        { x: 28, z: 20, color: PALETTE.bioCyan },
    ];

    for (const s of bioSpots) {
        const base = groundY(s.x, s.z);
        const pods = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < pods; i++) {
            const ox = s.x + Math.floor((Math.random() - 0.5) * 6);
            const oz = s.z + Math.floor((Math.random() - 0.5) * 6);
            const oy = base + 1 + Math.floor(Math.random() * 4);
            const sc = 0.5 + Math.random() * 0.5;
            world.add(ox, oy, oz, s.color, {
                emissive: s.color, emissiveI: 2.6, rough: 0.2,
                sx: sc, sy: sc, sz: sc, jitter: 0.2
            });
        }
        const light = new THREE.PointLight(new THREE.Color(s.color), 9, 30, 2);
        light.position.set(s.x, base + 4, s.z);
        root.add(light);
        bioLights.push({ light, baseIntensity: 9, phase: Math.random() * Math.PI * 2 });
    }

    // ========================================================================
    //  KELP FOREST — anchors animated by effects.js
    // ========================================================================
    const kelpClusters = [
        { x: -34, z: -20 }, { x: -30, z: 22 }, { x: 32, z: -24 },
        { x: 34, z: 14 }, { x: -4, z: -34 }, { x: 12, z: 34 },
    ];

    for (const c of kelpClusters) {
        const stalks = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < stalks; i++) {
            const ox = c.x + Math.floor((Math.random() - 0.5) * 8);
            const oz = c.z + Math.floor((Math.random() - 0.5) * 8);
            if (Math.hypot(ox, oz) > REEF_RADIUS - 1) continue;
            kelpAnchors.push({
                x: ox,
                y: groundY(ox, oz) + 1,
                z: oz,
                height: 10 + Math.floor(Math.random() * 9),
                phase: Math.random() * Math.PI * 2,
                sway: 0.5 + Math.random() * 0.6,
            });
        }
    }

    // ========================================================================
    //  SUNKEN TEMPLE RUINS — broken colonnade + altar
    // ========================================================================
    const tX = 0, tZ = 0;
    const tBase = groundY(tX, tZ);

    // Cracked stone platform
    for (let dx = -9; dx <= 9; dx++) {
        for (let dz = -9; dz <= 9; dz++) {
            if (Math.max(Math.abs(dx), Math.abs(dz)) > 9) continue;
            if (Math.random() < 0.12) continue; // missing slabs
            const mossy = Math.random() < 0.28;
            world.add(tX + dx, tBase + 1, tZ + dz,
                mossy ? PALETTE.stoneMoss : pick(PALETTE.stone),
                { rough: 0.95, jitter: 0.04 });
        }
    }

    // Broken pillars at varying heights
    const pillars = [
        [-7, -7], [7, -7], [-7, 7], [7, 7],
        [0, -8], [0, 8], [-8, 0], [8, 0],
    ];
    for (const [px, pz] of pillars) {
        const h = 3 + Math.floor(Math.random() * 7);
        for (let y = 0; y < h; y++) {
            world.add(tX + px, tBase + 2 + y, tZ + pz, pick(PALETTE.stone), {
                rough: 0.92, jitter: 0.07
            });
            if (Math.random() < 0.25) {
                world.add(tX + px, tBase + 2 + y, tZ + pz, PALETTE.stoneMoss, {
                    rough: 1.0, sx: 1.06, sy: 0.3, sz: 1.06
                });
            }
        }
        // Coral colonising the pillar top
        if (Math.random() < 0.6) {
            world.add(tX + px, tBase + 2 + h, tZ + pz,
                pick(coralPalettes[Math.floor(Math.random() * coralPalettes.length)]),
                { rough: 0.75, sx: 1.2, sy: 0.8, sz: 1.2, jitter: 0.1 });
        }
    }

    // Fallen blocks scattered around
    for (let i = 0; i < 14; i++) {
        const fx = tX + Math.floor((Math.random() - 0.5) * 22);
        const fz = tZ + Math.floor((Math.random() - 0.5) * 22);
        world.add(fx, groundY(fx, fz) + 1, fz, pick(PALETTE.stone), {
            rough: 0.95, jitter: 0.2, sx: 1.2, sy: 0.7, sz: 1.2
        });
    }

    // Central altar with treasure chest
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            world.add(tX + dx, tBase + 2, tZ + dz, pick(PALETTE.stone), { rough: 0.85 });
        }
    }
    world.box(tX - 1, tBase + 3, tZ - 1, 3, 2, 3, PALETTE.goldDark, {
        rough: 0.35, metal: 0.7
    });
    world.add(tX, tBase + 5, tZ, PALETTE.gold, {
        emissive: PALETTE.gold, emissiveI: 0.9, rough: 0.2, metal: 0.8,
        sx: 1.6, sy: 0.5, sz: 1.6
    });
    const treasureLight = new THREE.PointLight(new THREE.Color(PALETTE.gold), 5, 20, 2);
    treasureLight.position.set(tX, tBase + 6, tZ);
    root.add(treasureLight);
    bioLights.push({ light: treasureLight, baseIntensity: 5, phase: 1.2 });

    // ========================================================================
    //  SPONGES, SHELLS & STARFISH — small scatter details
    // ========================================================================
    const spongeColors = [PALETTE.spongeYellow, PALETTE.spongeViolet, PALETTE.spongeOrange];
    for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * (REEF_RADIUS - 10);
        const sx = Math.round(Math.cos(a) * r);
        const sz = Math.round(Math.sin(a) * r);
        const base = groundY(sx, sz);
        const h = 1 + Math.floor(Math.random() * 3);
        const col = spongeColors[Math.floor(Math.random() * spongeColors.length)];
        for (let y = 0; y < h; y++) {
            world.add(sx, base + 1 + y, sz, col, {
                rough: 0.9, jitter: 0.1, sx: 0.9, sz: 0.9
            });
        }
    }

    for (let i = 0; i < 50; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 5 + Math.random() * (REEF_RADIUS - 7);
        const sx = Math.round(Math.cos(a) * r);
        const sz = Math.round(Math.sin(a) * r);
        const base = groundY(sx, sz);
        if (Math.random() < 0.3) {
            world.add(sx, base + 1, sz, PALETTE.starfish, {
                rough: 0.9, sx: 1.1, sy: 0.25, sz: 1.1
            });
        } else {
            world.add(sx, base + 1, sz, pick(PALETTE.shell), {
                rough: 0.6, sx: 0.7, sy: 0.35, sz: 0.7, jitter: 0.15
            });
        }
    }

    // Sea grass tufts
    for (let i = 0; i < 120; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * REEF_RADIUS;
        const sx = Math.round(Math.cos(a) * r);
        const sz = Math.round(Math.sin(a) * r);
        if (Math.hypot(sx, sz) > REEF_RADIUS) continue;
        const base = groundY(sx, sz);
        const h = 1 + Math.floor(Math.random() * 3);
        for (let y = 0; y < h; y++) {
            world.add(sx, base + 1 + y, sz, pick(PALETTE.kelp), {
                rough: 0.95, sx: 0.28, sz: 0.28, jitter: 0.12
            });
        }
    }

    // ========================================================================
    //  OCTOPUSES — bulbous head + 8 curling tentacles
    // ========================================================================
    const octopusSpots = [
        { x: -20, z: -26, color: '#c026ff' },
        { x: 26, z: 22, color: '#ff2d78' },
        { x: -30, z: 16, color: '#ff7b00' },
    ];

    for (const oc of octopusSpots) {
        const base = groundY(oc.x, oc.z) + 1;

        // Head (small dome)
        for (let dy = 0; dy < 3; dy++) {
            const r = dy < 2 ? 1 : 0;
            for (let dx = -r; dx <= r; dx++) {
                for (let dz = -r; dz <= r; dz++) {
                    if (dx * dx + dz * dz > r * r) continue;
                    world.add(oc.x + dx, base + 2 + dy, oc.z + dz, oc.color, {
                        rough: 0.7, jitter: 0.08, sx: 0.8, sy: 0.8, sz: 0.8
                    });
                }
            }
        }

        // Eyes
        world.add(oc.x, base + 3, oc.z + 1, '#ffffff', { rough: 0.3, sx: 0.3, sy: 0.3, sz: 0.3 });
        world.add(oc.x, base + 3, oc.z + 1, '#111111', { rough: 0.2, sx: 0.15, sy: 0.15, sz: 0.2 });

        // Tentacles — 8 short arms
        for (let t = 0; t < 8; t++) {
            const ang = (t / 8) * Math.PI * 2;
            let tx = oc.x, tz = oc.z, ty = base + 1;
            const dirX = Math.cos(ang), dirZ = Math.sin(ang);
            const len = 3 + Math.floor(Math.random() * 2);
            for (let seg = 0; seg < len; seg++) {
                tx += dirX * 0.7;
                tz += dirZ * 0.7;
                ty -= 0.25;
                const curl = seg > len - 2 ? 0.2 : 0;
                world.add(
                    Math.round(tx - curl * dirX),
                    Math.round(ty),
                    Math.round(tz - curl * dirZ),
                    oc.color,
                    { rough: 0.75, sx: 0.4 - seg * 0.04, sy: 0.35, sz: 0.4 - seg * 0.04, jitter: 0.08 }
                );
            }
        }
    }

    // ========================================================================
    //  SHIPWRECK — half a hull tilted into the sand
    // ========================================================================
    const shipX = -14, shipZ = -30;
    const shipBase = groundY(shipX, shipZ);
    const hullColor = '#5c3a1e';
    const hullDark = '#3e2410';
    const hullLength = 18;
    const hullHeight = 10;
    const hullWidth = 6;

    // The hull is a tapered box tilted ~15° (we fake the tilt by shifting rows)
    for (let seg = 0; seg < hullLength; seg++) {
        const t01 = seg / (hullLength - 1);
        // Taper: narrow at the bow (seg=0), full width amidships, broken at stern
        const halfW = Math.round(hullWidth * 0.5 * Math.sin(t01 * Math.PI * 0.75));
        // Tilt: stern buried deeper, bow higher
        const tiltY = Math.round(seg * 0.45);

        for (let y = 0; y < hullHeight; y++) {
            // Only build the outer shell (walls of the hull)
            for (let w = -halfW; w <= halfW; w++) {
                const isWall = Math.abs(w) === halfW || y === 0;
                // Broken stern: top rows missing past 75% of length
                if (seg > hullLength * 0.75 && y > hullHeight * 0.5) continue;
                // Random holes for a wreck look
                if (y > 2 && Math.random() < 0.08) continue;
                if (!isWall && y !== 0) continue;

                const col = (y === 0 || Math.random() < 0.3) ? hullDark : hullColor;
                world.add(
                    shipX + seg,
                    shipBase + y + tiltY,
                    shipZ + w,
                    col,
                    { rough: 0.95, jitter: 0.06 }
                );
            }
        }

        // Deck planks (flat top every few segments)
        if (seg % 2 === 0 && seg < hullLength * 0.75) {
            for (let w = -halfW + 1; w < halfW; w++) {
                world.add(shipX + seg, shipBase + hullHeight + tiltY, shipZ + w, hullColor, {
                    rough: 0.95, sy: 0.35, jitter: 0.04
                });
            }
        }
    }

    // Mast stump — broken halfway
    const mastSeg = Math.round(hullLength * 0.4);
    const mastBase = shipBase + hullHeight + Math.round(mastSeg * 0.45);
    for (let y = 0; y < 8; y++) {
        world.add(shipX + mastSeg, mastBase + y, shipZ, '#4a3520', {
            rough: 0.9, sx: 0.7, sz: 0.7
        });
    }

    // Barnacles / coral colonisation on the hull
    for (let i = 0; i < 20; i++) {
        const seg = Math.floor(Math.random() * hullLength);
        const t01 = seg / (hullLength - 1);
        const halfW = Math.round(hullWidth * 0.5 * Math.sin(t01 * Math.PI * 0.75));
        const side = Math.random() < 0.5 ? -halfW : halfW;
        const y = Math.floor(Math.random() * 5);
        const tiltY = Math.round(seg * 0.45);
        const col = Math.random() < 0.5
            ? pick(coralPalettes[Math.floor(Math.random() * coralPalettes.length)])
            : pick(PALETTE.kelp);
        world.add(shipX + seg, shipBase + y + tiltY, shipZ + side, col, {
            rough: 0.8, jitter: 0.15, sx: 0.7, sy: 0.7, sz: 0.7
        });
    }

    world.commit(root);

    return { bioLights, kelpAnchors, reefRadius: REEF_RADIUS, groundY };
}
