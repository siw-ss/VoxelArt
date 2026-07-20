// ---------------------------------------------------------------------------
//  PALETTE — Nordic Ice Palace color palette grouped by material/role
// ---------------------------------------------------------------------------
export const PAL = {
    // palace walls — cyans and whites for crystalline transparency
    ice: ['#b0e0e6', '#e0ffff', '#87ceeb', '#aff0ef', '#caf4f4'],
    // terrain surface — whites and pale blues
    snow: ['#f8f8ff', '#eef5ff', '#dceaf5', '#ffffff'],
    // strata beneath terrain — grays and dark blues
    rock: ['#5a6578', '#4a5568', '#3b4559', '#6b7d8e', '#2e3d4f'],
    // aurora borealis — greens, cyans, blues, purples
    aurora: ['#00ff88', '#00e5ff', '#4488ff', '#aa66ff', '#ff44ff'],
    // emissive spire tips — blues and whites
    spireGlow: ['#88ccff', '#aaeeff', '#ffffff', '#66ddff'],
    // frost overlay — pale blue-whites
    frost: ['#e8f4f8', '#d4eef6', '#f0f8ff'],
    // frozen lake — blues
    lake: ['#4a8eb5', '#3a7ca3', '#5a9ec7', '#2d6a8f'],
    // tree canopy — dark greens
    pine: ['#1a4d2e', '#2d6b45', '#1f5c38', '#245a34'],
    // tree trunks — brown tones
    pineTrunk: ['#5c3a1e', '#6b4528', '#4e3118'],
    // palace base platform — stone colors
    platform: ['#7a8a9a', '#6b7b8b', '#8a9aaa', '#5c6c7c'],
};

export function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
