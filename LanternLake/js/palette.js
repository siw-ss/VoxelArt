// ---------------------------------------------------------------------------
//  PALETTE — Lantern Lake color palette grouped by material/role
// ---------------------------------------------------------------------------
export const PAL = {
    // water surface — twilight blue with purple tint (visible, not black)
    water: ['#1a3050', '#1f3a5c', '#243f62', '#2a4a70'],
    waterGold: ['#c9943a', '#daa844', '#e8b84a'],
    // boat wood — warm browns
    boat: ['#5c3a1e', '#7a4f2a', '#3d2810', '#6b4528'],
    boatTrim: ['#8c6840', '#a07848'],
    // lantern paper — warm cream/gold
    lanternPaper: ['#fff4d6', '#ffe4a0', '#ffd070'],
    lanternFrame: ['#6b4528', '#4a3018', '#5c3a1e'],
    // grass/vegetation — rich greens
    grass: ['#2d6b3a', '#4a8c5c', '#1a4d2e', '#3a7d4a'],
    // sand/shore — warm tans
    sand: ['#d4b896', '#c4a47a', '#e8d4b0', '#b89468'],
    // stone — gray-browns
    stone: ['#7a6b5a', '#5c4f42', '#8c7d6e', '#6b5d4e'],
    // willow leaves — sage greens
    willow: ['#6b8c5a', '#8aad6e', '#4a6b3a', '#5a7c4a'],
    // tree trunks
    trunk: ['#5c3a1e', '#4a3018', '#6b4528'],
    // cherry blossom
    blossom: ['#ffb3c9', '#ff9eb5', '#ffc8d9', '#ffffff'],
    // hill silhouette — dark purple-blues
    hills: ['#1a0d2e', '#2d1845', '#0d0618', '#150a22'],
    // rock strata beneath island
    rock: ['#8b5e3c', '#6b4528', '#a07040', '#5c3a1e', '#4a3018'],
    // reeds/cattails
    reeds: ['#4a6b3a', '#3d5c2e', '#5a7c4a'],
    // emissive glow — warm golds
    glow: ['#ffcc44', '#ffaa22', '#ffdd66'],
    // firefly
    firefly: ['#ccff66', '#ffee44', '#aaffaa'],
    // dock planks
    dock: ['#7a5c3a', '#6b4f30', '#8c6840'],
    // palm tree
    palmTrunk: ['#8b6914', '#7a5c10', '#9c7a1e'],
    palmLeaf: ['#2d8c3a', '#3a9c4a', '#4aad5a', '#228b22'],
};

export function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
