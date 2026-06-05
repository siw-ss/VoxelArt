// ---------------------------------------------------------------------------
//  PALETTE — color definitions for the Floating Archipelago
// ---------------------------------------------------------------------------
export const PAL = {
    // Island terrain
    stoneLight: ['#C0C0C0', '#C8C8C8', '#B8B8B8'],
    stoneMed: ['#A0A0A8', '#989898', '#A8A8B0'],
    stoneDark: ['#708090', '#607080', '#506878'],
    rock: ['#8B7355', '#7A6548', '#9C8060', '#6B5540'],
    dirt: ['#6B4A2C', '#7A5432', '#5C3F25'],
    grass: ['#90EE90', '#7DD87D', '#80E080', '#6CC86C'],
    mossDark: ['#4A8A4A', '#3D7D3D', '#558855'],

    // Crystal bridge
    crystal: ['#00E5FF', '#00D4EE', '#33EEFF', '#00C8DD'],
    crystalGlow: ['#00E5FF'],

    // Temple / buildings
    brick: ['#D2B48C', '#C8AA80', '#DCBE98', '#BFA078'],
    brickDark: ['#A0845C', '#8B7350'],
    gold: ['#FFD700', '#FFC62E', '#FFDC64', '#E8BE00'],

    // Water
    water: ['#00FFFF', '#00E8E8', '#33FFFF'],
    waterDeep: ['#008B8B', '#007878'],
    mist: ['#B0FFFF', '#C8FFFF'],

    // Vegetation
    grassTop: ['#90EE90', '#80DD80', '#A0F0A0'],
    vegetation: ['#5FAA5F', '#4D994D', '#6BBB6B'],
    vine: ['#3A7A3A', '#2D6D2D', '#4B8B4B'],

    // Sky / night
    star: ['#FFFACD', '#FFF8B8', '#FFFFF0'],

    // Ruins
    ruinStone: ['#B0A090', '#A09080', '#C0B0A0', '#908070'],
    ruinMoss: ['#6B8B6B', '#5A7A5A'],

    // Metal accents
    metalTrim: ['#FFD700', '#E8C800', '#FFDC40'],
};

export function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
