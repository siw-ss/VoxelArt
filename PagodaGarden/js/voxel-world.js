import * as THREE from '../vendor/three.module.js';

// ---------------------------------------------------------------------------
//  VOXEL ENGINE — collect cubes by color, render via InstancedMesh
// ---------------------------------------------------------------------------
const VOX = 1;                       // base voxel size
const _cubeGeo = new THREE.BoxGeometry(VOX, VOX, VOX);

// A builder accumulates voxels: each is {x,y,z, color, sx,sy,sz, emissive}
export class VoxelWorld {
    constructor() {
        this.buckets = new Map(); // key = material signature -> array of matrices+colors
        this._m = new THREE.Matrix4();
        this._q = new THREE.Quaternion();
        this._s = new THREE.Vector3();
        this._p = new THREE.Vector3();
        this._items = [];
    }
    // add one voxel (optionally scaled / non-cubic for variety)
    add(x, y, z, color, opts = {}) {
        this._items.push({
            x, y, z,
            color: new THREE.Color(color),
            sx: opts.sx ?? 1, sy: opts.sy ?? 1, sz: opts.sz ?? 1,
            rough: opts.rough ?? 0.95,
            metal: opts.metal ?? 0.0,
            emissive: opts.emissive ?? null,
            emissiveI: opts.emissiveI ?? 1.0,
            jitter: opts.jitter ?? 0,
        });
    }
    // build a filled box region of voxels
    box(x0, y0, z0, w, h, d, color, opts = {}) {
        for (let x = 0; x < w; x++)
            for (let y = 0; y < h; y++)
                for (let z = 0; z < d; z++)
                    this.add(x0 + x, y0 + y, z0 + z, color, opts);
    }
    // hollow rectangular frame walls (no top/bottom) — for buildings
    walls(x0, y0, z0, w, h, d, color, opts = {}) {
        for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++)
                for (let z = 0; z < d; z++) {
                    const edge = (x === 0 || x === w - 1 || z === 0 || z === d - 1);
                    if (edge) this.add(x0 + x, y0 + y, z0 + z, color, opts);
                }
    }
    // finalize into InstancedMeshes grouped by material params
    commit(parent) {
        // Group by rough+metal+emissive signature so we can vary surface look
        const groups = new Map();
        for (const it of this._items) {
            const key = `${it.rough}|${it.metal}|${it.emissive ? it.emissive : 'x'}|${it.emissiveI}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(it);
        }
        for (const [key, items] of groups) {
            const sample = items[0];
            const mat = new THREE.MeshStandardMaterial({
                roughness: sample.rough,
                metalness: sample.metal,
            });
            if (sample.emissive) {
                mat.emissive = new THREE.Color(sample.emissive);
                mat.emissiveIntensity = sample.emissiveI;
            }
            const mesh = new THREE.InstancedMesh(_cubeGeo, mat, items.length);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                let jx = 0, jz = 0, jy = 0;
                if (it.jitter) {
                    jx = (Math.random() - 0.5) * it.jitter;
                    jy = (Math.random() - 0.5) * it.jitter;
                    jz = (Math.random() - 0.5) * it.jitter;
                }
                this._p.set(it.x + jx, it.y + jy, it.z + jz);
                this._q.identity();
                this._s.set(it.sx, it.sy, it.sz);
                this._m.compose(this._p, this._q, this._s);
                mesh.setMatrixAt(i, this._m);
                mesh.setColorAt(i, it.color);
            }
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
            parent.add(mesh);
        }
        this._items.length = 0;
    }
}
