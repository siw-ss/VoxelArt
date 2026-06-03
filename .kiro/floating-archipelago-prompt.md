# 🏝️ Floating Archipelago of Sky Islands – Implementation Prompt

> Multiple disconnected voxel islands suspended at different altitudes in an endless sky, connected by crystal bridges and cascading waterfalls, with ancient temple ruins, sky platforms, and watchtowers.

---

## 1. **Scene Architecture**

### Islands (5 main islands at varying heights)
- **Central Island** (anchor point, y=0): Largest, contains main temple structure with stepped pyramid design, central plaza, palace-like architecture
- **Northern Island** (y=+15): Medium, watchtower structure, cliff face with carved stairs
- **Eastern Island** (y=+8): Small, ancient ruins with crumbling pillars and vine-covered structures
- **Western Island** (y=+5): Medium, elevated platform with hanging gardens, natural rock formations
- **Southern Island** (y=-8): Smallest, floating stone shrine with minimal structure, observation point

### Landmasses
- Each island built with voxel terrain: flat mesa-top surface with sheer cliff edges
- Cliff faces show geological layering (lighter rocks at top, darker at depth)
- Rock outcroppings and boulders scatter across island surfaces
- Ground vegetation: crystalline grass tufts, geometric shrubs, floating moss patches

### Connective Structures
- **Crystal Bridges** (3–4 connecting pairs): Semi-transparent bridge voxels, slightly luminescent (glow in darker zones)
- **Waterfalls** (2–3 cascading from higher to lower islands): Particle-based water flow with mist accumulation at base; water reflects sky color
- Alternative visual: Bridges show ancient magical runes/glyphs along edges

---

## 2. **Voxel Rendering Engine**

### Material System
- **Palette** (8–10 core materials):
  - Stone (light gray, medium gray, dark gray for depth layering)
  - Crystal bridge material (semi-transparent teal with emissive quality)
  - Temple/building brick (warm tan, aged bronze)
  - Natural rock (brown, rust accents)
  - Grass/vegetation (pale green, moss green)
  - Water effect (if static voxels; cyan with slight emissive)
  - Metal accent (gold trim on temple, railings)

### Rendering Strategy
- Custom InstancedMesh grouping by material signature
- Pre-compute static island geometries into single merged meshes per island for performance
- Dynamic waterfalls/water particles separate (separate particle system)
- Emissive material subset for crystal structures (self-illuminated)

---

## 3. **Animated Elements**

### Waterfalls
- 200–300 falling water particles per waterfall, continuous loop
- Particle velocity: downward with slight lateral drift (wind effect)
- Mist formation at base (larger, slower-moving semi-transparent particles)
- Particle color: cyan to white gradient, slight transparency

### Floating Elements
- **Seed Pods** (optional, 20–30 count): Slow orbital drift around islands, subtle rotation
- **Dust/Pollen Particles** (40–60): Very slow drift, catch light in bright zones
- **Cloud Layers** (2–3 cloud formations): Drift horizontally across scene at fixed altitudes below islands

### Environmental Effects
- **Wind Sway**: Subtle per-frame oscillation of waterfalls and vegetation meshes (sine wave animation)
- **Light Shimmer**: Crystal bridge emissive intensity pulses gently (0.7–1.0 intensity)
- **Water Surface Ripple** (if visible from above): Subtle wavy displacement on waterfall base pools

---

## 4. **Lighting & Atmosphere**

### Sky Gradient
- **Default (Day)**: Light cyan at horizon → deep blue at zenith
- **Night**: Deep indigo at horizon → near-black at zenith with 300+ stars

### Directional Lighting
- Main sun (directional light) positioned to cast long shadows across islands
- Shadow quality: PCF soft shadows (Medium resolution sufficient)
- Light color: Warm white (day) → cool blue-white (dusk) → pale blue (night)
- Ambient + hemisphere lighting: Soft fill from sky gradient

