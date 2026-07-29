# 🐠 Underwater Coral Kingdom – Implementation Prompt

> A vibrant voxel coral reef city submerged in deep ocean waters, with bioluminescent structures, schools of fish, rising bubbles, swaying kelp forests, and animated god-ray sunlight filtering down from the surface — the first underwater scene in the collection.

---

## 1. **Scene Architecture**

### Ocean Floor (Base Terrain)

- **Circular seabed** (radius 38, centered Y=0): Sandy ocean floor with gentle undulations, scattered shells, and patterned sand ripples
- **Geological depth**: Sand surface → rocky substrate → darker volcanic rock at edges
- **Coral reef ring** (radius 8–30): Dense coral formations rising from the seabed at varying heights

### Coral Structures (Main Features)

- **Brain corals** (4–6): Large rounded formations (5×5×4 voxels), textured pink/orange surfaces
- **Branching corals** (8–12): Tall tree-like structures (height 8–15), forking branches in hot pink, electric orange, deep purple
- **Table corals** (3–4): Flat disc-shaped platforms on thin stems, teal and turquoise
- **Tube sponges** (6–8): Tall cylindrical formations in yellow, orange, violet
- **Fan corals** (4–5): Flat vertical plane shapes, semi-transparent magenta/red
- **Anemones** (5–7): Clusters with tentacle-like top voxels, bioluminescent tips

### Central Structure — Ancient Coral Temple

- **Sunken temple ruin** (center, radius 6): Coral-encrusted stone pillars (4 remaining), broken archway, mossy stone floor
- **Bioluminescent altar**: Central glowing formation (emissive teal/cyan, pulsing)
- **Overgrown with coral**: Temple partially consumed by living reef

### Kelp Forest (Background Ring)

- **Kelp stalks** (15–20): Tall vertical chains of voxels (height 20–35), swaying gently
- **Positioned** at radius 30–38, creating a natural boundary
- **Colors**: Deep green to olive, with golden-brown bladders at intervals

### Decorative Elements

- **Shells** (10–15): Scattered on sandy floor, various sizes (1–3 voxels)
- **Starfish** (3–4): Flat 5-point formations in orange/red on rocks
- **Sea urchins** (4–6): Small spiky dark purple clusters
- **Treasure chest** (1): Half-buried, gold coins spilling out (emissive gold)

---

## 2. **Voxel Rendering Engine**

### Material System (InstancedMesh pattern — consistent with all other scenes)

- **Palette** (10 material groups):
  - Sand/seabed: Warm beiges and tans (`#d4b896`, `#c4a878`, `#e8d4b0`)
  - Coral (warm): Hot pinks, oranges, reds (`#ff6b8a`, `#ff8c42`, `#e63946`, `#ff006e`)
  - Coral (cool): Teals, purples, violets (`#7b2d8b`, `#4361ee`, `#3a0ca3`, `#00b4d8`)
  - Bioluminescent: Emissive cyans and greens (`#00ffcc`, `#00e5ff`, `#39ff14`, emissiveIntensity 0.5)
  - Kelp: Deep greens and olives (`#2d6b3a`, `#4a6b3a`, `#6b8c3a`)
  - Stone (temple): Mossy grays (`#5a6b5a`, `#7a8a6a`, `#4a5a4a`)
  - Treasure: Gold emissive (`#ffd700`, `#ffaa00`, emissiveIntensity 0.4)
  - Rock: Dark grays and browns (`#3a3a4a`, `#4a4a5a`, `#2a2a3a`)
  - Sponge: Yellows and violets (`#ffd166`, `#9b5de5`, `#f77f00`)
  - Shell/starfish: Cream, coral, orange (`#fff0db`, `#ff7f50`, `#ff6347`)

### Rendering Strategy

- Custom `InstancedMesh` grouping by material signature
- Emissive materials for bioluminescent elements (altar, anemone tips, scattered bio-dots)
- Separate animated systems for fish, bubbles, and kelp sway

