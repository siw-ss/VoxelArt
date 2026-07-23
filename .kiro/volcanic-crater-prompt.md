# 🌋 Volcanic Island Crater Complex – Implementation Prompt

> An active volcanic island with lava flows carving through black obsidian rock formations, steam vents erupting, crystalline mineral deposits catching light, and ash particles drifting across a molten caldera.

---

## 1. **Scene Architecture**

### Central Caldera

- **Crater Bowl** (center of scene): Deep concave depression filled with molten lava pool (emissive orange/red)
- **Rim Walls** (surrounding caldera): Jagged obsidian peaks rising 15–20 voxels above lava surface
- **Lava Channels** (3–4 rivers): Flowing outward from caldera through carved valleys in the rock

### Terrain Zones

- **Obsidian Fields** (inner ring): Smooth black/dark-gray voxel formations with sharp angular geometry
- **Basalt Columns** (mid ring): Hexagonal columnar formations at varying heights, natural basalt patterns
- **Crystal Deposits** (scattered): Clusters of 3–8 voxels in mineral colors (amber, ruby, emerald) catching light
- **Cooled Lava Shelves** (outer ring): Darker, textured ground with cracks showing faint orange glow beneath

### Structures

- **Mining Platforms** (2–3): Wooden/metal scaffolding built into cliff faces, mine cart rails
- **Stone Bridges** (2): Cooled lava bridges spanning lava channels
- **Watchtower** (1): Carved from obsidian on the highest rim point, observation deck
- **Vent Stacks** (4–6): Natural chimney formations where steam escapes

---

## 2. **Voxel Rendering Engine**

### Material System

- **Palette** (10–12 core materials):
  - Obsidian (very dark gray, near-black with subtle purple undertone)
  - Basalt (medium dark gray, slight blue-gray)
  - Molten lava (bright orange-red with emissive)
  - Cooled lava crust (dark red-brown, matte)
  - Lava crack glow (orange emissive, used sparingly in cooled zones)
  - Crystal amber (warm golden with emissive)
  - Crystal ruby (deep red with emissive)
  - Crystal emerald (green with emissive)
  - Metal scaffold (dark iron gray)
  - Wooden platform (charred brown)
  - Steam vent rim (sulfur yellow-green staining)
  - Ash ground (dark charcoal gray)

### Rendering Strategy

- InstancedMesh grouping by material for performance
- Emissive materials for lava, crystals, and crack glow (no extra lights needed)
- Static terrain pre-merged; dynamic particles separate
- Lava pool uses animated emissive intensity for pulsing glow

---

## 3. **Animated Elements**

### Lava Flow

- Lava channels: 100–150 slow-moving particles per channel flowing outward from caldera
- Particle color: gradient from bright yellow (center) → orange → dark red (edges)
- Speed configurable via slider (0.5x–2x)
- Lava pool surface: subtle pulsing emissive (sine wave, 4-second cycle)

### Steam Vents

- 6 vent locations emitting upward particle bursts
- 30–50 particles per vent, rising quickly then dissipating
- Color: white → light gray, fading opacity
- Eruption pattern: intermittent (3-second burst, 2-second pause)

### Ash Particles

- 80–120 ambient ash particles drifting across scene
- Very slow lateral movement with gentle downward drift
- Color: dark gray, very small scale, low opacity
- Density adjustable via UI

### Crystal Shimmer

- Emissive intensity on crystal materials oscillates (0.5–1.0)
- Each cluster has slight phase offset for organic feel
- Night mode: crystals glow more prominently

### Seismic Effect (Toggle)

- Subtle camera shake (±0.1 unit displacement, 2Hz)
- Lava pool intensity increases during rumble
- Steam vent eruption frequency doubles
- Duration: 3-second burst when toggled

---

## 4. **Lighting & Atmosphere**

### Sky Gradient

- **Day**: Deep orange at horizon → dark gray-blue at zenith (volcanic haze)
- **Night**: Dark red at horizon → near-black at zenith, dim red moon

### Directional Lighting

- Main light: warm orange-tinted directional (simulating lava glow from below + sun)
- Secondary fill: cool blue-gray from above (sky ambient)
- Shadows: PCF soft, medium resolution

### Emissive Sources

- **Lava pool**: Strong orange-red emissive (intensity 0.8–1.0)
- **Lava channels**: Medium emissive (0.5–0.7)
- **Crystals**: Low-medium emissive (0.3–0.6, pulsing)
- **Crack glow**: Very subtle (0.2–0.4)
- **Night mode**: All emissives increase by 0.2

### Fog & Atmosphere

- Volumetric-style distance fog: dark smoky gray
- Day: medium density, warm tint
- Night: heavy density, dark red-orange tint
- Heat haze effect: subtle distortion near lava (optional shader)

---

## 5. **Interactive Controls & UI** (Glassmorphism Design)

### Dock (Bottom Center, macOS-style magnification)

- **Buttons** (hover-magnify, 40px base → 60px on hover):
  - Auto-orbit toggle (camera rotates around caldera center)
  - Lava flow toggle (start/stop particle flow)
  - Steam intensity toggle (vents active/dormant)
  - Seismic rumble trigger (single burst effect)
  - Night mode toggle (switches lighting/sky/fog)
  - Home (reset camera to start position)

### Side Panels (Right-align, toggle-able)

- **Lava Flow Speed Slider** (0.5x – 2.0x multiplier)
- **Ash Density Slider** (0 – 150 particles)
- **Crystal Glow Intensity** (0.2 – 1.0)
- **Time of Day Slider** (0–24, affects sun angle and atmosphere)

