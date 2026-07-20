# 🏔️ Nordic Ice Palace – Implementation Prompt

> A floating voxel island of eternal ice, crowned by a crystalline palace with four glowing spires, surrounded by a frozen lake, pine forests, ice sculptures, and animated aurora borealis dancing overhead — set against three distinct nighttime sky presets.

---

## 1. **Scene Architecture**

### Floating Island

- **Circular terrain** (radius 35, centered Y=0): Snow-covered mesa surface with rock strata beneath (5 layers, tapered underside narrowing to a pointed tip)
- **Geological layering**: White snow surface → gray-blue rock strata → darker rock descending into a stalactite-like point
- **Frozen lake ring**: Translucent 3-layer ice ring (inner radius 8, outer radius 31) with progressive depth coloring — lightest at surface (Y=-1), darkest at Y=-3

### Ice Palace (Center)

- **Raised platform** (Y=-1 to Y=1, extends 2 voxels beyond hall): Stone-colored base elevating the palace above the lake
- **Great Hall** (14×14, Y=2 base): Hollow ice walls rising 12 voxels, flat roof slab at Y=15, floor at Y=2
- **Four corner spires**: 2×2 columns rising 14 voxels above roof (Y=16 to Y=29), each with a 1×1 glowing tip (3 voxels, emissive cyan)
- **Flying buttresses**: Diagonal supports from each spire down to hall mid-wall
- **Ice bridges** (2): Spanning NW↔NE and SW↔SE spires above the roofline (Y=18), 2-voxel-wide deck with periodic railings
- **Entrance stairways** (2): North and south, 3-wide steps leading from lake level up to platform

### Decorative Elements

- **Ice sculptures** (≥6): Clusters of 3–8 emissive white/cyan voxels arranged evenly at radius 9–14 around the palace
- **Pine trees** (8–15): Trunk (2–4 tall) with pyramid canopy (3–5 layers) and snow cap, scattered in the vegetation ring (radius 31–35)
- **Rocks** (10–20): 1–3 voxel clusters in the vegetation ring
- **Minimum spacing**: 3 voxels between all placed objects

---

## 2. **Voxel Rendering Engine**

### Material System (same InstancedMesh pattern as Archipelago & Pagoda)

- **Palette** (9 material groups):
  - Ice walls: cyans and whites (`#b0e0e6`, `#e0ffff`, `#87ceeb`, `#aff0ef`, `#caf4f4`)
  - Snow surface: whites and pale blues (`#f8f8ff`, `#eef5ff`, `#dceaf5`)
  - Rock strata: grays and dark blues (`#5a6578`, `#4a5568`, `#3b4559`)
  - Frozen lake: blues with progressive depth (`#5a9ec7` → `#2d6a8f`)
  - Spire glow: emissive blues (`#88ccff`, `#aaeeff`, emissiveIntensity 0.4)
  - Pine canopy: dark greens (`#1a4d2e`, `#2d6b45`)
  - Pine trunk: browns (`#5c3a1e`, `#6b4528`)
  - Platform stone: neutral grays (`#7a8a9a`, `#6b7b8b`)
  - Frost overlay: pale blue-whites (`#e8f4f8`, `#d4eef6`, opacity 0.8)

### Rendering Strategy

- Custom `InstancedMesh` grouping by material signature (consistent with Archipelago/Pagoda engine)
- Emissive materials for spire tips, ice sculptures, and frost overlay
- Separate `InstancedMesh` groups for season-toggle overlays (frost layer, thick ice layer)

---

## 3. **Animated Elements**

### Aurora Borealis (Signature Feature)

- **3 shader bands** at Y=55+ with vertical spacing: PlaneGeometry (80×40, 64×16 segments) with custom ShaderMaterial
- **Vertex shader**: Sine-based Y displacement driven by time uniform for wave motion
- **Fragment shader**: Gradient alpha blending between primary/secondary colors, edge fade via smoothstep
- **Additive blending**, transparent, depthWrite false, DoubleSide
- **Lake reflection**: PointLight below aurora (intensity ≤30% of aurora) matching aurora primary color
- **Color cycle mode**: 20-second HSL rotation through green → cyan → blue → purple

