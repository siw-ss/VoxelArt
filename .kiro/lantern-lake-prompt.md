# 🏮 Lantern Lake – Implementation Prompt

> A dreamy voxel sunset lake inspired by the lantern scene from _Tangled_ — warm golden water reflecting hundreds of glowing sky lanterns, a small wooden boat drifting at the center releasing lanterns one at a time, surrounded by willow trees, fireflies, and a magical twilight gradient sky.

---

## 1. **Scene Architecture**

### Floating Island & Lake

- **Circular terrain** (radius 38, centered Y=0): Lush grass-covered mesa with gentle undulating shoreline
- **Lake** (inner radius 0, outer radius 28): Still water surface at Y=0 with subtle reflective quality, deep indigo-purple tones beneath, warm gold-amber reflection from lanterns above
- **Shoreline ring** (radius 28–35): Sandy beach transitioning to grass, scattered river stones, reeds, and wildflowers
- **Geological underside**: Tapered rock strata beneath the island (5 layers, warm earth tones — sienna, umber, clay)

### Boat (Center of Lake)

- **Small wooden rowboat** (8×4×3 voxels): Positioned at lake center, dark walnut wood with lighter trim
- **Lantern stack**: 3–4 unlit lanterns resting inside the boat (warm paper texture, golden frames)
- **Subtle drift animation**: Boat sways gently (sine wave, ±0.3 units X/Z, 6-second period)
- **Oars**: Two small oars resting across the gunwales

### Shoreline Structures

- **Wooden dock** (south side): 3-wide plank walkway extending 6 voxels into the lake, with post supports
- **Stone lantern posts** (4): Placed along the shoreline at cardinal points, each with a warm glowing voxel top
- **Willow trees** (4–6): Trunk (3–5 tall) with cascading canopy voxels draping downward, positioned around the shore
- **Cherry/flowering trees** (2–3): Smaller accent trees with pink-white blossoms
- **Reeds & cattails** (clusters of 8–12): Thin vertical voxels at water's edge
- **Firefly bushes** (3–4): Low shrubs that emit floating firefly particles

### Distant Backdrop

- **Rolling hills silhouette** (far background, Y=-2 to Y=5): Dark purple-blue voxel hills at radius 45–55, purely decorative depth
- **Distant village lights** (optional): 5–8 tiny warm glowing dots on the hills suggesting a faraway town

---

## 2. **Voxel Rendering Engine**

### Material System (InstancedMesh pattern — consistent with other scenes)

- **Palette** (10 material groups):
  - Water surface: Deep purples and golds (`#2d1b4e`, `#4a2c6b`, `#c9943a` reflections)
  - Boat wood: Warm browns (`#5c3a1e`, `#7a4f2a`, `#3d2810`)
  - Lantern paper: Warm cream/gold (`#fff4d6`, `#ffe4a0`, `#ffd070`)
  - Lantern frame: Dark bronze/wood (`#6b4528`, `#4a3018`)
  - Grass/vegetation: Rich greens (`#2d6b3a`, `#4a8c5c`, `#1a4d2e`)
  - Sand/shore: Warm tans (`#d4b896`, `#c4a47a`, `#e8d4b0`)
  - Stone: Gray-browns (`#7a6b5a`, `#5c4f42`, `#8c7d6e`)
  - Willow leaves: Sage greens (`#6b8c5a`, `#8aad6e`, `#4a6b3a`)
  - Hill silhouette: Dark purple-blues (`#1a0d2e`, `#2d1845`, `#0d0618`)
  - Emissive glow: Warm golds (`#ffcc44`, `#ffaa22`, emissiveIntensity 0.6)

### Rendering Strategy

- Custom `InstancedMesh` grouping by material signature
- Emissive materials for lantern glow, fireflies, and shore lantern posts
- Water surface: Semi-transparent plane with animated color shifting to simulate lantern reflections
- Separate particle systems for sky lanterns and fireflies

---

## 3. **Animated Elements**

### Sky Lanterns (Signature Feature)

