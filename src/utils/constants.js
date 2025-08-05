// ===========================================
// IMAGE URLS
// ===========================================
export const IMAGE_URLS = {
    OFFICERS: 'https://www.afuns.cc/img/warpath/db/officers/',
    UNITS: 'https://www.afuns.cc/img/warpath/db/units/',
};

// Legacy support
export const OFFICER_IMAGE_BASE_URL = IMAGE_URLS.OFFICERS;

// ===========================================
// SKILL SYSTEM CONSTANTS
// ===========================================
export const SKILL_CONFIG = {
    MAX_LEVEL: 5,
    MIN_LEVEL: 1,
    REVIVAL_SKILL_INDEX: 4,
    TOTAL_SKILLS: 5,
};

export const SKILL_STATES = {
    LOCKED: 'locked',
    AVAILABLE: 'available',
    AWAKENED: 'awakened',
};

export const SKILL_ICONS = {
    LOCKED: '🔒',
    AWAKENED: '🌟',
    REVIVAL: '⚡',
};

export const SKILL_MESSAGES = {
    LOCKED: 'LOCKED - Max all skills to unlock',
    AWAKENED: 'AWAKENED',
    REVIVAL_LOCKED: 'REVIVAL BOOSTER LOCKED:',
    REVIVAL_UNLOCKED: 'REVIVAL BOOSTER UNLOCKED:',
};

// ===========================================
// FILTER KEYWORDS & DEFAULTS
// ===========================================
export const SKILL_KEYWORDS = [
    'firepower',
    'dmg resist',
    'attack dmg',
    'durability',
    'hp',
    'speed',
    'critical strike',
    'blast dmg',
    'skill dmg',
    'healing',
    'recovery',
    'tank',
    'artillery',
    'infantry',
    'fighter',
    'bomber',
    'helicopter',
    'maneuverability',
    'stability',
    'intercept',
    'jamming',
    'patrol speed',
    'pen dmg',
    'load speed',
    'prep time',
    'garrison',
    'bunker',
    'shield',
];

export const DEFAULT_FILTERS = {
    searchTerm: '',
    selectedForceType: 'all',
    selectedSkillTag: 'all',
    skillFilterTerm: '',
};

// ===========================================
// CAMP CLASSIFICATIONS
// ===========================================
export const CAMP_TYPES = {
    VANGUARD: 'vanguard',
    LIBERTY: 'liberty',
    MARTYRS: 'martyrs',
};

export const FORCE_TYPES = {
    GROUND: 'Ground Forces',
    AIR: 'Air Force',
};

// ===========================================
// GRADE SYSTEM
// ===========================================
export const GRADE_CONFIG = {
    MIN_GRADE: 1,
    MAX_GRADE: 8,
    STAR_THRESHOLD: 4, // Grades 4+ show stars
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================
/**
 * Check if revival skill should be available
 */
export const isRevivalSkillAvailable = skillLevels => {
    return Array.from({ length: SKILL_CONFIG.REVIVAL_SKILL_INDEX }, (_, i) => i).every(
        index => skillLevels[index] === SKILL_CONFIG.MAX_LEVEL
    );
};

/**
 * Initialize default skill levels
 */
export const createDefaultSkillLevels = () => {
    return Array.from({ length: SKILL_CONFIG.TOTAL_SKILLS }, (_, i) => [
        i,
        SKILL_CONFIG.MIN_LEVEL,
    ]).reduce((acc, [index, level]) => ({ ...acc, [index]: level }), {});
};

/**
 * Get camp-specific CSS class
 */
export const getCampClass = campName => {
    if (!campName) return '';

    const normalizedCamp = campName.toLowerCase().trim();

    if (normalizedCamp.includes('vanguard')) return 'camp-vanguard';
    if (normalizedCamp.includes('liberty')) return 'camp-liberty';
    if (normalizedCamp.includes('martys')) return 'camp-martyrs';

    return '';
};
