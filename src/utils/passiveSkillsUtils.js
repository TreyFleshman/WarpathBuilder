// Utility function to check if a skill matches the current filter
export const skillMatchesFilter = (skill, skillFilterTerm) => {
    if (!skillFilterTerm.trim()) return false;

    const skillSearchTerms = skillFilterTerm.toLowerCase().split(',').map(term => term.trim());
    return skillSearchTerms.some(term => {
        if (!term) return false;

        const searchableText = [
            skill.name || '',
            skill.description || '',
            skill.tag || '',
            ...(skill.data || [])
        ].join(' ').toLowerCase();

        return searchableText.includes(term);
    });
};

// Handle skill hover with position calculation
export const createSkillHoverHandler = (setHoveredSkill, setHoverPosition) => {
    return (skill, event) => {
        const rect = event.target.getBoundingClientRect();
        setHoverPosition({
            x: rect.left + rect.width / 2,
            y: rect.top
        });
        setHoveredSkill(skill);
    };
};

// Handle skill leave
export const createSkillLeaveHandler = (setHoveredSkill) => {
    return () => {
        setHoveredSkill(null);
    };
};