- **Already-floating lanterns** (60–100): Pre-placed at various heights (Y=20–80) across the sky, slowly drifting upward and laterally
  - Each lantern: 2×2×3 voxel cluster (paper body + frame top/bottom) with warm emissive glow
  - Drift speed: 0.3–0.8 units/sec upward, 0.1–0.3 lateral drift (randomized per lantern)
  - Subtle sway: Sine-based oscillation (±0.5 units, random phase per lantern)
  - Glow pulse: Emissive intensity oscillates 0.4–0.8 (3–5 second period, random phase)
  - Once a lantern exceeds Y=90, it fades out (opacity 1→0 over 2 seconds) and respawns at Y=15 near the boat

- **Boat lantern release** (1 at a time):
  - Every 8–12 seconds, one lantern lifts off from the boat stack
  - Release animation: Lantern rises slowly from boat (Y=2→Y=8 over 3 seconds) then joins the free-floating group
  - Brief bright pulse on release (emissive 1.0 → 0.6 over 1 second)
  - Boat stack visually decreases by one lantern, then resets after all are released (loop)

### Water Reflections

- **Reflection plane** (Y=-0.5): Semi-transparent plane beneath the water surface
- Animated color: Blends between deep purple base and warm gold based on lantern density overhead
- Subtle ripple: Vertex displacement using sine waves (very gentle, 0.1 amplitude)
- Boat creates a small ripple origin point

### Fireflies

- **30–50 firefly particles**: Tiny emissive yellow-green dots (`#ccff66`, `#ffee44`)
- Concentrated near shore bushes and willow trees
- Movement: Slow random 3D wandering (Brownian motion), confined to radius 28–38, Y=1–8
- Blink pattern: Each firefly fades in/out on a 2–4 second random cycle

### Willow Tree Sway

- Cascading canopy voxels have subtle lateral oscillation (sine wave, ±0.2 units, staggered phase by height)

### Clouds (Subtle)

- **3–5 thin cloud wisps** at Y=50–65: Very slow horizontal drift (0.002 units/frame)
- Semi-transparent, warm purple-pink tones (catching sunset light)

---

## 4. **Lighting & Atmosphere**

### Sky Gradient (Tangled-inspired Sunset)

- **Primary sky**: Deep warm gradient — golden amber at horizon → soft rose → deep purple → dark indigo at zenith
  - Horizon: `#ffb347` (warm amber)
  - Mid-low: `#ff6b6b` (coral rose)
  - Mid-high: `#7b2d8b` (deep purple)
  - Zenith: `#1a0d2e` (near-black indigo)

### Lighting Setup

- **HemisphereLight**: Sky `#ff9966` / Ground `#2d1b4e`, intensity 0.7
- **DirectionalLight** (sunset sun): Color `#ffcc88`, intensity 0.4, position (-60, 15, -40) — low angle for long golden light
- **AmbientLight**: `#331a4d`, intensity 0.3 (purple ambient fill)
- **Lantern PointLights** (6–8 strategic): Color `#ffaa33`, intensity 1.5, range 25 — placed near clusters of floating lanterns to cast warm pools of light
- **Boat lantern light**: Single PointLight attached to boat, color `#ffdd66`, intensity 2.0, range 15

### Fog

- **Warm purple fog**: Color `#2d1845`, near=80, far=200
- Creates dreamy atmospheric depth

### Post-Processing Feel (via material choices)

- Warm color temperature throughout
- High emissive usage creates natural "bloom" appearance without actual post-processing
- Dark water + bright lanterns = high contrast focal points

---

## 5. **Interactive Controls & UI** (Glassmorphism — Harmonized with All Other Scenes)

### ⚠️ UI CONSISTENCY REQUIREMENTS (Critical)

The UI must follow the same visual system as FloatingArchipelago, PagodaGarden, and NordicIcePalace:

**Dock styling** (identical across all projects):