### Emissive Elements
- **Crystal bridges**: Glow intensity 0.4–0.6, color teal (#00E5FF)
- **Temple roof details**: Subtle gold glow on metal trim
- **Waterfalls**: Slight luminescence, color blends with water particles
- **Nocturnal glow** (night mode): Ancient runes on temples faintly visible with purple emissive

### Fog
- Distance fog enabled; density increases at extreme altitudes
- Day fog color: light cyan with high opacity range (50–200 units)
- Night fog color: deep blue with slightly reduced opacity

---

## 5. **Interactive Controls & UI** (Glassmorphism Design)

### Dock (Bottom Center, macOS-style magnification)
- **Buttons** (hover-magnify, 40px base → 60px on hover):
  - Auto-orbit toggle (camera rotates around central island)
  - Island rotation toggle (all islands slowly rotate around vertical axis)
  - Gravity toggle (islands shift to new random altitudes with lerp animation)
  - Weather toggle (clouds, pollen density increase/decrease)
  - Night mode toggle (switches sky, lighting, fog, reveals stars)
  - Home (reset camera to start position)

### Side Panels (Right-align, toggle-able)
- **Altitude Map** (shows 5 islands as dots at their y-height; current camera altitude indicator)
- **Time of Day Slider** (0–24, affects sun angle and light color)
  - 0–6: Sunrise (orange → yellow)
  - 6–12: Daytime (bright white)
  - 12–18: Sunset (yellow → orange → purple)
  - 18–24: Night (stars visible, moon glow)

### Cards
- **Description Card**: Typewriter reveal on load with 2–3 sentences about the archipelago
- **Island Legend**: Shows names and brief descriptions (Central Temple, Watchtower Peak, etc.)
- **Error Display**: On-screen error reporting with 9-second timeout

### Visual Style
- Frosted glass background (backdrop blur, semi-transparent)
- Subtle drop shadows and border glows
- Smooth color transitions (200–400ms)
- Icons with smooth scale/fade on interaction

---

## 6. **Camera & Navigation**

### OrbitControls Configuration
- **Orbit Center**: Positioned at Central Island (approximate mid-point)
- **Zoom Range**: Allow zoom from ~20 units (close island detail) to ~100 units (full archipelago view)
- **Damping**: Enable damping (0.05–0.08) for smooth deceleration
- **Auto-Rotation**: Optional toggle, rotates ~0.1 rad/sec around center

### Camera Paths (Optional)
- **Home Position**: Positioned at ~(50, 30, 50) looking toward Central Island
- **Island Closeups**: Camera lerp to predefined positions per island when clicked/selected (if desired)

---

## 7. **Project Structure** (Recommended)

```
FloatingArchipelago/
├── css/
│   └── styles.css              # Glassmorphism, dock animations, UI panels
├── js/
│   ├── main.js                 # Scene setup, renderer, animation loop, init
│   ├── scene-builder.js        # Island geometry construction, placement logic
│   ├── voxel-world.js          # InstancedMesh rendering engine
│   ├── effects.js              # Waterfalls, particles, cloud systems
│   ├── lighting.js             # Sun/lighting setup, time-of-day transitions
│   ├── ui.js                   # Dock interactions, panels, toggles
│   ├── palette.js              # Material color definitions
│   ├── controls.js             # OrbitControls wrapper, camera management
│   └── config.js               # Constants (island positions, particle counts, etc.)
├── vendor/
│   ├── three.module.js         # Three.js library
│   └── OrbitControls.js        # Camera controls
└── index.html                  # Entry point
```

---

## 8. **Technical Specifications**

### Performance Targets
- Voxel count: ~15,000–20,000 static voxels (across all islands)
- Particle count: ~600–800 active particles (waterfalls + ambient)
- Target framerate: 60 FPS on mid-range devices
- Material batches: 8–12 InstancedMesh groups

### Color Palette (Hex Values)
| Element | Color | Hex |
|---------|-------|-----|
| Sky (day horizon) | Light Cyan | #87CEEB |
| Sky (day zenith) | Deep Blue | #1E90FF |
| Island Stone (base) | Light Gray | #C0C0C0 |
| Island Stone (dark) | Slate Gray | #708090 |
| Crystal Bridge | Teal Glow | #00E5FF |
| Temple Brick | Warm Tan | #D2B48C |
| Grass | Pale Green | #90EE90 |
| Water/Mist | Cyan | #00FFFF |
| Metal Trim | Gold | #FFD700 |
| Sky (night) | Deep Indigo | #191970 |
| Star | Pale Yellow | #FFFACD |

### Animation Constants
- Waterfall particle lifetime: 3–5 seconds
- Mist particle lifetime: 2–3 seconds (slower decay)
- Cloud drift speed: 0.005 units/frame
- Island rotation speed (when toggled): 0.001 rad/frame
- Altitude shift animation (gravity toggle): 2-second lerp per island
- Crystal bridge glow pulse: 3-second cycle (sine wave)
- Typewriter speed: 50ms per character

### Audio (Optional Enhancement)
- Ambient wind whisper loop
- Waterfall gentle rush (lower volume)
- Crystal chime on interaction (small reverb)

---

## 9. **Implementation Tips**

### Island Geometry Construction
- Define island shape templates (plateau mesh) and scale/position them
- Use noise or hand-crafted voxel maps for irregular cliff edges
- Layer voxels by height for depth perception (darker → lighter as you go down cliffs)

### Waterfall Implementation
- Use particle system with gravity constraint
- Emit particles from bridge edge/drop point
- Fade opacity as particles fall (not instant deletion)
- Pool/accumulation zone at base (slower particles)

### Time-of-Day System
- Store sun angle (0–360°) and time value (0–24)
- Map time to sun position: angle = (time % 24) * 15 degrees
- Interpolate light color based on time ranges (sunrise/sunset have color shifts)
- Adjust fog density based on time (thicker at dusk/night)

### Crystal Bridge Emissive Effect
- Use emissive material with low-intensity texture or procedural glow
- Pulse emissive strength using `Math.sin(elapsed * frequency)`
- Optional: add slight bloom post-processing for glow halo

---

## 10. **Success Criteria**

✅ All 5 islands render with distinct silhouettes and elevations
✅ Waterfalls animate smoothly with visible particle flow
✅ Crystal bridges glow and connect islands visually
✅ UI dock responds to hover with smooth magnification
✅ Time-of-day slider adjusts lighting and sky color in real-time
✅ Gravity toggle animates islands to new altitudes
✅ Camera orbits smoothly with no frame drops (60 FPS target)
✅ Night mode reveals stars and switches to appropriate lighting
✅ Typewriter description reveals correctly on initial load
✅ All toggles persist state during session

---

**Use vendored Three.js and OrbitControls, vanilla JavaScript with ES modules, CSS3 glassmorphism, no build step required.**