---

## 3. **Animated Elements**

### Schools of Fish (Signature Feature)

- **3 schools** of 15–25 fish each (total 45–75 fish particles)
- Each fish: 2–3 voxel elongated shape with tail wiggle animation
- **Schooling behavior**: Each school orbits a center point with sine-wave undulation
- **Colors by school**: Neon blue (`#00b4d8`), tropical yellow (`#ffd166`), clownfish orange (`#ff6b35`)
- Speed: 2–4 units/sec orbital, with individual variation (±20%)
- Radius variation: Fish maintain loose formation (±3 units from school center)

### Rising Bubbles

- **80–150 bubble particles**: Translucent white spheres rising from seabed
- Spawn at random positions on the floor (radius 0–35), rise at 1.5–3.0 units/sec
- Lateral drift: Slight sine-wave wobble (±0.5 units)
- Size variation: 0.2–0.8 voxel units
- Fade out and respawn at Y=45+
- **Bubble clusters** from specific vents (3–4 active vents with denser output)

### God Rays (Sunlight Filtering)

- **4–6 volumetric light shafts**: Semi-transparent planes angled from above
- PlaneGeometry with custom ShaderMaterial: Gradient alpha (bright center, faded edges)
- Slow rotation/sway animation (0.002 rad/frame drift)
- Color: Pale golden-white (`#fff8e1`) with low opacity (0.08–0.15)

### Kelp Sway

- All kelp stalks oscillate with sine wave animation
- Staggered phase by height (lower segments lag behind upper)
- Amplitude: ±0.4 units at tips, ±0.1 at base
- Period: 4–6 seconds (randomized per stalk)

### Bioluminescent Pulse

- All emissive elements pulse gently (sine wave, 0.3–1.0 intensity)
- Staggered timing creates "breathing" effect across the reef
- Period: 3–5 seconds per element

### Ambient Particles (Plankton/Marine Snow)

- **40–60 tiny particles**: Slow downward drift (0.1–0.3 units/sec) — "marine snow"
- Faint white/blue, very small (0.1–0.2 units)
- Random 3D wandering within bounds

---

## 4. **Lighting & Atmosphere**

### Sky/Background (Deep Ocean Gradient)

- **Canvas gradient texture** (vertical):
  - Surface (top): `#0a4a7a` (filtered sunlight blue)
  - Mid: `#062c4a` (deep blue)
  - Floor (bottom): `#031a2e` (abyssal dark)

### Lighting Setup

- **HemisphereLight**: Sky `#4488aa` / Ground `#0a1a2e`, intensity 0.6
- **DirectionalLight** (sun from above): Color `#88ccff`, intensity 0.5, position (20, 80, 10), casts PCF soft shadows (2048×2048)
- **AmbientLight**: `#1a3355`, intensity 0.35 (deep blue ambient fill)
- **Bioluminescent PointLights** (4–6): Color `#00ffcc`, intensity 1.5, range 20 — near major bio formations
- **Altar PointLight**: `#00e5ff`, intensity 2.5, range 30, subtle pulse

### Fog (Underwater Haze)

- **Deep blue fog**: Color `#0a2a4a`, near=40, far=160
- Creates depth perception and underwater visibility falloff

### Depth Slider Effect

- Adjusts fog density, light intensity, and sky color
- Shallow (0): Brighter, more green-blue, shorter fog
- Deep (100): Darker, more indigo-purple, denser fog, stronger bioluminescence

---

## 5. **Interactive Controls & UI** (Glassmorphism — Harmonized with All Other Scenes)

### ⚠️ UI CONSISTENCY REQUIREMENTS (Critical)

The UI must follow the same visual system as all other VoxelArt scenes.

**Accent colors** (scene-specific):

- UnderwaterCoralKingdom: Ocean cyan/teal (`#00e5ff`, `#00b4d8`, `#00ffcc`)

