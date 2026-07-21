// ---------------------------------------------------------------------------
//  AURORA — Aurora Borealis wave bands with custom ShaderMaterial
// ---------------------------------------------------------------------------
import * as THREE from '../vendor/three.module.js';
import { PAL } from './palette.js';

const AURORA = {
    bandCount: 3,
    bandSpacing: 4,       // voxel units vertical offset between bands
    baseY: 48,
    width: 100,
    depth: 50,
    segmentsW: 64,
    segmentsH: 16,
    defaultSpeed: 1.0,
    cyclePeriod: 20,      // seconds for full hue rotation
    defaultIntensity: 1.0,
};

// Vertex shader: sine-based Y displacement with time uniform
const vertexShader = /* glsl */ `
    uniform float uTime;
    uniform float uSpeed;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec3 pos = position;
        pos.y += sin(pos.x * 0.1 + uTime * uSpeed) * 3.0;
        pos.y += sin(pos.x * 0.05 + uTime * uSpeed * 0.7) * 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

// Fragment shader: gradient with alpha blending, color uniforms
const fragmentShader = /* glsl */ `
    uniform vec3 uColorPrimary;
    uniform vec3 uColorSecondary;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
        float alpha = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
        alpha *= uIntensity * (0.35 + 0.4 * sin(vUv.x * 3.14159));
        vec3 color = mix(uColorPrimary, uColorSecondary, vUv.y);
        gl_FragColor = vec4(color, alpha);
    }
