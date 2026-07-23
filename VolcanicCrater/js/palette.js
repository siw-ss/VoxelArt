// ---------------------------------------------------------------------------
//  PALETTE — color definitions for the Volcanic Crater Complex
// ---------------------------------------------------------------------------
export const PAL = {
    // Obsidian (inner terrain)
    obsidian: ['#1a1a2e', '#16162a', '#1e1e32', '#121228'],
    obsidianLight: ['#2a2a3e', '#262638', '#2e2e42'],

    // Basalt (mid-ring columns and terrain)
    basalt: ['#2d3436', '#283032', '#32383a', '#252d2f'],
    basaltDark: ['#1e2628', '#1a2224'],

    // Lava (molten flows and pool)
    lavaHot: ['#FF4500', '#FF5500', '#FF3800', '#FF6000'],
    lavaGlow: ['#FF8C00', '#FFA000', '#FF7800'],
    lavaCool: ['#4a1c1c', '#5a2020', '#3e1818', '#4e2222'],
    lavaCrack: ['#FF6B35', '#FF5522', '#FF7744'],

    // Crystals
    crystalAmber: ['#FFBF00', '#FFD000', '#FFAA00', '#FFC800'],
    crystalRuby: ['#DC143C', '#CC1133', '#E8163F'],
    crystalEmerald: ['#00C853', '#00B84A', '#00D85C'],

    // Structures
    metalScaffold: ['#4a4a4a', '#3e3e3e', '#555555', '#444444'],
    woodCharred: ['#3e2723', '#4a302a', '#352220', '#4e3830'],

    // Sulfur staining
    sulfur: ['#9ACD32', '#8BBD28', '#A8DC3C', '#7AAC20'],

    // Ash ground
    ash: ['#2c2c2c', '#333333', '#262626', '#303030'],
    ashLight: ['#3a3a3a', '#404040', '#353535'],

    // Steam
    steam: ['#d0d0d0', '#c8c8c8', '#dcdcdc', '#e0e0e0'],
};

export function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
