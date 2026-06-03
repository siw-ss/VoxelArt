Create an interactive 3D voxel scene using Three.js called "Cherry Blossom Pagoda Garden" with:

1. **Scene**: A floating voxel island in a pastel sky with a five-tier pagoda (vermillion pillars, teal roofs, gold eaves), cherry blossom/pine/maple trees, koi pond with sandy bed and stone rim, curved stone path, raised plaza with steps, scattered rocks, bushes and flowers.

2. **Voxel Rendering**: Custom InstancedMesh-based engine that groups voxels by material for efficient rendering of thousands of cubes.

3. **Animated Elements**: 
   - Up to 900 drifting cherry petals with per-petal sway, rotation and spin
   - Six slow-drifting cloud formations
   - 500 stars revealed in night mode
   - Glowing emissive stone lanterns and red hanging lanterns with flicker

4. **Lighting**: Directional sun with PCF soft shadows, hemisphere + ambient lighting, emissive lanterns, glowing pagoda finial orb.

5. **UI** (glassmorphism design):
   - macOS-style dock with hover magnification
   - Toggle buttons: auto-orbit, falling petals, shadows, night mode, home
   - Sun panel: drag sun across arc to change time of day (sunrise to noon) with dynamic lighting
   - Petal-count slider (10–900)
   - Typewriter description card reveal on load
   - Error handling with on-screen reporting

6. **Camera**: OrbitControls for orbit, zoom, and pan with damping.

Use vendored Three.js and OrbitControls, vanilla JavaScript with ES modules, CSS3 glassmorphism.