### Cards

- **Description Card**: Typewriter reveal on load describing the volcanic complex
- **Mineral Legend**: Shows crystal types and their colors
- **Error Display**: On-screen error reporting with 9-second timeout

### Visual Style

- Frosted glass background (backdrop blur, semi-transparent) with warm orange tint
- Subtle ember-colored border glows on active elements
- Smooth color transitions (200–400ms)
- Icons: flame, mountain, crystal, wind themed

---

## 6. **Camera & Navigation**

### OrbitControls Configuration

- **Orbit Center**: Positioned at caldera center
- **Zoom Range**: 20 units (crater detail) to 90 units (full island view)
- **Damping**: 0.06 for smooth deceleration
- **Auto-Rotation**: 0.08 rad/sec around caldera
- **Vertical Limits**: Prevent camera from going below lava pool level

### Home Position

- Camera at ~(45, 35, 45) looking toward caldera center
- Slight downward angle to showcase lava pool and channels

---

## 7. **Project Structure**

```
VolcanicCrater/
├── css/
│   └── styles.css              # Glassmorphism, dock animations, UI panels
├── js/
│   ├── main.js                 # Scene setup, renderer, animation loop, init
│   ├── scene-builder.js        # Terrain geometry, structures, crystal placement
│   ├── voxel-world.js          # InstancedMesh rendering engine
│   ├── effects.js              # Lava flow, steam vents, ash, seismic effects
│   ├── palette.js              # Material color definitions
│   └── ui.js                   # Dock interactions, panels, sliders, toggles
├── vendor/
│   ├── three.module.js         # Three.js library
│   └── OrbitControls.js        # Camera controls
└── index.html                  # Entry point
```

---

## 8. **Technical Specifications**

### Performance Targets

- Voxel count: ~12,000–18,000 static voxels
- Particle count: ~500–700 active (lava + steam + ash)
- Target framerate: 60 FPS on mid-range devices
- Material batches: 10–12 InstancedMesh groups

### Color Palette (Hex Values)

| Element         | Color             | Hex     |
| --------------- | ----------------- | ------- |
| Obsidian        | Near-Black Purple | #1a1a2e |
| Basalt          | Dark Blue-Gray    | #2d3436 |
| Molten Lava     | Bright Orange     | #FF4500 |
| Lava Glow       | Hot Yellow        | #FF8C00 |
| Cooled Lava     | Dark Red-Brown    | #4a1c1c |
| Crack Glow      | Ember Orange      | #FF6B35 |
| Crystal Amber   | Golden            | #FFBF00 |
| Crystal Ruby    | Deep Red          | #DC143C |
| Crystal Emerald | Bright Green      | #00C853 |
| Metal Scaffold  | Iron Gray         | #4a4a4a |
| Wood (charred)  | Dark Brown        | #3e2723 |
| Sulfur Stain    | Yellow-Green      | #9ACD32 |
| Ash Ground      | Charcoal          | #2c2c2c |
| Sky Day Horizon | Deep Orange       | #FF6347 |
| Sky Day Zenith  | Gray-Blue         | #4a5568 |
| Sky Night       | Dark Red          | #2d0a0a |
| Steam           | Light Gray        | #d0d0d0 |

### Animation Constants

- Lava particle lifetime: 6–10 seconds (slow flow)
- Steam particle lifetime: 2–3 seconds (fast rise)
- Ash particle lifetime: 8–12 seconds (ambient drift)
- Lava pool pulse: 4-second sine cycle
- Crystal shimmer: 3-second cycle with phase offsets
- Seismic burst duration: 3 seconds
- Steam vent cycle: 3s on, 2s off
- Auto-orbit speed: 0.08 rad/sec
- Typewriter speed: 50ms per character

---

## 9. **Implementation Tips**

### Caldera Construction

- Build crater as inverted dome: place voxels in concentric rings, decreasing height toward center
- Lava pool is a flat plane of emissive voxels at the lowest point
- Rim peaks are randomized height columns along the outer edge

### Lava Channel Carving

- Define 3–4 radial paths from center outward
- Remove terrain voxels along path (3–4 voxels wide)
- Place emissive lava voxels at channel floor level
- Particles flow along these predefined paths

### Basalt Column Generation

- Group hexagonal clusters of 4–7 columns
- Each column is a stack of voxels (6–15 height, randomized)
- Slight position jitter for natural appearance

### Crystal Placement

- Scatter 8–12 crystal clusters across the terrain
- Each cluster: 3–8 voxels in angular formations (tilted stacks)
- Randomly assign amber/ruby/emerald per cluster
- Place on elevated positions (cliff edges, column tops)

---

## 10. **Success Criteria**

✅ Caldera renders with visible molten lava pool (emissive, pulsing)
✅ 3–4 lava channels flow outward with particle animation
✅ Steam vents emit intermittent bursts
✅ Obsidian terrain has dramatic angular silhouette
✅ Crystal deposits glow and shimmer
✅ UI dock responds to hover with smooth magnification
✅ Lava flow speed slider works in real-time
✅ Seismic rumble creates visible camera shake and intensity boost
✅ Night mode deepens atmosphere and enhances emissives
✅ Ash particles drift across scene continuously
✅ 60 FPS maintained with all effects active
✅ Typewriter description reveals on load

---

**Use vendored Three.js and OrbitControls, vanilla JavaScript with ES modules, CSS3 glassmorphism, no build step required.**
