import React from 'react';
import { SKILL_KEYWORDS } from '../utils/constants';

const FiltersSection = ({
    searchTerm,
    setSearchTerm,
    selectedForceType,
    setSelectedForceType,
    selectedSkillTag,
    setSelectedSkillTag,
    skillFilterTerm,
    setSkillFilterTerm,
    showSkillSuggestions,
    setShowSkillSuggestions,
    forceTypes,
    skillTags,
    filteredSkillsCount
}) => {
    const handleSuggestionClick = (keyword) => {
        const currentTerms = skillFilterTerm ? skillFilterTerm.split(',').map(t => t.trim()) : [];
        if (!currentTerms.includes(keyword)) {
            const newTerms = [...currentTerms, keyword];
            setSkillFilterTerm(newTerms.join(', '));
        }
        setShowSkillSuggestions(false);
    };

    return (
        <div className="filters-section">
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search skills or officers..."
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
                    <label>Skill Category:</label>
                    <select
                        value={selectedSkillTag}
                        onChange={(e) => setSelectedSkillTag(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Categories</option>
                        {skillTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
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
                                {SKILL_KEYWORDS.map(keyword => (
                                    <div
                                        key={keyword}
                                        className="suggestion-item"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSuggestionClick(keyword);
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

            {/* Results Count */}
            <div className="results-info">
                <span className="results-count">
                    {filteredSkillsCount} passive skills found
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
    );
};

export default FiltersSection;
