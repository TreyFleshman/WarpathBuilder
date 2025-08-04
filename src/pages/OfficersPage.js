import React, { useState, useMemo } from 'react';
import officersData from '../database/officer.json';

const OfficersPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedForceType, setSelectedForceType] = useState('all');
    const [skillFilterTerm, setSkillFilterTerm] = useState('');
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
    const [selectedOfficer, setSelectedOfficer] = useState(null);
    const [hoveredSkill, setHoveredSkill] = useState(null);
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

    // Common skill buff keywords for suggestions
    const skillKeywords = [
        'firepower', 'dmg resist', 'attack dmg', 'durability', 'hp', 'speed',
        'critical strike', 'blast dmg', 'skill dmg', 'healing', 'recovery',
        'tank', 'artillery', 'infantry', 'fighter', 'bomber', 'helicopter',
        'maneuverability', 'stability', 'intercept', 'jamming', 'patrol speed',
        'pen dmg', 'load speed', 'prep time', 'garrison', 'bunker', 'shield'
    ];

    // Process and organize officers data
    const { processedOfficers, forceTypes } = useMemo(() => {
        const processed = officersData.map(officer => ({
            ...officer,
            normalizedArmy: (officer.army || 'Unknown').toUpperCase(),
            forceType: officer.army === 'AirForce' ? 'Air Force' : 'Ground Forces'
        }));

        const uniqueForceTypes = [...new Set(processed.map(officer => officer.forceType))].sort();

        return {
            processedOfficers: processed,
            forceTypes: uniqueForceTypes
        };
    }, []);

    // Filter and sort officers
    const filteredAndSortedOfficers = useMemo(() => {
        let filtered = processedOfficers.filter(officer => {
            const matchesSearch = officer.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesForceType = selectedForceType === 'all' || officer.forceType === selectedForceType;

            // Skill filter logic
            let matchesSkillFilter = true;
            if (skillFilterTerm.trim()) {
                const skillSearchTerms = skillFilterTerm.toLowerCase().split(',').map(term => term.trim());
                matchesSkillFilter = skillSearchTerms.some(term => {
                    if (!term) return false;

                    // Search through all skills
                    return officer.jn && officer.jn.some(skill => {
                        if (!skill) return false;

                        // Search in skill name, description, tag, and data
                        const searchableText = [
                            skill.name || '',
                            skill.desc || '',
                            skill.tag || '',
                            ...(skill.data || [])
                        ].join(' ').toLowerCase();

                        return searchableText.includes(term);
                    });
                });
            }

            return matchesSearch && matchesForceType && matchesSkillFilter;
        });

        // Sort officers alphabetically by nickname
        filtered.sort((a, b) => {
            return (a.nickname || '').localeCompare(b.nickname || '');
        });

        return filtered;
    }, [processedOfficers, searchTerm, selectedForceType, skillFilterTerm]);

    const handleOfficerClick = (officer) => {
        setSelectedOfficer(officer);
    };

    const closeOfficerModal = () => {
        setSelectedOfficer(null);
    };

    const handleSkillHover = (skill, event) => {
        const rect = event.target.getBoundingClientRect();
        setHoverPosition({
            x: rect.left + rect.width / 2,
            y: rect.top
        });
        setHoveredSkill(skill);
    };

    const handleSkillLeave = () => {
        setHoveredSkill(null);
    };

    const getSkillsByType = (officer) => {
        const skills = {
            active: [],
            passive: [],
            upgrades: []
        };

        if (officer.jn && Array.isArray(officer.jn)) {
            officer.jn.forEach((skill, index) => {
                if (skill && typeof skill === 'object') {
                    const skillData = {
                        id: index,
                        name: skill.name || `Skill ${index + 1}`,
                        description: skill.desc || '',
                        img: skill.img || '',
                        tag: skill.tag || '',
                        data: skill.data || []
                    };

                    // Categorize skills based on index or name patterns
                    if (index === 0) {
                        // First skill is usually the active/tactical skill
                        skills.active.push(skillData);
                    } else if (index === 4) {
                        // Fifth skill is usually the upgrade skill
                        skills.upgrades.push(skillData);
                    } else {
                        // Middle skills are usually passive skills
                        skills.passive.push(skillData);
                    }
                }
            });
        }

        return skills;
    };

    // Helper function to check if a skill matches the current filter
    const skillMatchesFilter = (skill) => {
        if (!skillFilterTerm.trim()) return false;

        const skillSearchTerms = skillFilterTerm.toLowerCase().split(',').map(term => term.trim());
        return skillSearchTerms.some(term => {
            if (!term) return false;

            const searchableText = [
                skill.name || '',
                skill.desc || '',
                skill.tag || '',
                ...(skill.data || [])
            ].join(' ').toLowerCase();

            return searchableText.includes(term);
        });
    };

    return (
        <div className="officers-page">
            <div className="page-container">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-top">
                        <h1 className="page-title">
                            <div className="title-icon">👨‍💼</div>
                            Officers Database
                        </h1>
                        <p className="page-subtitle">
                            Browse and explore all available military officers
                        </p>
                    </div>

                    {/* Filters and Search */}
                    <div className="filters-section">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search officers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filters-row">
                            <div className="filter-group">
                                <label>Force Type:</label>
                                <select
                                    value={selectedForceType}
                                    onChange={(e) => setSelectedForceType(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All Forces</option>
                                    {forceTypes.map(forceType => (
                                        <option key={forceType} value={forceType}>{forceType}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Skill Filter:</label>
                                <div className="filter-control">
                                    <input
                                        type="text"
                                        placeholder="Filter by skill buffs (e.g., firepower, dmg resist, critical strike, tank, artillery)..."
                                        value={skillFilterTerm}
                                        onChange={(e) => setSkillFilterTerm(e.target.value)}
                                        onFocus={() => setShowSkillSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                                    />
                                    {showSkillSuggestions && (
                                        <div className={`suggestions-dropdown ${showSkillSuggestions ? 'visible' : ''}`}>
                                            {skillKeywords.map(keyword => (
                                                <div
                                                    key={keyword}
                                                    className="suggestion-item"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        const currentTerms = skillFilterTerm ? skillFilterTerm.split(',').map(t => t.trim()) : [];
                                                        if (!currentTerms.includes(keyword)) {
                                                            const newTerms = [...currentTerms, keyword];
                                                            setSkillFilterTerm(newTerms.join(', '));
                                                        }
                                                        setShowSkillSuggestions(false);
                                                    }}
                                                >
                                                    <div className="suggestion-text">
                                                        <div className="suggestion-main">{keyword}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="filter-hint">
                                    💡 Tip: Use commas to search for multiple terms (e.g., "firepower, tank, dmg resist")
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="results-info">
                        <span className="results-count">
                            {filteredAndSortedOfficers.length} officers found
                        </span>
                        {skillFilterTerm && (
                            <button
                                onClick={() => setSkillFilterTerm('')}
                                className="clear-skill-filter"
                                title="Clear skill filter"
                            >
                                Clear skill filter ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Officers Grid */}
                <div className="officers-grid">
                    {filteredAndSortedOfficers.map((officer) => {
                        const skills = getSkillsByType(officer);
                        const totalSkills = skills.active.length + skills.passive.length + skills.upgrades.length;

                        return (
                            <div
                                key={officer.id}
                                className="officer-card"
                                onClick={() => handleOfficerClick(officer)}
                            >
                                <div className="officer-header">
                                    <div className="officer-avatar">
                                        {officer.avatar ? (
                                            <img
                                                src={`https://www.afuns.cc/img/warpath/db/officers/${officer.avatar}`}
                                                onError={e => {
                                                    if (officer.avatar_b && e.target.src !== `https://www.afuns.cc/img/warpath/db/officers/${officer.avatar_b}`) {
                                                        e.target.src = `https://www.afuns.cc/img/warpath/db/officers/${officer.avatar_b}`;
                                                    }
                                                }}
                                                alt={officer.nickname}
                                                className="officer-image"
                                            />
                                        ) : (
                                            <div className="officer-placeholder">👨‍💼</div>
                                        )}
                                    </div>
                                    <div className="officer-info">
                                        <h3 className="officer-name">{officer.nickname}</h3>
                                        <div className="officer-force-type">{officer.forceType}</div>
                                    </div>
                                </div>

                                <div className="officer-skills-preview">
                                    {/* All Skills Preview */}
                                    <div className="skills-list">
                                        {officer.jn && officer.jn.map((skill, index) => {
                                            let skillIcon = '🔹';
                                            let skillType = '';

                                            // Determine skill type and icon
                                            if (index === 0) {
                                                skillIcon = '⚡';
                                                skillType = 'active';
                                            } else if (index === 4) {
                                                skillIcon = '🌟';
                                                skillType = 'awakened';
                                            } else {
                                                skillIcon = '🛡️';
                                                skillType = 'passive';
                                            }

                                            // Create detailed tooltip content
                                            const tooltipContent = [
                                                skill.name,
                                                skill.tag ? `Type: ${skill.tag}` : '',
                                                skill.desc ? `Description: ${skill.desc}` : '',
                                                skill.data && skill.data[0] ? `\nDetails:\n${skill.data[0].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')}` : ''
                                            ].filter(Boolean).join('\n');

                                            return (
                                                <div
                                                    key={index}
                                                    className={`skill-item ${skillType} ${skillMatchesFilter(skill) ? 'skill-matched' : ''}`}
                                                    onMouseEnter={(e) => handleSkillHover(skill, e)}
                                                    onMouseLeave={handleSkillLeave}
                                                >
                                                    <div className="skill-icon-container">
                                                        {skill.img ? (
                                                            <img
                                                                src={`https://www.afuns.cc/img/warpath/db/officers/${skill.img}`}
                                                                alt={skill.name}
                                                                className="skill-image"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'inline';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <span className="skill-icon-fallback" style={{ display: skill.img ? 'none' : 'inline' }}>
                                                            {skillIcon}
                                                        </span>
                                                    </div>
                                                    <span className="skill-name">{skill.name}</span>
                                                    {skill.tag && (
                                                        <span className="skill-tag">({skill.tag})</span>
                                                    )}
                                                    {skillMatchesFilter(skill) && (
                                                        <span className="skill-match-indicator">✓</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Officer Detail Modal */}
                {selectedOfficer && (
                    <div className="modal-overlay" onClick={closeOfficerModal}>
                        <div className="officer-detail-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedOfficer.nickname}</h2>
                                <button onClick={closeOfficerModal} className="close-btn">✕</button>
                            </div>
                            <div className="modal-content">
                                <div className="officer-detail-grid">
                                    <div className="officer-image-section">
                                        {selectedOfficer.avatar ? (
                                            <img
                                                src={`https://www.afuns.cc/img/warpath/db/officers/${selectedOfficer.avatar}`}
                                                onError={e => {
                                                    if (selectedOfficer.avatar_b && e.target.src !== `https://www.afuns.cc/img/warpath/db/officers/${selectedOfficer.avatar_b}`) {
                                                        e.target.src = `https://www.afuns.cc/img/warpath/db/officers/${selectedOfficer.avatar_b}`;
                                                    }
                                                }}
                                                alt={selectedOfficer.nickname}
                                                className="officer-detail-image"
                                            />
                                        ) : (
                                            <div className="officer-detail-placeholder">👨‍💼</div>
                                        )}
                                        <div className="officer-basic-info">
                                            <div className="detail-row">
                                                <span className="detail-label">Force Type:</span>
                                                <span className="detail-value">{selectedOfficer.forceType}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="officer-skills-section">
                                        <h3>Skills & Abilities</h3>
                                        {(() => {
                                            const skills = getSkillsByType(selectedOfficer);
                                            return (
                                                <div className="skills-categories">
                                                    {skills.active.length > 0 && (
                                                        <div className="skill-category">
                                                            <h4 className="skill-category-title">
                                                                <span className="skill-icon">⚡</span>
                                                                Active Skills
                                                            </h4>
                                                            <div className="skills-list">
                                                                {skills.active.map((skill, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className="skill-item modal-skill"
                                                                        onMouseEnter={(e) => handleSkillHover(skill, e)}
                                                                        onMouseLeave={handleSkillLeave}
                                                                    >
                                                                        <div className="skill-header">
                                                                            <div className="skill-icon-container">
                                                                                {skill.img ? (
                                                                                    <img
                                                                                        src={`https://www.afuns.cc/img/warpath/db/officers/${skill.img}`}
                                                                                        alt={skill.name}
                                                                                        className="skill-image"
                                                                                        onError={(e) => {
                                                                                            e.target.style.display = 'none';
                                                                                            e.target.nextSibling.style.display = 'inline';
                                                                                        }}
                                                                                    />
                                                                                ) : null}
                                                                                <span className="skill-icon-fallback" style={{ display: skill.img ? 'none' : 'inline' }}>
                                                                                    ⚡
                                                                                </span>
                                                                            </div>
                                                                            <div className="skill-name">{skill.name}</div>
                                                                        </div>
                                                                        {skill.description && (
                                                                            <div className="skill-description">{skill.description}</div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {skills.passive.length > 0 && (
                                                        <div className="skill-category">
                                                            <h4 className="skill-category-title">
                                                                <span className="skill-icon">🛡️</span>
                                                                Passive Skills
                                                            </h4>
                                                            <div className="skills-list">
                                                                {skills.passive.map((skill, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className="skill-item modal-skill"
                                                                        onMouseEnter={(e) => handleSkillHover(skill, e)}
                                                                        onMouseLeave={handleSkillLeave}
                                                                    >
                                                                        <div className="skill-header">
                                                                            <div className="skill-icon-container">
                                                                                {skill.img ? (
                                                                                    <img
                                                                                        src={`https://www.afuns.cc/img/warpath/db/officers/${skill.img}`}
                                                                                        alt={skill.name}
                                                                                        className="skill-image"
                                                                                        onError={(e) => {
                                                                                            e.target.style.display = 'none';
                                                                                            e.target.nextSibling.style.display = 'inline';
                                                                                        }}
                                                                                    />
                                                                                ) : null}
                                                                                <span className="skill-icon-fallback" style={{ display: skill.img ? 'none' : 'inline' }}>
                                                                                    🛡️
                                                                                </span>
                                                                            </div>
                                                                            <div className="skill-name">{skill.name}</div>
                                                                        </div>
                                                                        {skill.description && (
                                                                            <div className="skill-description">{skill.description}</div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {skills.upgrades.length > 0 && (
                                                        <div className="skill-category">
                                                            <h4 className="skill-category-title">
                                                                <span className="skill-icon">⬆️</span>
                                                                Awakened skill
                                                            </h4>
                                                            <div className="skills-list">
                                                                {skills.upgrades.map((skill, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className="skill-item modal-skill"
                                                                        onMouseEnter={(e) => handleSkillHover(skill, e)}
                                                                        onMouseLeave={handleSkillLeave}
                                                                    >
                                                                        <div className="skill-header">
                                                                            <div className="skill-icon-container">
                                                                                {skill.img ? (
                                                                                    <img
                                                                                        src={`https://www.afuns.cc/img/warpath/db/officers/${skill.img}`}
                                                                                        alt={skill.name}
                                                                                        className="skill-image"
                                                                                        onError={(e) => {
                                                                                            e.target.style.display = 'none';
                                                                                            e.target.nextSibling.style.display = 'inline';
                                                                                        }}
                                                                                    />
                                                                                ) : null}
                                                                                <span className="skill-icon-fallback" style={{ display: skill.img ? 'none' : 'inline' }}>
                                                                                    🌟
                                                                                </span>
                                                                            </div>
                                                                            <div className="skill-name">{skill.name}</div>
                                                                        </div>
                                                                        {skill.description && (
                                                                            <div className="skill-description">{skill.description}</div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Skill Hover Modal - Moved outside page-container */}
            {hoveredSkill && (
                <div
                    className="skill-hover-modal"
                    style={{
                        position: 'fixed',
                        left: `${hoverPosition.x}px`,
                        top: `${hoverPosition.y - 10}px`,
                        transform: 'translateX(-50%) translateY(-100%)',
                        zIndex: 999999,
                        pointerEvents: 'none'
                    }}
                >
                    <div className="skill-hover-content">
                        <div className="skill-hover-header">
                            <div className="skill-hover-icon">
                                {hoveredSkill.img ? (
                                    <img
                                        src={`https://www.afuns.cc/img/warpath/db/officers/${hoveredSkill.img}`}
                                        alt={hoveredSkill.name}
                                        className="skill-hover-image"
                                    />
                                ) : (
                                    <div className="skill-hover-fallback">🔹</div>
                                )}
                            </div>
                            <div className="skill-hover-title">
                                <h4 className="skill-hover-name">{hoveredSkill.name}</h4>
                                {hoveredSkill.tag && (
                                    <div className="skill-hover-tag">{hoveredSkill.tag}</div>
                                )}
                            </div>
                        </div>

                        {hoveredSkill.desc && (
                            <div className="skill-hover-description">
                                {hoveredSkill.desc}
                            </div>
                        )}

                        {hoveredSkill.data && hoveredSkill.data.length > 0 && (
                            <div className="skill-hover-details">
                                <div className="skill-hover-details-title">Details:</div>
                                <div
                                    className="skill-hover-details-content"
                                    dangerouslySetInnerHTML={{
                                        __html: hoveredSkill.data[0]?.replace(/<br\s*\/?>/gi, '<br>') || ''
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficersPage;
