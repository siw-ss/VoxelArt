// ---------------------------------------------------------------------------
//  PALETTE — colorful voxel palette grouped by material/role
// ---------------------------------------------------------------------------
export const PAL = {
    // terrain
    grassTop: ['#7cc34a', '#86cf4f', '#72b843', '#93d85d', '#6aad3c'],
    grassDark: ['#4f8a30', '#5b9636', '#467d2b'],
    dirt: ['#7a5230', '#8a5e38', '#6e4a2a', '#94673f'],
    rock: ['#8d8f96', '#7a7c83', '#9aa0a8', '#6f7178'],
    sand: ['#e9dcae', '#e3d49f', '#efe4bd'],
    // water
    water: ['#3aa6d6', '#2f95c8', '#46b3e0', '#2b8bc0'],
    waterDeep: ['#1f6fa3', '#246f9f'],
    // pagoda
    pillar: ['#b5341f', '#c23c24', '#a82d1a'],   // vermillion red
    wall: ['#f3ead7', '#efe3cb', '#f7f0e0'],   // cream plaster
    roof: ['#2f6d8f', '#357a9e', '#2a6080'],   // teal-blue tiles
    roofEdge: ['#f6c945', '#f3c038', '#fbd45a'],   // gold trim
    beam: ['#6e3b22', '#7a432a', '#5f3119'],   // dark wood
    goldTop: ['#ffd24a', '#ffc62e', '#ffdc64'],
    // foliage
    trunk: ['#6b4a2c', '#5c3f25', '#785432'],
    pineDark: ['#2f7d4f', '#287044', '#368a58'],
    pineLight: ['#3f9e63', '#46aa6c'],
    sakura: ['#ffc2d8', '#ffb3cc', '#ffd0e2', '#ff9ebd', '#ffd9e6'],
    sakuraDeep: ['#f489b0', '#ef7ba6'],
    maple: ['#e8623a', '#f2743f', '#d8552f', '#ff8a52'],
    // accents
    lantern: ['#e23b2e', '#cf3327'],
    lanternGlow: ['#ffd98a'],
    stone: ['#b9bdc4', '#aab0b8', '#c7ccd2'],
    petal: ['#ffc2d8', '#ffb0cb', '#ffd6e6', '#ff9ebd'],
};

export function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