### Dock Buttons (7 items + separators)

| Button        | Action                        | Icon                |
| ------------- | ----------------------------- | ------------------- |
| Fish          | Toggle fish schools on/off    | Fish SVG            |
| Bubbles       | Toggle bubble flyout panel    | Bubbles/circles SVG |
| Depth         | Toggle depth flyout panel     | Depth/layers SVG    |
| ─ separator ─ |                               |                     |
| Auto-orbit    | Toggle camera auto-rotation   | Orbit/refresh SVG   |
| Shadows       | Toggle shadow rendering       | Light bulb SVG      |
| Bio-glow      | Toggle bioluminescence on/off | Glow/sparkle SVG    |
| ─ separator ─ |                               |                     |
| Home          | Navigate to `../index.html`   | Home SVG            |

### Flyout Panels

**Bubbles Panel:**

- Density slider (20–200, default 100): Number of bubble particles
- Speed slider (50–200, default 100): Rise speed multiplier

**Depth Panel:**

- Depth slider (0–100, default 30): Controls underwater depth aesthetic
  - 0 = Shallow reef (bright, warm, short fog)
  - 50 = Mid-depth (balanced)
  - 100 = Deep abyss (dark, cold, long fog, strong bio-glow)

### Magnification Formula (shared across all projects)

```
scale = 1.0 + 0.55 * cos(distance / 95 * π/2) when distance < 95px
```

---

## 6. **Camera & Navigation**

### OrbitControls Configuration (same pattern as other scenes)

- **Start position**: (45, 25, 45) looking at (0, 8, 0)
- **FOV**: 50°
- **Damping**: enabled, factor 0.06
- **Distance limits**: 18–120 units
- **Polar angle max**: 0.52π
- **Auto-rotate**: enabled by default, speed 0.3
- **Home position**: Reset to start with smooth lerp

---

## 7. **Project Structure**

```
UnderwaterCoral/
├── css/
│   └── styles.css              # Glassmorphism (matching all other scenes)
├── js/
│   ├── main.js                 # Scene setup, renderer, animation loop, UI wiring
│   ├── scene-builder.js        # Seabed, corals, temple, kelp, decorations
│   ├── voxel-world.js          # InstancedMesh-based voxel rendering engine
│   ├── fish.js                 # Fish school system (3 schools, orbital paths)
│   ├── effects.js              # Bubbles, god rays, marine snow, kelp sway
│   ├── ui.js                   # Dock, flyout panels, magnification, typewriter
│   └── palette.js              # Color palette definitions
├── vendor/
│   ├── three.module.js         # Three.js library
│   └── OrbitControls.js        # Camera orbit controls
└── index.html                  # Entry point
```

---

## 8. **Technical Specifications**

### Performance Targets

- Static voxel count: ~12,000–18,000 (seabed + corals + temple + kelp + decorations)
- Active fish: 60 default (3 schools × 20)
- Bubble particles: 100 default (adjustable 20–200)
- Target framerate: 60 FPS on mid-range devices
- Material batches: 8–12 InstancedMesh groups

### Color Palette (Hex Values)

| Element          | Color            | Hex     |
| ---------------- | ---------------- | ------- |
| Sand surface     | Warm Tan         | #d4b896 |
| Coral (hot pink) | Vibrant Pink     | #ff6b8a |
| Coral (orange)   | Electric Orange  | #ff8c42 |
| Coral (purple)   | Deep Violet      | #7b2d8b |
| Coral (teal)     | Ocean Teal       | #00b4d8 |
| Bioluminescent   | Neon Cyan        | #00ffcc |
| Kelp             | Deep Green       | #2d6b3a |
| Temple stone     | Mossy Gray       | #5a6b5a |
| Treasure gold    | Gold             | #ffd700 |
| Fish (blue)      | Neon Blue        | #00b4d8 |
| Fish (yellow)    | Tropical Yellow  | #ffd166 |
| Fish (orange)    | Clownfish Orange | #ff6b35 |
| Sky (surface)    | Filtered Blue    | #0a4a7a |
| Sky (deep)       | Abyssal Dark     | #031a2e |
| Fog              | Deep Blue        | #0a2a4a |
| Accent (UI)      | Cyan             | #00e5ff |

