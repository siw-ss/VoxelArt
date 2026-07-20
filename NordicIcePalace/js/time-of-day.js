// ---------------------------------------------------------------------------
//  TIME-OF-DAY — Preset system with linear color interpolation
// ---------------------------------------------------------------------------

/**
 * Preset definitions for the three time-of-day modes.
 */
export const PRESETS = {
    greenNight: {
        name: 'greenNight',
        sky: ['#0a1a1a', '#0d2b2b', '#1a3d3d'],
        aurora: { primary: '#00FF88', secondary: '#00E5FF', glow: '#00FF88' },
        ambient: '#88FFAA',
        ambientIntensity: 0.15,
        fog: '#0d2b2b',
        hemiSky: '#1a4a3a',
        hemiGround: '#0a0a0a',
        hemiIntensity: 0.7,
    },
    midnightBlue: {
        name: 'midnightBlue',
        sky: ['#050510', '#0a0f2e', '#1a2545'],
        aurora: { primary: '#88CCFF', secondary: '#FFFFFF', glow: '#4488FF' },
        ambient: '#6688CC',
        ambientIntensity: 0.12,
        fog: '#0a0f2e',
        hemiSky: '#1a2545',
        hemiGround: '#050505',
        hemiIntensity: 0.65,
    },
    purpleDusk: {
        name: 'purpleDusk',
        sky: ['#1a0a2e', '#2d1b4e', '#3d2060'],
        aurora: { primary: '#FF44FF', secondary: '#AA66FF', glow: '#CC44FF' },
        ambient: '#BB88DD',
        ambientIntensity: 0.14,
        fog: '#2d1b4e',
        hemiSky: '#3d2060',
        hemiGround: '#0a0505',
        hemiIntensity: 0.65,
    },
};

/**
 * Linear interpolation between two hex color strings.
 * @param {string} c1 - Source hex color '#RRGGBB'
 * @param {string} c2 - Target hex color '#RRGGBB'
 * @param {number} t - Progress in [0, 1]
 * @returns {string} Interpolated hex color '#RRGGBB'
 */
export function lerpColor(c1, c2, t) {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);

    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);

    const r = Math.round(r1 + t * (r2 - r1));
    const g = Math.round(g1 + t * (g2 - g1));
    const b = Math.round(b1 + t * (b2 - b1));

    return '#' + r.toString(16).padStart(2, '0')
        + g.toString(16).padStart(2, '0')
        + b.toString(16).padStart(2, '0');
}

/**
 * Linear interpolation between two numeric values.
 */
function lerpNum(a, b, t) {
    return a + t * (b - a);
}

/**
 * Deep-clone a preset's interpolated color/intensity values.
 */
function snapshotPreset(preset) {
    return {
        name: preset.name,
        sky: [...preset.sky],
        aurora: { ...preset.aurora },
        ambient: preset.ambient,
        ambientIntensity: preset.ambientIntensity,
        fog: preset.fog,
        hemiSky: preset.hemiSky,
        hemiGround: preset.hemiGround,
        hemiIntensity: preset.hemiIntensity,
    };
}

/**
 * Interpolate all color/intensity fields between two presets at progress t.
 */
function interpolatePresets(from, to, t) {
    return {
        name: t >= 1.0 ? to.name : from.name,
        sky: from.sky.map((c, i) => lerpColor(c, to.sky[i], t)),
        aurora: {
            primary: lerpColor(from.aurora.primary, to.aurora.primary, t),
            secondary: lerpColor(from.aurora.secondary, to.aurora.secondary, t),
            glow: lerpColor(from.aurora.glow, to.aurora.glow, t),
        },
        ambient: lerpColor(from.ambient, to.ambient, t),
        ambientIntensity: lerpNum(from.ambientIntensity, to.ambientIntensity, t),
        fog: lerpColor(from.fog, to.fog, t),
        hemiSky: lerpColor(from.hemiSky, to.hemiSky, t),
        hemiGround: lerpColor(from.hemiGround, to.hemiGround, t),
        hemiIntensity: lerpNum(from.hemiIntensity, to.hemiIntensity, t),
    };
}

/**
 * Create the Time-of-Day system.
 * @param {{ auroraAPI: { setColors(colors: object): void } }} params
 */
export function createTODSystem({ auroraAPI }) {
    const state = {
        current: snapshotPreset(PRESETS.greenNight),
        target: null,
        progress: 0,
        transitionDuration: 1.5,
        interpolated: snapshotPreset(PRESETS.greenNight),
    };

    return {
        /**
         * Advance the transition by dt seconds. If no target, no-op.
         * @param {number} dt - Delta time in seconds
         */
        update(dt) {
            if (!state.target) return;

            state.progress += dt / state.transitionDuration;

            if (state.progress >= 1.0) {
                // Transition complete
                state.progress = 0;
                state.current = snapshotPreset(state.target);
                state.interpolated = snapshotPreset(state.target);
                state.target = null;
            } else {
                // Mid-transition: interpolate all fields
                state.interpolated = interpolatePresets(
                    state.current, state.target, state.progress
                );
            }

            // Sync aurora colors
            auroraAPI.setColors(state.interpolated.aurora);
        },

        /**
         * Begin transitioning to a named preset.
         * If mid-transition, snapshots current interpolated values as new source.
         * @param {string} name - Preset key ('greenNight', 'midnightBlue', 'purpleDusk')
         */
        setPreset(name) {
            const preset = PRESETS[name];
            if (!preset) return;

            if (state.target) {
                // Mid-transition: snapshot current interpolated state as new source
                state.current = snapshotPreset(state.interpolated);
            }

            state.target = preset;
            state.progress = 0;
        },

        /**
         * Get the name of the currently active (or transitioning-to) preset.
         * @returns {string}
         */
        getCurrentPreset() {
            if (state.target) return state.target.name;
            return state.current.name;
        },

        /**
         * Get the current interpolated value for a given property.
         * @param {string} prop - Property name (e.g. 'ambient', 'fog', 'hemiSky')
         * @returns {*}
         */
        getInterpolatedColor(prop) {
            return state.interpolated[prop];
        },

        // Exposed for testing
        lerpColor,
        _state: state,
        PRESETS,
    };
}
