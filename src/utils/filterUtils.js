/**
 * Consolidated filter utilities
 * Combines filter logic from passiveSkillsUtils and passiveSkillsHooks
 */

/**
 * Enhanced skill matching with combined logic
 */
export const createSkillMatcher = filters => {
    const { searchTerm, selectedForceType, selectedSkillTag, skillFilterTerm } = filters;

    return skill => {
        // Search term matching
        const matchesSearch =
            !searchTerm ||
            skill.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            skill.officerName?.toLowerCase().includes(searchTerm.toLowerCase());

        // Force type matching
        const matchesForceType =
            selectedForceType === 'all' || skill.officerForceType === selectedForceType;

        // Skill tag matching
        const matchesSkillTag = selectedSkillTag === 'all' || skill.tag === selectedSkillTag;

        // Skill filter matching
        const matchesSkillFilter =
            !skillFilterTerm.trim() || skillMatchesContent(skill, skillFilterTerm);

        return matchesSearch && matchesForceType && matchesSkillTag && matchesSkillFilter;
    };
};

/**
 * Check if skill content matches filter terms
 */
const skillMatchesContent = (skill, skillFilterTerm) => {
    const skillSearchTerms = skillFilterTerm
        .toLowerCase()
        .split(',')
        .map(term => term.trim())
        .filter(term => term);

    if (skillSearchTerms.length === 0) return true;

    const searchableText = [
        skill.name || '',
        skill.description || '',
        skill.tag || '',
        ...(skill.data || []),
    ]
        .join(' ')
        .toLowerCase();

    return skillSearchTerms.some(term => searchableText.includes(term));
};

/**
 * Generic filter function for any data type
 */
export const createGenericFilter = filterConfig => {
    return (items, filters) => {
        return items.filter(item => {
            return Object.entries(filterConfig).every(([filterKey, matchFn]) => {
                const filterValue = filters[filterKey];
                return matchFn(item, filterValue);
            });
        });
    };
};

/**
 * Common filter configurations
 */
export const FILTER_CONFIGS = {
    units: {
        searchTerm: (unit, term) =>
            !term ||
            unit.units_name?.toLowerCase().includes(term.toLowerCase()) ||
            unit.units?.toLowerCase().includes(term.toLowerCase()),

        selectedService: (unit, service) => service === 'all' || unit.normalizedService === service,

        selectedCamp: (unit, camp) => camp === 'all' || unit.normalizedCamps === camp,

        selectedGrade: (unit, grade) => grade === 'all' || unit.grades === parseInt(grade),
    },

    officers: {
        searchTerm: (officer, term) =>
            !term ||
            officer.name?.toLowerCase().includes(term.toLowerCase()) ||
            officer.nickname?.toLowerCase().includes(term.toLowerCase()),

        selectedArmy: (officer, army) => army === 'all' || officer.army === army,

        selectedGrade: (officer, grade) => grade === 'all' || officer.grade === parseInt(grade),
    },
};

/**
 * Reusable hover handlers
 */
export const createHoverHandlers = (setHoveredItem, setHoverPosition) => ({
    onMouseEnter: (item, event) => {
        const rect = event.target.getBoundingClientRect();
        setHoverPosition({
            x: rect.left + rect.width / 2,
            y: rect.top,
        });
        setHoveredItem(item);
    },

    onMouseLeave: () => {
        setHoveredItem(null);
    },
});

/**
 * Data normalization utilities
 */
export const normalizeData = {
    units: units =>
        units.map(unit => ({
            ...unit,
            normalizedType: (unit.units || 'Unknown')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toUpperCase(),
            normalizedService: (unit.services || 'Unknown').toUpperCase(),
            normalizedCamps: (unit.camps || '').toUpperCase(),
        })),

    officers: officers =>
        officers.map(officer => ({
            ...officer,
            normalizedArmy: (officer.army || 'Unknown').toUpperCase(),
            forceType: officer.army === 'AirForce' ? 'Air Force' : 'Ground Forces',
        })),
};
