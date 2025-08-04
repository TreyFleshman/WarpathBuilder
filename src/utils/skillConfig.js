// Skill system constants and configuration

export const SKILL_CONFIG = {
    MAX_LEVEL: 5,
    MIN_LEVEL: 1,
    REVIVAL_SKILL_INDEX: 4,
    TOTAL_SKILLS: 5
};

export const SKILL_STATES = {
    LOCKED: 'locked',
    AVAILABLE: 'available',
    AWAKENED: 'awakened'
};

export const SKILL_ICONS = {
    LOCKED: '🔒',
    AWAKENED: '🌟',
    REVIVAL: '⚡'
};

export const SKILL_MESSAGES = {
    LOCKED: 'LOCKED - Max all skills to unlock',
    AWAKENED: 'AWAKENED',
    REVIVAL_LOCKED: 'REVIVAL BOOSTER LOCKED:',
    REVIVAL_UNLOCKED: 'REVIVAL BOOSTER UNLOCKED:'
};

/**
 * Check if revival skill should be available
 * @param {Object} skillLevels - Object with skill levels
 * @returns {boolean}
 */
export const isRevivalSkillAvailable = (skillLevels) => {
    return Array.from({ length: SKILL_CONFIG.REVIVAL_SKILL_INDEX }, (_, i) => i)
        .every(index => skillLevels[index] === SKILL_CONFIG.MAX_LEVEL);
};

/**
 * Initialize default skill levels
 * @returns {Object}
 */
export const createDefaultSkillLevels = () => {
    return Array.from({ length: SKILL_CONFIG.TOTAL_SKILLS }, (_, i) => [i, SKILL_CONFIG.MIN_LEVEL])
        .reduce((acc, [index, level]) => ({ ...acc, [index]: level }), {});
};
