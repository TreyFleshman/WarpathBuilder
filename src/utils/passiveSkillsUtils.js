// Utility function to check if a skill matches the current filter
export const skillMatchesFilter = (skill, skillFilterTerm) => {
    if (!skillFilterTerm.trim()) return false;

    const skillSearchTerms = skillFilterTerm
        .toLowerCase()
        .split(',')
        .map(term => term.trim());
    return skillSearchTerms.some(term => {
        if (!term) return false;

        const searchableText = [
            skill.name || '',
            skill.description || '',
            skill.tag || '',
            ...(skill.data || []),
        ]
            .join(' ')
            .toLowerCase();

        return searchableText.includes(term);
    });
};