- Fixed bottom-center, `border-radius: 26px`
- `backdrop-filter: blur(22px) saturate(160%)`
- `background: linear-gradient(180deg, rgba(20-40, 30-46, 60-74, 0.42-0.45), rgba(8-16, 12-20, 28-38, 0.5-0.55))`
- `border: 1px solid rgba(255, 255, 255, 0.2)`
- `box-shadow: 0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)`
- Dock items: 48×48px, `border-radius: 16px`, glass gradient background, `border: 1px solid rgba(255,255,255,0.18)`

**Dock item styling** (identical structure):

- `--scale` CSS variable for magnification
- `transform-origin: bottom center`
- `transition: transform 0.16s cubic-bezier(0.2, 0.7, 0.2, 1.2)`
- SVG icons with `.ico` class (24×24) — NOT emoji text
- Tooltip `.tip` above each item (counter-scaled `1/var(--scale)`)
- Toggle state: accent gradient glow + running dot indicator below

**Flyout panels** (identical structure):

- Fixed bottom 136px, centered horizontally
- `border-radius: 18px`, `width: 240px`, `padding: 16px 18px 18px`
- Same glassmorphism backdrop as dock
- Slider tracks: custom appearance, 7px height, rounded, gradient backgrounds
- Slider thumbs: 19px radial-gradient circles with glow shadow

**Description card** (identical structure):

- Fixed `top: 154px; left: 28px`, max-width 340px
- Same glassmorphism style with `border-left: 3px solid` accent
- Typewriter text reveal with blinking cursor, `.desc-label` uppercase header

**Title overlay** (identical structure):

- Fixed `top: 28px; left: 28px`, `.title-card` with glassmorphism
- `h1` with gradient text + shimmer animation
- Subtitle below with scene-specific styling

**Accent colors** (scene-specific):

- LanternLake: Warm gold/amber (`#ffcc44`, `#ffaa22`, `#ff8800`)
- Compared to: Pagoda (sakura pink), Archipelago (teal/gold), NordicIcePalace (ice blue/cyan)

### Dock Buttons (7 items + separators)

| Button        | Action                             | Icon              |
| ------------- | ---------------------------------- | ----------------- |
| Lanterns      | Toggle lantern settings flyout     | Lantern/flame SVG |
| Fireflies     | Toggle fireflies on/off            | Sparkle/star SVG  |
| Boat          | Toggle boat lantern release on/off | Boat SVG          |
| ─ separator ─ |                                    |                   |
| Auto-orbit    | Toggle camera auto-rotation        | Orbit/refresh SVG |
| Shadows       | Toggle shadow rendering            | Light bulb SVG    |
| Reflections   | Toggle water reflection intensity  | Water/wave SVG    |
| ─ separator ─ |                                    |                   |
| Home          | Navigate to `../index.html`        | Home SVG          |

### Flyout Panels

**Lantern Panel:**

- Count slider (20–150, default 80): Number of sky lanterns
- Speed slider (20–200, default 100): Drift speed multiplier (maps to 0.2x–2.0x)
- Release interval slider (4–20 seconds, default 10): Time between boat releases

### Magnification Formula (shared across all projects)

```
scale = 1.0 + 0.55 * cos(distance / 95 * π/2) when distance < 95px
```

---

## 6. **Camera & Navigation**

### OrbitControls Configuration (same pattern as other scenes)

- **Start position**: (45, 25, 45) looking at (0, 5, 0)
- **FOV**: 50°
- **Damping**: enabled, factor 0.06
- **Distance limits**: 18–120 units
- **Polar angle max**: 0.52π (prevents flipping below island)
- **Auto-rotate**: enabled by default, speed 0.25
- **Home position**: Reset to start with smooth lerp (1.5 seconds)

---

## 7. **Project Structure**