### Snow Particles

- **InstancedMesh** of white cubes (max 800, default 300)
- Spawn at Y=40–60 within radius 40, fall at 1–3 units/sec with lateral drift (0.5–2.0)
- Per-particle size variation (0.2–0.5), respawn on hitting floor or boundary
- Adjustable count via slider (0–800)

### Starfield

- **≥400 stars** (Points geometry) in a 500×200×500 volume
- PointsMaterial: pale yellow (`#FFFACD`), size 1.5, no size attenuation, opacity 0.9
- Always visible (all presets are nighttime)

### Spire & Bridge Lights

- **6 PointLights** (4 spire tops + 2 bridge midpoints): Color `#aaeeff`, intensity 2.5, range 30
- **Flicker animation**: Sinusoidal pulse at 2.1 Hz modulating intensity

---

## 4. **Lighting & Atmosphere**

### Sky (Canvas gradient texture — 3-stop vertical gradient)

- Controlled by time-of-day presets (all nighttime variants)
- **Green Night** (default): `#0a1a1a` → `#0d2b2b` → `#1a3d3d`
- **Midnight Blue**: `#050510` → `#0a0f2e` → `#1a2545`
- **Purple Dusk**: `#1a0a2e` → `#2d1b4e` → `#3d2060`

### Lighting Setup

- **HemisphereLight**: Sky/ground colors from active preset, intensity ~0.65–0.8
- **DirectionalLight** (moon): Color `#aaccff`, intensity 0.2, position (40, 80, -30), casts PCF soft shadows (2048×2048 map)
- **Fill DirectionalLight**: Color `#667799`, intensity 0.12, position (-40, 30, 40)
- **Fog**: Matching preset fog color, near=120, far=280

### Time-of-Day System

- **3 presets** with smooth 1.5-second linear interpolation between them
- Interpolates: sky gradient, fog color, hemisphere sky/ground colors, hemisphere intensity, aurora colors
- Aurora color sync: Each preset defines primary/secondary/glow colors for the aurora bands

---

## 5. **Interactive Controls & UI** (Glassmorphism — Harmonized with Archipelago & Pagoda)

### ⚠️ UI CONSISTENCY REQUIREMENTS (Critical)

The UI must follow the same visual system as FloatingArchipelago and PagodaGarden:

**Dock styling** (identical across all three projects):

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

**Accent colors** (scene-specific, applied to the shared structure):

- NordicIcePalace: Ice blue/cyan (`#7fdbff`, `#aaeeff`, `#88ccff`)
- Compared to Pagoda (sakura pink `#ff9ebb`, `#ffd1e0`) and Archipelago (teal/gold `#00E5FF`, `#FFD700`)

### Dock Buttons (7 items + separators)

| Button        | Action                           | Icon              |
| ------------- | -------------------------------- | ----------------- |
| Aurora        | Toggle aurora flyout panel       | Aurora/wave SVG   |
| Snow          | Toggle snow flyout panel         | Snowflake SVG     |
| Time          | Toggle time-of-day flyout panel  | Clock SVG         |
| ─ separator ─ |                                  |                   |
| Auto-orbit    | Toggle camera auto-rotation      | Orbit/refresh SVG |
| Shadows       | Toggle shadow rendering          | Light bulb SVG    |
| Season        | Toggle thick ice / frost overlay | Ice crystal SVG   |
| ─ separator ─ |                                  |                   |
| Home          | Navigate to `../index.html`      | Home SVG          |

### Flyout Panels

**Aurora Panel:**

- Speed slider (20–300, maps to 0.2x–3.0x)
- Intensity slider (20–100, maps to 20%–100%)
- Color Cycle checkbox (enables 20s HSL rotation)

**Snow Panel:**

- Density slider (0–800, default 300)

**Time-of-Day Panel:**

