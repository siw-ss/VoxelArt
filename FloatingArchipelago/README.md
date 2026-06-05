# 🏝️ Floating Archipelago of Sky Islands

> Multiple disconnected voxel islands suspended at different altitudes in an endless sky, connected by luminescent crystal bridges with cascading waterfalls, ancient temple ruins, a watchtower beacon, hanging gardens, and a crystal shrine.

🎨 **Interactive Voxel Scene:** [siw-ss.github.io/VoxelArt/FloatingArchipelago](https://siw-ss.github.io/VoxelArt/FloatingArchipelago)

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
FloatingArchipelago/
├── css/
│   └── styles.css          # Glassmorphism styling, dock animations, UI panels
├── js/
│   ├── main.js             # Scene setup, renderer, animation loop, UI wiring
│   ├── scene-builder.js    # Island generation, structures, bridges, vegetation
│   ├── voxel-world.js      # InstancedMesh-based voxel rendering engine
│   ├── effects.js          # Waterfalls, mist, ambient particles, clouds
│   ├── animals.js          # Animated chickens hopping between islands
│   ├── ui.js               # Dock magnification, sun panel, typewriter, diagnostics
│   └── palette.js          # Voxel color palette definitions
├── vendor/
│   ├── three.module.js     # Three.js library
│   └── OrbitControls.js    # Camera orbit controls
└── index.html              # Main entry point
```

---

## 🏝️ The Five Islands

| Island                  | Altitude | Feature                                                                                  |
| ----------------------- | -------- | ---------------------------------------------------------------------------------------- |
| **Central Temple**      | y=0      | Grand stepped pyramid with gold-trimmed tiers, flanking colonnade, glowing apex crystal  |
| **Northern Watchtower** | y=+15    | Circular tower with observation deck, crenellations, beacon fire, spiral cliff stairs    |
| **Eastern Ruins**       | y=+8     | Ancient crumbling temple with vine-covered pillars, broken archway, glowing rune altar   |
| **Western Gardens**     | y=+5     | Four-tiered hanging gardens with cascading vines, flowers, natural rock outcrops         |
| **Southern Shrine**     | y=-8     | Floating crystal shrine with 8-pillar ring, central crystal formation, observation point |

---

## 🎨 Features

- **Voxel Rendering Engine:** Custom `InstancedMesh`-based system groups voxels by material signature for efficient GPU rendering of ~18,000 cubes across five islands
- **Procedural Island Generation:** Organic coastlines with multi-octave noise, geological layering (light stone → dark stone → mineral rock), stalactite underhangs, surface boulders
- **Crystal Bridges:** Four arced bridge connections with 3-voxel-wide decks, railing posts, rune markings, and pulsing teal glow
- **Waterfalls:** 250 animated water particles flowing between islands with lateral wind drift, fade-over-lifetime, and mist accumulation at base (80 mist particles)
- **Animated Wildlife:** 4 unique brownish chickens and 3 tiny yellow chicks hopping between islands via crystal bridges, each with its own feather color palette, wing-flapping, head-pecking, and idle behaviors
- **Ambient Particles:** 50 floating pollen/dust motes with orbital drift patterns
- **Voxel Clouds:** Five cloud formations drifting below the islands
- **Starfield:** 400 stars revealed in night mode with deep indigo sky
- **Dynamic Lighting:** Directional sun with PCF soft shadows, hemisphere + ambient fill, emissive crystal bridges, beacon fire, shrine glow, rune altar light
- **Time of Day:** Sun panel with arc visualization; adjusts sun angle, color temperature and intensity from sunrise through high noon
- **Night Mode:** Switches sky gradient, fog, star visibility and lighting to moonlit palette; crystal elements glow brighter
- **Gravity Shift Toggle:** Randomizes island altitudes with visual feedback
- **Interactive Dock:** macOS-style magnification on hover; toggles for auto-orbit, waterfalls, gravity shift, night mode, and home navigation
- **Typewriter Description:** Animated text reveal on the description card after scene load
- **Error Handling:** On-screen error reporting and 9-second watchdog for failed loads
- **Glassmorphism Design:** Frosted glass UI with backdrop blur, teal/gold accent theme

---

## 🛠️ Tech Stack

- **Three.js** (vendored) — 3D rendering, `InstancedMesh`, `PCFSoftShadowMap`, `ACESFilmicToneMapping`
- **OrbitControls** (vendored) — camera orbit, zoom and pan with damping
- **Vanilla JavaScript** — ES modules, no build step required
- **CSS3** — glassmorphism effects, dock magnification animations, gradient theming

---

## 🎨 Color Palette

| Element              | Hex       |
| -------------------- | --------- |
| Sky (day horizon)    | `#87CEEB` |
| Sky (day zenith)     | `#1E90FF` |
| Island Stone (light) | `#C0C0C0` |
| Island Stone (dark)  | `#708090` |
| Crystal Bridge       | `#00E5FF` |
| Temple Brick         | `#D2B48C` |
| Grass                | `#90EE90` |
| Water/Mist           | `#00FFFF` |
| Gold Trim            | `#FFD700` |
| Sky (night)          | `#191970` |
| Stars                | `#FFFACD` |
| Rune Glow            | `#8B00FF` |

---

Made with 💜 by Siwar Soula
