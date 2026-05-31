import * as THREE from '../vendor/three.module.js';
import { PAL, pick } from './palette.js';

// ---------------------------------------------------------------------------
//  SCENE BUILDER - builds the entire static voxel world (terrain, koi pond,
//  stone path, plaza, the five-tier pagoda, trees, lanterns and props) and
//  commits it to the GPU. Returns handles the render loop needs.
// ---------------------------------------------------------------------------
export function buildScene({ scene, world, root }) {
  //  TERRAIN — floating island
  //  Coordinate convention: island centered at (0,0,0). Grass surface at y=0.
  //  We work in a grid of radius R; height map gives gentle rolling hills.
  // ---------------------------------------------------------------------------
  const R = 34;                 // island radius (voxels)
  const heightAt = (x, z) => {
    // smooth rolling hills via layered sin; flattened near center for the plaza
    const d = Math.hypot(x, z);
    let h = Math.sin(x * 0.18) * 1.3 + Math.cos(z * 0.16) * 1.2
      + Math.sin((x + z) * 0.09) * 1.6;
    h += Math.sin(x * 0.05 + z * 0.07) * 1.2;
    // flatten central plaza
    const flat = THREE.MathUtils.clamp(1 - d / 11, 0, 1);
    h *= (1 - flat * 0.85);
    return Math.round(h);
  };

  // island shape: roughly circular with a wavy coastline
  const islandMask = (x, z) => {
    const ang = Math.atan2(z, x);
    const wob = Math.sin(ang * 3) * 2.4 + Math.cos(ang * 5 + 1.3) * 1.8 + Math.sin(ang * 7) * 1.0;
    return Math.hypot(x, z) <= R + wob;
  };

  const surfaceY = {}; // key "x,z" -> top grass y (for placing props)
  for (let x = -R - 4; x <= R + 4; x++) {
    for (let z = -R - 4; z <= R + 4; z++) {
      if (!islandMask(x, z)) continue;
      const top = heightAt(x, z);
      surfaceY[x + ',' + z] = top;

      const d = Math.hypot(x, z);
      const edge = d > R - 3;

      // grass surface
      const isBeach = false;
      world.add(x, top, z, pick(PAL.grassTop), { jitter: 0.04 });
      // a thin darker grass under-edge for definition
      world.add(x, top - 1, z, pick(PAL.grassDark));

      // dirt strata
      const dirtDepth = 3 + ((Math.sin(x * 0.3 + z * 0.2) * 1.5) | 0);
      for (let y = 2; y <= dirtDepth + 2; y++) {
        world.add(x, top - y, z, pick(PAL.dirt));
      }

      // rocky underside tapering toward a point (floating island look)
      const under = top - dirtDepth - 2;
      const taper = Math.max(0, (R - d) * 0.55 + 4); // deeper in the middle
      for (let y = 1; y <= taper; y++) {
        const yy = under - y;
        // shrink footprint as we go down -> pointed bottom
        const shrink = y * 0.9;
        if (d <= (R + 2) - shrink) {
          const col = (y % 5 === 0) ? pick(PAL.dirt) : pick(PAL.rock);
          world.add(x, yy, z, col, { jitter: y > 4 ? 0.18 : 0 });
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  //  KOI POND — a depression filled with translucent-looking water + sandy bed
  // ---------------------------------------------------------------------------
  const pond = { cx: -14, cz: 12, rx: 9, rz: 7 };
  function inPond(x, z) {
    const dx = (x - pond.cx) / pond.rx;
    const dz = (z - pond.cz) / pond.rz;
    return dx * dx + dz * dz <= 1;
  }
  const waterTopY = -1; // water surface sits just below grass level
  for (let x = pond.cx - pond.rx - 1; x <= pond.cx + pond.rx + 1; x++) {
    for (let z = pond.cz - pond.rz - 1; z <= pond.cz + pond.rz + 1; z++) {
      if (!inPond(x, z)) continue;
      const dx = (x - pond.cx) / pond.rx;
      const dz = (z - pond.cz) / pond.rz;
      const depth = 1 - (dx * dx + dz * dz); // 0..1 deepest in middle
      const bed = waterTopY - 1 - Math.round(depth * 3);
      // sandy / muddy bed
      world.add(x, bed, z, pick(PAL.sand));
      // water column (slightly transparent look via lighter top)
      for (let y = bed + 1; y <= waterTopY; y++) {
        const col = (y === waterTopY) ? pick(PAL.water) : pick(PAL.waterDeep);
        world.add(x, y, z, col, { rough: 0.25, metal: 0.0 });
      }
    }
  }
  // mark pond cells so we don't plant on them
  function isWater(x, z) { return inPond(x, z); }

  // stone rim around the pond
  for (let a = 0; a < Math.PI * 2; a += 0.18) {
    const x = Math.round(pond.cx + Math.cos(a) * (pond.rx + 0.6));
    const z = Math.round(pond.cz + Math.sin(a) * (pond.rz + 0.6));
    const key = x + ',' + z;
    if (key in surfaceY && !isWater(x, z)) {
      world.add(x, surfaceY[key] + 1, z, pick(PAL.stone), { rough: 0.85, jitter: 0.05 });
    }
  }

  // a few koi fish (small bright voxels just under the surface)
  const koiColors = ['#ff7a3c', '#ffffff', '#ffb13c', '#e8503a'];
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.random() * 0.7;
    const x = Math.round(pond.cx + Math.cos(a) * pond.rx * rr);
    const z = Math.round(pond.cz + Math.sin(a) * pond.rz * rr);
    if (!isWater(x, z)) continue;
    const c = koiColors[(Math.random() * koiColors.length) | 0];
    world.add(x, waterTopY, z, c, { sx: 1.4, sy: 0.4, sz: 0.8, rough: 0.4, emissive: c, emissiveI: 0.15 });
  }

  // ---------------------------------------------------------------------------
  //  STONE PATH — a gently curving walkway from the south edge to the plaza
  // ---------------------------------------------------------------------------
  const pathCells = new Set();
  function layStone(x, z, w = 2) {
    for (let ox = -w; ox <= w; ox++) {
      for (let oz = -1; oz <= 1; oz++) {
        const px = Math.round(x) + ox;
        const pz = Math.round(z) + oz;
        const key = px + ',' + pz;
        if (!(key in surfaceY) || isWater(px, pz)) continue;
        if (pathCells.has(key)) continue;
        pathCells.add(key);
        world.add(px, surfaceY[key], pz, pick(PAL.stone), { rough: 0.9, jitter: 0.05, sy: 0.95 });
      }
    }
  }
  for (let t = 0; t <= 1; t += 0.012) {
    // bezier-ish curve from south edge (0, R) to plaza (0,5)
    const z = THREE.MathUtils.lerp(R - 1, 5, t);
    const x = Math.sin(t * Math.PI * 1.4) * 9 * (1 - t) - t * 1.5;
    const w = t > 0.85 ? 3 : 2;       // widen near plaza
    layStone(x, z, w);
  }

  // ---------------------------------------------------------------------------
  //  PLAZA base under the pagoda — raised stone platform with steps
  // ---------------------------------------------------------------------------
  const baseY = 1; // plaza top sits at y=1 (one above grass)
  function plazaTile(x, z, y, col) {
    world.add(x, y, z, col, { rough: 0.8, jitter: 0.03 });
  }
  for (let x = -9; x <= 9; x++) {
    for (let z = -9; z <= 9; z++) {
      if (Math.max(Math.abs(x), Math.abs(z)) > 9) continue;
      const ring = Math.max(Math.abs(x), Math.abs(z));
      // tiered platform: outer at y=1, inner higher at y=2
      const col = ((x + z) & 1) ? pick(PAL.stone) : pick(PAL.sand);
      plazaTile(x, baseY, z, col);
      if (ring <= 7) plazaTile(x, baseY + 1, z, ((x + z) & 1) ? pick(PAL.stone) : '#cdd2d8');
    }
  }
  // steps on the south side leading up to the platform
  for (let s = 0; s < 3; s++) {
    for (let x = -3; x <= 3; x++) {
      plazaTile(x, baseY - s, 9 + s + 1, pick(PAL.stone));
    }
  }

  // ---------------------------------------------------------------------------
  //  THE PAGODA — five tiers, vermillion pillars, teal roofs w/ gold upturned eaves
  // ---------------------------------------------------------------------------
  const PCX = 0, PCZ = 0;          // pagoda center (grid)
  const groundTop = baseY + 2;     // y where the pagoda body starts (on inner plaza)

  // Build one curved, layered roof centered at (cx,cz), covering half-width `half`.
  // The roof rises from base y0 and steps inward, with upturned corners + gold rim.
  function buildRoof(cx, cz, half, y0) {
    const layers = half + 1;
    for (let L = 0; L <= layers; L++) {
      const hw = half - L + 1;            // half-width shrinks each layer
      if (hw < 0) break;
      const y = y0 + L;
      for (let x = -hw; x <= hw; x++) {
        for (let z = -hw; z <= hw; z++) {
          const onEdge = (Math.abs(x) === hw || Math.abs(z) === hw);
          if (L === 0 || onEdge) {
            // gold trim along the lowest/outer ring, teal elsewhere
            const isRim = (L === 0);
            const corner = (Math.abs(x) === hw && Math.abs(z) === hw);
            let col = isRim ? pick(PAL.roofEdge) : pick(PAL.roof);
            world.add(cx + x, y, cz + z, col, { rough: 0.6, metal: isRim ? 0.25 : 0.0 });
            // upturned eaves: raise the very corners of the bottom ring
            if (isRim && corner) {
              world.add(cx + x, y + 1, cz + z, pick(PAL.roofEdge), { rough: 0.5, metal: 0.3 });
              world.add(cx + Math.sign(x) * (hw), y + 1, cz + Math.sign(z) * (hw - 1), pick(PAL.roof));
              world.add(cx + Math.sign(x) * (hw - 1), y + 1, cz + Math.sign(z) * (hw), pick(PAL.roof));
            }
          }
        }
      }
    }
    return y0 + layers; // returns approximate apex height
  }

  // Build one body tier: cream walls, red corner pillars, lattice windows.
  function buildTier(cx, cz, half, y0, h) {
    const w = half * 2 + 1;
    // floor slab
    world.box(cx - half, y0 - 1, cz - half, w, 1, w, pick(PAL.beam), { rough: 0.7 });
    for (let y = 0; y < h; y++) {
      for (let x = -half; x <= half; x++) {
        for (let z = -half; z <= half; z++) {
          const edge = (Math.abs(x) === half || Math.abs(z) === half);
          if (!edge) continue;
          const corner = (Math.abs(x) === half && Math.abs(z) === half);
          if (corner) {
            world.add(cx + x, y0 + y, cz + z, pick(PAL.pillar), { rough: 0.55 });
          } else {
            // wall plaster with occasional dark lattice windows
            const isWindow = (y >= 1 && y <= h - 2) && ((Math.abs(x) === half && (z % 2 === 0)) ||
              (Math.abs(z) === half && (x % 2 === 0)));
            if (isWindow && (Math.abs(x) + Math.abs(z)) % 3 !== 0) {
              world.add(cx + x, y0 + y, cz + z, pick(PAL.beam), { rough: 0.5, emissive: '#3a2a16', emissiveI: 0.2 });
            } else {
              world.add(cx + x, y0 + y, cz + z, pick(PAL.wall), { rough: 0.8 });
            }
          }
        }
      }
    }
    // top beam band (dark wood) just under the roof
    for (let x = -half; x <= half; x++) {
      for (let z = -half; z <= half; z++) {
        if (Math.abs(x) === half || Math.abs(z) === half)
          world.add(cx + x, y0 + h, cz + z, pick(PAL.beam), { rough: 0.6 });
      }
    }
    return y0 + h + 1;
  }

  // Stack the tiers. Each tier narrower and shorter than the one below.
  let y = groundTop;
  const tierPlan = [
    { half: 6, h: 6 },
    { half: 5, h: 5 },
    { half: 4, h: 5 },
    { half: 3, h: 4 },
    { half: 2, h: 4 },
  ];
  for (let i = 0; i < tierPlan.length; i++) {
    const t = tierPlan[i];
    const top = buildTier(PCX, PCZ, t.half, y, t.h);
    const roofApex = buildRoof(PCX, PCZ, t.half + 1, top);
    y = roofApex; // next tier starts on this roof's apex level
  }

  // ---- spire / finial on top: gold rings + a glowing orb ----
  let sy = y;
  for (let i = 0; i < 5; i++) {
    const r = i < 2 ? 1 : 0;
    if (r === 1) {
      world.add(PCX - 1, sy, PCZ, pick(PAL.goldTop), { metal: 0.6, rough: 0.3 });
      world.add(PCX + 1, sy, PCZ, pick(PAL.goldTop), { metal: 0.6, rough: 0.3 });
      world.add(PCX, sy, PCZ - 1, pick(PAL.goldTop), { metal: 0.6, rough: 0.3 });
      world.add(PCX, sy, PCZ + 1, pick(PAL.goldTop), { metal: 0.6, rough: 0.3 });
    }
    world.add(PCX, sy, PCZ, pick(PAL.goldTop), { metal: 0.6, rough: 0.3 });
    sy++;
  }
  // glowing finial orb
  world.add(PCX, sy + 1, PCZ, '#fff0b0', { sx: 1.6, sy: 1.6, sz: 1.6, emissive: '#ffd24a', emissiveI: 1.6, rough: 0.3, metal: 0.4 });
  const finialLight = new THREE.PointLight(0xffd98a, 12, 40, 2);
  finialLight.position.set(PCX, sy + 1, PCZ);
  root.add(finialLight);

  // ---------------------------------------------------------------------------
  //  TREES
  // ---------------------------------------------------------------------------
  // generic blob canopy: spherical-ish cluster of colored voxels
  function canopyBlob(cx, cy, cz, rad, colors, density = 0.85, opts = {}) {
    for (let x = -rad; x <= rad; x++)
      for (let y = -rad; y <= rad; y++)
        for (let z = -rad; z <= rad; z++) {
          const d = Math.sqrt(x * x + y * y * 1.1 + z * z);
          if (d <= rad + Math.random() * 0.6 && Math.random() < density) {
            world.add(cx + x, cy + y, cz + z, pick(colors), { jitter: 0.18, rough: 0.92, ...opts });
          }
        }
  }

  function trunk(cx, baseY, cz, height, color = PAL.trunk) {
    for (let y = 0; y < height; y++) {
      world.add(cx, baseY + y, cz, pick(color), { rough: 0.95, jitter: 0.05 });
      // slight lean / branch nubs higher up
      if (y > height - 3 && Math.random() < 0.5)
        world.add(cx + (Math.random() < 0.5 ? -1 : 1), baseY + y, cz, pick(color), { rough: 0.95 });
    }
  }

  // Cherry blossom — fluffy multi-blob pink canopy, sometimes deeper-pink center
  function cherryTree(cx, gy, cz, scale = 1) {
    const h = 4 + Math.round(scale * 2);
    trunk(cx, gy, cz, h);
    const top = gy + h;
    const r = 2 + Math.round(scale);
    // several overlapping puffs for a billowy look
    canopyBlob(cx, top + 1, cz, r + 1, PAL.sakura, 0.8);
    canopyBlob(cx - r, top, cz, r, PAL.sakura, 0.7);
    canopyBlob(cx + r, top, cz, r, PAL.sakura, 0.7);
    canopyBlob(cx, top, cz - r, r, PAL.sakura, 0.7);
    canopyBlob(cx, top, cz + r, r, PAL.sakura, 0.7);
    canopyBlob(cx, top + 1, cz, r - 1, PAL.sakuraDeep, 0.4); // deeper pink hints
  }

  // Pine — layered green cones
  function pineTree(cx, gy, cz, scale = 1) {
    const h = 6 + Math.round(scale * 3);
    trunk(cx, gy, cz, h, PAL.trunk);
    const tiers = 3 + Math.round(scale);
    let cy = gy + 3;
    for (let t = 0; t < tiers; t++) {
      const rad = (tiers - t) + 1;
      for (let x = -rad; x <= rad; x++)
        for (let z = -rad; z <= rad; z++) {
          if (Math.abs(x) + Math.abs(z) <= rad) {
            const col = (t % 2 === 0) ? pick(PAL.pineDark) : pick(PAL.pineLight);
            world.add(cx + x, cy, cz + z, col, { jitter: 0.12, rough: 0.95 });
          }
        }
      cy += 2;
    }
    // tip
    world.add(cx, cy, cz, pick(PAL.pineLight));
  }

  // Maple — orange/red rounded canopy for autumn contrast
  function mapleTree(cx, gy, cz, scale = 1) {
    const h = 4 + Math.round(scale * 2);
    trunk(cx, gy, cz, h);
    const top = gy + h;
    const r = 2 + Math.round(scale);
    canopyBlob(cx, top, cz, r + 1, PAL.maple, 0.82);
    canopyBlob(cx, top + 1, cz, r, PAL.maple, 0.6);
  }

  // ---------------------------------------------------------------------------
  //  SCATTER PLACEMENT — choose valid grass cells away from structures
  // ---------------------------------------------------------------------------
  const occupied = new Set();
  function nearPagoda(x, z) { return Math.max(Math.abs(x - PCX), Math.abs(z - PCZ)) <= 9; }
  function validSpot(x, z, clearance = 2) {
    const key = x + ',' + z;
    if (!(key in surfaceY)) return false;
    if (isWater(x, z) || pathCells.has(key) || nearPagoda(x, z)) return false;
    if (Math.hypot(x, z) > R - 2) return false;
    for (let ox = -clearance; ox <= clearance; ox++)
      for (let oz = -clearance; oz <= clearance; oz++)
        if (occupied.has((x + ox) + ',' + (z + oz))) return false;
    return true;
  }
  function claim(x, z, rad = 2) {
    for (let ox = -rad; ox <= rad; ox++)
      for (let oz = -rad; oz <= rad; oz++)
        occupied.add((x + ox) + ',' + (z + oz));
  }

  function tryPlant(fn, clearance, count, tries = 400) {
    let placed = 0, n = 0;
    while (placed < count && n < tries) {
      n++;
      const x = Math.round((Math.random() * 2 - 1) * (R - 3));
      const z = Math.round((Math.random() * 2 - 1) * (R - 3));
      if (!validSpot(x, z, clearance)) continue;
      const gy = surfaceY[x + ',' + z] + 1;
      const scale = 0.7 + Math.random() * 1.1;
      fn(x, gy, z, scale);
      claim(x, z, clearance);
      placed++;
    }
  }

  // big feature cherry trees framing the pagoda, then scatter the rest
  [[-13, -12], [14, -11], [-16, 2], [17, 5], [12, 15], [-10, -18]].forEach(([x, z]) => {
    const key = x + ',' + z;
    if (key in surfaceY && !isWater(x, z)) { cherryTree(x, surfaceY[key] + 1, z, 1.4); claim(x, z, 3); }
  });

  tryPlant(cherryTree, 3, 9);
  tryPlant(pineTree, 2, 8);
  tryPlant(mapleTree, 2, 5);

  // ---------------------------------------------------------------------------
  //  STONE LANTERNS (toro) + small props
  // ---------------------------------------------------------------------------
  const lanternLights = [];
  function stoneLantern(x, gy, z) {
    // base
    world.add(x, gy, z, pick(PAL.stone), { rough: 0.9 });
    world.add(x, gy + 1, z, pick(PAL.stone), { rough: 0.9, sx: 0.6, sz: 0.6 });
    // platform
    for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++)
      world.add(x + ox, gy + 2, z + oz, pick(PAL.stone), { rough: 0.9 });
    // light box with glow
    world.add(x, gy + 3, z, '#fff2c0', { emissive: pick(PAL.lanternGlow), emissiveI: 1.4, rough: 0.4 });
    // cap
    for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++)
      world.add(x + ox, gy + 4, z + oz, pick(PAL.stone), { rough: 0.9 });
    world.add(x, gy + 5, z, pick(PAL.stone), { sx: 0.5, sy: 0.8, sz: 0.5 });
    const l = new THREE.PointLight(0xffd98a, 5, 16, 2);
    l.position.set(x, gy + 3, z);
    root.add(l);
    lanternLights.push(l);
  }
  // place lanterns flanking the path and pond
  [[-4, 12], [4, 12], [-6, 18], [6, 18], [-9, 6], [9, 6]].forEach(([x, z]) => {
    const key = x + ',' + z;
    if (key in surfaceY && !isWater(x, z) && !pathCells.has(key)) stoneLantern(x, surfaceY[key] + 1, z);
  });

  // hanging red lanterns near the pagoda entrance
  function hangingLantern(x, y, z) {
    world.add(x, y, z, pick(PAL.lantern), { emissive: '#7a1a12', emissiveI: 0.5, rough: 0.5 });
    world.add(x, y - 1, z, pick(PAL.lantern), { emissive: '#ff9a4a', emissiveI: 0.8, rough: 0.5, sx: 0.8, sz: 0.8 });
    world.add(x, y + 1, z, pick(PAL.goldTop), { metal: 0.5, rough: 0.3, sx: 0.4, sy: 0.6, sz: 0.4 });
    const l = new THREE.PointLight(0xff7a3c, 3.5, 12, 2);
    l.position.set(x, y, z); root.add(l); lanternLights.push(l);
  }
  hangingLantern(-3, groundTop + 4, 7);
  hangingLantern(3, groundTop + 4, 7);

  // scattered rocks & bushes for variety
  function rock(x, gy, z) {
    const s = 1 + (Math.random() * 1.5 | 0);
    for (let i = 0; i < s + 1; i++)
      world.add(x + (Math.random() * 2 - 1 | 0), gy + (i ? 1 : 0), z + (Math.random() * 2 - 1 | 0), pick(PAL.rock), { jitter: 0.2, sx: 1.1, sy: 0.9, sz: 1.1 });
  }
  function bush(x, gy, z) {
    const cols = Math.random() < 0.4 ? PAL.sakura : PAL.pineLight;
    canopyBlob(x, gy + 1, z, 1 + (Math.random() * 1 | 0), cols, 0.8);
  }
  tryPlant((x, gy, z) => rock(x, gy - 1, z), 1, 14);
  tryPlant((x, gy, z) => bush(x, gy, z), 1, 16);

  // little grass tufts / flowers sprinkled on open grass
  for (let i = 0; i < 150; i++) {
    const x = Math.round((Math.random() * 2 - 1) * (R - 3));
    const z = Math.round((Math.random() * 2 - 1) * (R - 3));
    const key = x + ',' + z;
    if (!(key in surfaceY) || isWater(x, z) || pathCells.has(key) || nearPagoda(x, z)) continue;
    const flower = Math.random();
    let c;
    if (flower < 0.12) c = '#ff5d7a';
    else if (flower < 0.22) c = '#ffd23c';
    else if (flower < 0.30) c = '#b88bff';
    else c = pick(PAL.grassTop);
    world.add(x, surfaceY[key] + 1, z, c, {
      sx: 0.4, sy: 0.5, sz: 0.4, jitter: 0.15,
      emissive: flower < 0.30 ? c : null, emissiveI: 0.25
    });
  }

  // ---------------------------------------------------------------------------
  //  COMMIT all static voxels to the GPU
  // ---------------------------------------------------------------------------
  world.commit(root);

  return { lanternLights, R };
}