- 3 segmented-control buttons: Green Night, Midnight Blue, Purple Dusk
- Active button highlighted with accent glow
- Transitions take 1.5 seconds with linear interpolation

### Magnification Formula (shared across all three projects)

```
scale = 1.0 + 0.55 * cos(distance / 95 * π/2) when distance < 95px
```

---

## 6. **Camera & Navigation**

### OrbitControls Configuration (same pattern as Archipelago/Pagoda)

- **Start position**: (55, 35, 55) looking at (0, 8, 0)
- **FOV**: 48°
- **Damping**: enabled, factor 0.06
- **Distance limits**: 20–160 units
- **Polar angle max**: 0.52π (prevents flipping below island)
- **Auto-rotate**: enabled by default, speed 0.3

---

## 7. **Project Structure**

```
NordicIcePalace/
├── css/
│   └── styles.css              # Glassmorphism (matching Archipelago/Pagoda pattern)
├── js/
│   ├── main.js                 # Scene setup, renderer, animation loop, UI wiring
│   ├── scene-builder.js        # Terrain, palace, lake, sculptures, vegetation, overlays
│   ├── voxel-world.js          # InstancedMesh-based voxel rendering engine
│   ├── aurora.js               # Aurora borealis shader bands + lake reflection
│   ├── snow.js                 # InstancedMesh snow particle system
│   ├── time-of-day.js          # Preset manager with color interpolation
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

- Static voxel count: ~15,000–20,000 (terrain + palace + vegetation)
- Active particles: snow 300 (default) + aurora shader (3 planes)
- Target framerate: 60 FPS on mid-range devices
- Material batches: 8–12 InstancedMesh groups

### Animation Constants

- Snow fall speed: 1.0–3.0 units/sec
- Snow drift: 0.5–2.0 lateral units/sec
- Aurora wave speed: 1.0x default (adjustable 0.2x–3.0x)
- Aurora color cycle: 20-second period
- Spire flicker: sine wave at 2.1 Hz
- TOD transition: 1.5 seconds linear interpolation
- Typewriter speed: 38ms per character, appears after 1800ms delay
- Cloud drift: N/A (no clouds in this scene — snow replaces cloud ambiance)

### Season Toggle (Unique to NordicIcePalace)

- **Normal**: Frost overlay hidden, thick ice hidden
- **Thick Ice mode**: Adds 2 extra ice layers (Y=0, Y=1) over the frozen lake ring + reveals frost voxels on palace walls and upper spire sections

---

## 9. **Implementation Consistency Checklist**

These elements MUST match across all three VoxelArt scenes:

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

### Scene-Specific Differentiation (what makes each scene unique)

- **Archipelago**: Teal/gold accents, multi-island layout, waterfalls, crystal bridges, chickens, gravity toggle
- **Pagoda**: Sakura pink accents, single island, cherry petals, koi pond, lanterns, petal count slider
- **NordicIcePalace**: Ice blue/cyan accents, single island, aurora borealis, snow, frozen lake, season toggle, time-of-day presets

---

## 10. **Success Criteria**

✅ Palace renders with 4 glowing spires, flying buttresses, ice bridges, and stairways
✅ Frozen lake shows translucent depth with 3 color layers
✅ Aurora borealis animates with visible wave motion and lake reflection
✅ Snow particles fall naturally with drift and respawn
✅ Time-of-day presets transition smoothly (sky, fog, aurora, lighting)
✅ Season toggle reveals frost overlay and thick ice
✅ UI dock matches Archipelago/Pagoda glassmorphism style exactly
✅ Dock magnification formula identical across all scenes
✅ Flyout panels open/close with same animation as other scenes
✅ Typewriter description reveals correctly on initial load
✅ 60 FPS maintained with all systems active
✅ 9-second watchdog catches failed loads

---

**Use vendored Three.js and OrbitControls, vanilla JavaScript with ES modules, CSS3 glassmorphism. The UI must be visually harmonious with FloatingArchipelago and PagodaGarden — same glass style, same dock mechanics, scene-specific accent colors only.**
