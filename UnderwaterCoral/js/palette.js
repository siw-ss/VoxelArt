// Color palette for Underwater Coral Kingdom
export const PALETTE = {
    // Sand / seabed
    sand: ['#d4b896', '#c4a878', '#e8d4b0', '#b89a70'],
    sandDark: ['#8a7050', '#6b5a40'],

    // Coral warm
    coralPink: ['#ff6b8a', '#ff4d6d', '#ff85a1'],
    coralOrange: ['#ff8c42', '#ff6b35', '#ffaa55'],
    coralRed: ['#e63946', '#d62839'],

    // Coral cool
    coralTeal: ['#00b4d8', '#0096c7', '#48cae4'],
    coralPurple: ['#7b2d8b', '#9b5de5', '#6a0dad'],
    coralViolet: ['#4361ee', '#3a0ca3'],

    // Bioluminescent
    bioGreen: '#00ffcc',
    bioCyan: '#00e5ff',
    bioBlue: '#39ff14',

    // Kelp
    kelp: ['#2d6b3a', '#4a6b3a', '#3d7a4a', '#6b8c3a'],
    kelpBladder: '#8b6b20',

    // Temple stone
    stone: ['#5a6b5a', '#7a8a6a', '#4a5a4a', '#6b7b6b'],
    stoneMoss: '#3a5a3a',

    // Treasure
    gold: '#ffd700',
    goldDark: '#b8960f',

    // Rock
    rock: ['#3a3a4a', '#4a4a5a', '#2a2a3a', '#5a5a6a'],

    // Sponge
    spongeYellow: '#ffd166',
    spongeViolet: '#9b5de5',
    spongeOrange: '#f77f00',

    // Shell / Starfish
    shell: ['#fff0db', '#ffe4c4', '#ffd4a8'],
    starfish: '#ff7f50',

    // Fish
    fishBlue: '#00b4d8',
    fishYellow: '#ffd166',
    fishOrange: '#ff6b35',
};

export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