```
LanternLake/
├── css/
│   └── styles.css              # Glassmorphism (matching all other scenes)
├── js/
│   ├── main.js                 # Scene setup, renderer, animation loop, UI wiring
│   ├── scene-builder.js        # Terrain, lake, boat, dock, vegetation, hills
│   ├── voxel-world.js          # InstancedMesh-based voxel rendering engine
│   ├── lanterns.js             # Sky lantern system + boat release mechanic
│   ├── effects.js              # Fireflies, water reflections, willow sway, clouds
│   ├── ui.js                   # Dock, flyout panels, magnification, typewriter
│   └── palette.js              # Color palette definitions
├── vendor/
│   ├── three.module.js         # Three.js library
│   └── OrbitControls.js        # Camera orbit controls
└── index.html                  # Entry point (minimal — dock/panels built in JS)
```

---

## 8. **Technical Specifications**

### Performance Targets

- Static voxel count: ~12,000–18,000 (terrain + boat + vegetation + shoreline)
- Active lantern particles: 80 default (adjustable 20–150)
- Firefly particles: 40 default
- Target framerate: 60 FPS on mid-range devices
- Material batches: 8–12 InstancedMesh groups

### Color Palette (Hex Values)

| Element          | Color        | Hex     |
| ---------------- | ------------ | ------- |
| Sky horizon      | Warm Amber   | #ffb347 |
| Sky mid-low      | Coral Rose   | #ff6b6b |
| Sky mid-high     | Deep Purple  | #7b2d8b |
| Sky zenith       | Dark Indigo  | #1a0d2e |
| Water surface    | Deep Purple  | #2d1b4e |
| Water reflection | Warm Gold    | #c9943a |
| Lantern paper    | Cream Gold   | #fff4d6 |
| Lantern glow     | Bright Gold  | #ffcc44 |
| Boat wood        | Dark Walnut  | #5c3a1e |
| Grass            | Rich Green   | #2d6b3a |
| Sand             | Warm Tan     | #d4b896 |
| Willow leaves    | Sage Green   | #6b8c5a |
| Firefly          | Yellow-Green | #ccff66 |
| Hill silhouette  | Night Purple | #1a0d2e |
| Fog              | Warm Purple  | #2d1845 |
| Accent (UI)      | Gold         | #ffcc44 |

### Animation Constants

- Lantern upward drift: 0.3–0.8 units/sec (randomized)
- Lantern lateral drift: 0.1–0.3 units/sec
- Lantern glow pulse: 3–5 second period (sine wave)
- Lantern fade-out threshold: Y=90
- Boat release interval: 8–12 seconds (adjustable 4–20)
- Boat release rise: Y=2→Y=8 over 3 seconds
- Boat sway: ±0.3 units, 6-second period
- Firefly blink cycle: 2–4 seconds (random)
- Willow sway: ±0.2 units, staggered by height
- Cloud drift: 0.002 units/frame
- Water ripple: 0.1 amplitude, multi-frequency sine
- Typewriter speed: 38ms per character, appears after 1800ms delay

---

## 9. **Implementation Consistency Checklist**

These elements MUST match across all four VoxelArt scenes:

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

---

## 10. **Success Criteria**

✅ Lake renders with deep reflective water showing lantern glow
✅ 60–100 sky lanterns drift upward with visible warm glow and gentle sway
✅ Boat releases one lantern at a time with smooth rise animation
✅ Sunset sky gradient evokes the _Tangled_ lantern scene atmosphere
✅ Fireflies blink and wander near shoreline vegetation
✅ Willow trees sway gently with cascading canopy
✅ Water reflections animate based on lantern positions
✅ UI dock matches all other scenes' glassmorphism style exactly
✅ Dock magnification formula identical across all scenes
✅ Flyout panel controls lantern count, speed, and release interval
✅ Typewriter description reveals correctly on initial load
✅ 60 FPS maintained with all systems active
✅ 9-second watchdog catches failed loads
✅ Dreamy, magical atmosphere — warm, romantic, enchanting mood throughout

---

**Use vendored Three.js and OrbitControls, vanilla JavaScript with ES modules, CSS3 glassmorphism. The UI must be visually harmonious with FloatingArchipelago, PagodaGarden, and NordicIcePalace — same glass style, same dock mechanics, scene-specific warm gold accent colors only.**
