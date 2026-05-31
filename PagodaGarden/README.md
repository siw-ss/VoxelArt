# 🌸 Cherry Blossom Pagoda Garden

> A floating voxel island suspended in a pastel sky — home to a five-tier pagoda with teal roofs and gold eaves, blossoming sakura, a koi pond with stone lanterns, and 900 drifting cherry petals.

🎨 **Interactive Voxel Scene:** [siw-ss.github.io/VoxelArt/PagodaGarden](https://siw-ss.github.io/VoxelArt/PagodaGarden)

---

## 🚀 Running Locally

This project uses ES modules and requires a local web server to run.

### Using Python (Recommended)
```bash
python -m http.server 8000
```
Then open: `http://localhost:8000`

### Using Node.js (http-server)
```bash
npx http-server -p 8000
```
Then open: `http://localhost:8000`

---

## 📁 Project Structure

```
PagodaGarden/
├── css/
│   └── styles.css          # All styling and animations
├── js/
│   ├── main.js             # Scene setup, renderer, animation loop
│   ├── scene-builder.js    # Voxel world construction (pagoda, trees, props)
│   ├── voxel-world.js      # InstancedMesh-based voxel rendering engine
│   ├── petals.js           # Animated cherry petals and clouds
│   ├── ui.js               # UI behaviors (dock, sun panel, typewriter)
│   └── palette.js          # Voxel color palette definitions
├── vendor/
│   ├── three.module.js     # Three.js library
│   └── OrbitControls.js    # Camera orbit controls
└── index.html              # Main entry point
```

---

## 🎨 Features

- **Voxel Rendering Engine:** Custom `InstancedMesh`-based system groups voxels by material signature for efficient GPU rendering of thousands of cubes
- **Procedural Scene Generation:** Five-tier pagoda with vermillion pillars, teal roofs and gold eaves; cherry blossom, pine and maple trees; koi pond with sandy bed and stone rim; curved stone path; raised plaza with steps; scattered rocks, bushes and flowers
- **Animated Petals:** Up to 900 drifting cherry petals with per-petal sway, rotation and spin physics; adjustable count via slider (10–900)
- **Voxel Clouds:** Six slow-drifting cloud formations built from the voxel engine and animated in the render loop
- **Starfield:** 500 stars revealed in night mode
- **Dynamic Lighting:** Directional sun with PCF soft shadows, hemisphere + ambient fill, emissive stone lanterns and hanging red lanterns with flicker animation, glowing pagoda finial orb
- **Time of Day:** Sun panel lets you drag the sun across an arc from sunrise to high noon, updating light color and intensity in real time; disabled automatically in night mode
- **Night Mode:** Switches sky gradient, fog color, star visibility and lighting to a moonlit palette
- **Interactive Dock:** macOS-style magnification on hover; toggles for auto-orbit, falling petals, shadows, night mode and home navigation; petal-count and sun-position flyout panels
- **Typewriter Description:** Animated text reveal on the description card after the scene loads
- **Error Handling:** On-screen error reporting and a 9-second watchdog for failed loads
- **Glassmorphism Design:** Frosted glass UI elements with backdrop blur throughout

---

## 🛠️ Tech Stack

- **Three.js** (vendored) — 3D rendering, `InstancedMesh`, `PCFSoftShadowMap`, `ACESFilmicToneMapping`
- **OrbitControls** (vendored) — camera orbit, zoom and pan with damping
- **Vanilla JavaScript** — ES modules, no build step required
- **CSS3** — glassmorphism effects, dock animations, typewriter cursor

---

Made with 💜 by Siwar Soula
