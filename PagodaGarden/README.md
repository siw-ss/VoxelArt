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

- **Voxel Rendering Engine:** Custom InstancedMesh-based system for efficient rendering of thousands of voxels
- **Procedural Scene Generation:** Pagoda with 5 tiers, cherry trees, koi pond, stone lanterns, and more
- **Animated Petals:** 900 drifting cherry petals with physics-based motion
- **Dynamic Lighting:** Directional sun light with shadows, ambient fill, and emissive lanterns
- **Interactive UI:** macOS-style dock magnification, sun time-of-day control, auto-orbit toggle
- **Glassmorphism Design:** Modern frosted glass UI elements with backdrop blur

---

## 🛠️ Tech Stack

- **Three.js** - 3D rendering
- **Vanilla JavaScript** - ES modules for clean code organization
- **CSS3** - Glassmorphism effects and animations

---

Made with 💜 by Siwar Soula
