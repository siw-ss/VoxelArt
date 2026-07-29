// Color palette for Underwater Coral Kingdom
export const PALETTE = {
    // Sand / seabed
    sand: ['#f2dcae', '#e8cd92', '#fbead0', '#dcbe80'],
    sandDark: ['#b0905e', '#8f7449'],

    // Coral warm
    coralPink: ['#ff2d78', '#ff0a6c', '#ff5c9e', '#ff1f8f'],
    coralOrange: ['#ff7b00', '#ff5400', '#ff9e00', '#ff6d00'],
    coralRed: ['#ff0040', '#e60033'],

    // Coral cool
    coralTeal: ['#00d9ff', '#00b7ff', '#40e0ff', '#00c8f0'],
    coralPurple: ['#c026ff', '#a600ff', '#d94dff', '#b400f0'],
    coralViolet: ['#4d3dff', '#6a00ff'],

    // Bioluminescent
    bioGreen: '#00ffb3',
    bioCyan: '#00f0ff',
    bioBlue: '#4dff00',

    // Kelp
    kelp: ['#2f9e44', '#52b788', '#40916c', '#74c69d'],
    kelpBladder: '#d4a017',

    // Temple stone
    stone: ['#5a6b5a', '#7a8a6a', '#4a5a4a', '#6b7b6b'],
    stoneMoss: '#3a5a3a',

    // Treasure
    gold: '#ffd700',
    goldDark: '#b8960f',

    // Rock
    rock: ['#4a4d66', '#5b5f7a', '#3a3d52', '#6c7090'],

    // Sponge
    spongeYellow: '#ffd400',
    spongeViolet: '#b026ff',
    spongeOrange: '#ff6600',

    // Shell / Starfish
    shell: ['#fff5e6', '#ffe0b3', '#ffcc99'],
    starfish: '#ff4d1a',

    // Fish
    fishBlue: '#00d4ff',
    fishYellow: '#ffdd00',
    fishOrange: '#ff5500',
};

export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
