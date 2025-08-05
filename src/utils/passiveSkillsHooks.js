import { useMemo } from 'react';

// Custom hook for processing officer data and extracting passive skills
export const usePassiveSkills = officersData => {
    return useMemo(() => {
        const processed = officersData.map(officer => ({
            ...officer,
            normalizedArmy: (officer.army || 'Unknown').toUpperCase(),
            forceType: officer.army === 'AirForce' ? 'Air Force' : 'Ground Forces',
        }));

        const uniqueForceTypes = [...new Set(processed.map(officer => officer.forceType))].sort();

        // Extract all passive skills from all officers
        const allPassiveSkills = [];
        const skillTagsSet = new Set();

        processed.forEach(officer => {
            if (officer.jn && Array.isArray(officer.jn)) {
                officer.jn.forEach((skill, index) => {
                    // Passive skills are typically at indices 1, 2, 3 (not the first or last skill)
                    if (skill && typeof skill === 'object' && index > 0 && index < 4) {
                        // Collect skill tags
                        if (skill.tag && skill.tag.trim()) {
                            skillTagsSet.add(skill.tag);
                        }

                        allPassiveSkills.push({
                            id: `${officer.id}-${index}`,
                            officerId: officer.id,
                            officerName: officer.nickname,
                            officerForceType: officer.forceType,
                            officerAvatar: officer.avatar,
                            officerAvatarB: officer.avatar_b,
                            name: skill.name || `Passive Skill ${index}`,
                            description: skill.desc || '',
                            img: skill.img || '',
                            tag: skill.tag || '',
                            data: skill.data || [],
                            skillIndex: index,
                        });
                    }
                });
            }
        });

        const uniqueSkillTags = Array.from(skillTagsSet).sort();

        return {
            passiveSkills: allPassiveSkills,
            forceTypes: uniqueForceTypes,
            skillTags: uniqueSkillTags,
        };
    }, [officersData]);
};

// Custom hook for filtering skills
export const useSkillFilters = (passiveSkills, filters) => {
    const { searchTerm, selectedForceType, selectedSkillTag, skillFilterTerm } = filters;

    return useMemo(() => {
        let filtered = passiveSkills.filter(skill => {
            const matchesSearch =
                skill.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                skill.officerName?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesForceType =
                selectedForceType === 'all' || skill.officerForceType === selectedForceType;

            const matchesSkillTag = selectedSkillTag === 'all' || skill.tag === selectedSkillTag;

            // Skill filter logic
            let matchesSkillFilter = true;
            if (skillFilterTerm.trim()) {
                const skillSearchTerms = skillFilterTerm
                    .toLowerCase()
                    .split(',')
                    .map(term => term.trim());
                matchesSkillFilter = skillSearchTerms.some(term => {
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
            }

            return matchesSearch && matchesForceType && matchesSkillTag && matchesSkillFilter;
        });

        // Sort skills alphabetically by name
        filtered.sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '');
        });

        return filtered;
    }, [passiveSkills, searchTerm, selectedForceType, selectedSkillTag, skillFilterTerm]);
};