### Animation Constants

- Fish orbital speed: 2–4 units/sec (per school)
- Fish tail wiggle: 8 Hz sine wave
- Bubble rise speed: 1.5–3.0 units/sec
- Bubble respawn threshold: Y=45
- God ray rotation: 0.002 rad/frame
- Kelp sway period: 4–6 seconds
- Kelp sway amplitude: ±0.4 units (tip)
- Bioluminescent pulse period: 3–5 seconds
- Marine snow drift: 0.1–0.3 units/sec downward
- Typewriter speed: 38ms per character, appears after 1800ms delay

---

## 9. **Implementation Consistency Checklist**

These elements MUST match across all five VoxelArt scenes:

| Element          | Requirement                                                     |
| ---------------- | --------------------------------------------------------------- |
| Dock layout      | Fixed bottom-center, 26px radius, glassmorphism, same shadows   |
| Dock items       | 48×48, 16px radius, SVG icons, magnification on hover           |
| Magnification    | Same formula: `1.0 + 0.55 * cos(dist/95 * π/2)`                 |
| Flyout panels    | 240px wide, 18px radius, same glassmorphism, slide-up animation |
| Title card       | Top-left, glassmorphism, gradient text with shimmer keyframes   |
| Description card | Below title, left-accent border, typewriter reveal              |
| Loader           | Full-screen overlay with centered text, fade-out on ready       |
| Error handling   | 9-second watchdog + global error/rejection listeners            |
| Renderer         | `ACESFilmicToneMapping`, `PCFSoftShadowMap`, `SRGBColorSpace`   |
| Controls         | `OrbitControls` with damping, auto-rotate toggle, home reset    |
| Home button      | Always navigates to `../index.html`                             |

### Scene-Specific Differentiation

- **Archipelago**: Teal/gold accents, multi-island layout, waterfalls, crystal bridges, chickens, gravity toggle
- **Pagoda**: Sakura pink accents, single island, cherry petals, koi pond, lanterns, petal count slider
- **NordicIcePalace**: Ice blue/cyan accents, single island, aurora borealis, snow, frozen lake, season toggle
- **LanternLake**: Warm gold/amber accents, lake island, floating lanterns, boat release mechanic, fireflies, sunset sky
- **UnderwaterCoral**: Ocean cyan/teal accents, underwater seabed, fish schools, rising bubbles, god rays, depth slider

---

## 10. **Success Criteria**

✅ Coral reef renders with diverse, colorful formations (brain, branching, table, tube, fan)
✅ 3 fish schools orbit with visible schooling behavior and tail animation
✅ Bubbles rise naturally with wobble and respawn
✅ God rays filter from above creating volumetric light shafts
✅ Kelp forest sways with staggered sine-wave motion
✅ Bioluminescent elements pulse with breathing effect
✅ Ancient temple ruin is partially overgrown with coral
✅ Depth slider adjusts fog, lighting, and atmosphere in real-time
✅ UI dock matches all other scenes' glassmorphism style exactly
✅ Dock magnification formula identical across all scenes
✅ Flyout panels control bubble density/speed and depth
✅ Typewriter description reveals correctly on initial load
✅ 60 FPS maintained with all systems active
✅ 9-second watchdog catches failed loads
✅ Immersive underwater atmosphere — mysterious, vibrant, alive

---

**Use vendored Three.js and OrbitControls, vanilla JavaScript with ES modules, CSS3 glassmorphism. The UI must be visually harmonious with all other VoxelArt scenes — same glass style, same dock mechanics, scene-specific ocean cyan accent colors only.**