`;

/**
 * Create aurora borealis wave bands and return the AuroraAPI.
 * @param {{ scene: THREE.Scene, root: THREE.Group }} params
 * @returns {AuroraAPI}
 */
export function createAurora({ scene, root }) {
    const auroraGroup = new THREE.Group();
    auroraGroup.name = 'aurora';

    // Default colors from palette (green-cyan for Green Night preset)
    const defaultPrimary = new THREE.Color(PAL.aurora[0]);   // #00ff88
    const defaultSecondary = new THREE.Color(PAL.aurora[1]); // #00e5ff

    const bands = [];

    for (let i = 0; i < AURORA.bandCount; i++) {
        const geometry = new THREE.PlaneGeometry(
            AURORA.width,
            AURORA.depth,
            AURORA.segmentsW,
            AURORA.segmentsH
        );

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0.0 },
                uSpeed: { value: AURORA.defaultSpeed },
                uColorPrimary: { value: defaultPrimary.clone() },
                uColorSecondary: { value: defaultSecondary.clone() },
                uIntensity: { value: AURORA.defaultIntensity },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position each band with vertical spacing
        const bandY = AURORA.baseY + i * AURORA.bandSpacing;
        mesh.position.set(0, bandY, -10);

        // Tilt toward the camera (~60° from vertical) so bands are visible from default orbit
        mesh.rotation.x = -Math.PI / 3;

        mesh.name = `aurora-band-${i}`;
        mesh.frustumCulled = false;

        bands.push({ mesh, material });
        auroraGroup.add(mesh);
    }

    root.add(auroraGroup);

    // --- Lake Reflection Light -----------------------------------------------
    // PointLight below the aurora to reflect colors onto the frozen lake
    const lakeLight = new THREE.PointLight(
        defaultPrimary.clone(), // color matches primary aurora
        AURORA.defaultIntensity * 0.3, // ≤30% of aurora intensity
        60 // range reaches the lake surface
    );
    lakeLight.position.set(0, 5, 0); // positioned below aurora, above lake
    lakeLight.name = 'aurora-lake-reflection';
    root.add(lakeLight);

    // Track current intensity for reflection calculations
    let currentIntensity = AURORA.defaultIntensity;

    // Color cycle state
    let colorCycleActive = false;
    let cycleTime = 0;

    // HSL cycle keyframes: green → cyan → blue → purple → green
    const cycleColors = [
        { h: 0.38, s: 1.0, l: 0.5 },  // green
        { h: 0.50, s: 1.0, l: 0.5 },  // cyan
        { h: 0.66, s: 1.0, l: 0.5 },  // blue
        { h: 0.78, s: 1.0, l: 0.5 },  // purple
    ];

    // --- AuroraAPI -----------------------------------------------------------
    return {
        /** Update aurora animation — animates wave displacement and lake reflection */
        updateAurora(dt, t) {
            // Update time uniform on all bands for shader-based sine displacement
            for (const band of bands) {
                band.material.uniforms.uTime.value = t;
            }

            // Color cycle: interpolate hue over 20s period
            if (colorCycleActive) {
                cycleTime += dt;
                if (cycleTime >= AURORA.cyclePeriod) {
                    cycleTime -= AURORA.cyclePeriod;
                }

                // Determine which segment we're in (4 segments, 5s each)
                const segmentDuration = AURORA.cyclePeriod / cycleColors.length;
                const segment = Math.floor(cycleTime / segmentDuration);
                const segmentProgress = (cycleTime - segment * segmentDuration) / segmentDuration;

                const fromColor = cycleColors[segment % cycleColors.length];
                const toColor = cycleColors[(segment + 1) % cycleColors.length];

                // Interpolate HSL
                const h = fromColor.h + (toColor.h - fromColor.h) * segmentProgress;
                const s = fromColor.s + (toColor.s - fromColor.s) * segmentProgress;
                const l = fromColor.l + (toColor.l - fromColor.l) * segmentProgress;

                const primary = new THREE.Color();
                primary.setHSL(h, s, l);

                // Secondary is slightly shifted in lightness
                const secondary = new THREE.Color();
                secondary.setHSL(h, s, l * 0.7);

                for (const band of bands) {
                    band.material.uniforms.uColorPrimary.value.copy(primary);
                    band.material.uniforms.uColorSecondary.value.copy(secondary);
                }

                // Sync lake light with cycle color
                lakeLight.color.copy(primary);
            }

            // Update lake reflection light intensity
            // Capped at 30% of aurora intensity (requirement 4.4)
            lakeLight.intensity = currentIntensity * 0.3;

            // Sync lake light color with primary band (when not cycling, stays in sync)
            if (!colorCycleActive) {
                lakeLight.color.copy(bands[0].material.uniforms.uColorPrimary.value);
            }
        },

        /** Set animation speed multiplier [0.2, 3.0] */
        setSpeed(multiplier) {
            const clamped = Math.max(0.2, Math.min(3.0, multiplier));
            for (const band of bands) {
                band.material.uniforms.uSpeed.value = clamped;
            }
        },

        /** Set intensity fraction [0.2, 1.0] */
        setIntensity(fraction) {
            const clamped = Math.max(0.2, Math.min(1.0, fraction));
            currentIntensity = clamped;
            for (const band of bands) {
                band.material.uniforms.uIntensity.value = clamped;
            }
        },

        /** Set colors from time-of-day presets */
        setColors(colorSet) {
            // Only apply manual colors when color cycle is NOT active
            if (colorCycleActive) return;
            const primary = new THREE.Color(colorSet.primary);
            const secondary = new THREE.Color(colorSet.secondary);
            for (const band of bands) {
                band.material.uniforms.uColorPrimary.value.copy(primary);
                band.material.uniforms.uColorSecondary.value.copy(secondary);
            }
            lakeLight.color.set(colorSet.glow);
        },

        /** Enable/disable 20s hue cycling */
        setColorCycleEnabled(on) {
            colorCycleActive = !!on;
            if (on) {
                cycleTime = 0;
            }
            // When disabled, colors hold at their current state (no reset)
        },

        /** Get the aurora group for external access */
        getAuroraGroup() { return auroraGroup; },

        /** Expose bands array for internal use by subsequent tasks */
        _bands: bands,

        /** Expose lake reflection light for testing/internal use */
        _lakeLight: lakeLight,

        /** Get/set current intensity for reflection calculations */
        get _currentIntensity() { return currentIntensity; },

        /** Expose constants for testing/internal use */
        _config: AURORA,
    };
}
