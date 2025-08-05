import React, { useState } from 'react';
import { usePassiveSkills, useSkillFilters } from '../utils/passiveSkillsHooks';
import { skillMatchesFilter } from '../utils/passiveSkillsUtils';
import { DEFAULT_FILTERS } from '../utils/constants';
import FiltersSection from './FiltersSection';
import PassiveSkillCard from './PassiveSkillCard';
import officersDataRaw from '../database/officer.json';

// Convert officers object to array format
const officersData = Object.values(officersDataRaw);

const PassiveSelectionModal = ({ isOpen, onClose, onPassiveSelect, slotNumber, currentUnit }) => {
    // State management
    const [searchTerm, setSearchTerm] = useState(DEFAULT_FILTERS.searchTerm);
    const [selectedForceType, setSelectedForceType] = useState(DEFAULT_FILTERS.selectedForceType);
    const [selectedSkillTag, setSelectedSkillTag] = useState(DEFAULT_FILTERS.selectedSkillTag);
    const [skillFilterTerm, setSkillFilterTerm] = useState(DEFAULT_FILTERS.skillFilterTerm);
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

    // Extract passive skills data
    const { passiveSkills, forceTypes, skillTags } = usePassiveSkills(officersData);

    // Count current passive skills by tag
    const getCurrentPassiveSkillCounts = () => {
        const counts = {
            special: 0,
            offense: 0,
            protection: 0,
            balanced: 0,
        };

        if (!currentUnit) return counts;

        // Count existing passive skills (excluding the current slot being edited)
        for (let i = 1; i <= 4; i++) {
            if (i === slotNumber) continue; // Skip the slot we're currently editing

            const passiveSkill = currentUnit[`passive${i}`];
            if (passiveSkill && passiveSkill.tag) {
                const tag = passiveSkill.tag.toLowerCase();
                if (counts.hasOwnProperty(tag)) {
                    counts[tag]++;
                }
            }
        }

        return counts;
    };

    // Check if a skill can be selected based on constraints
    const canSelectSkill = skill => {
        const counts = getCurrentPassiveSkillCounts();
        const skillTag = skill.tag ? skill.tag.toLowerCase() : '';

        // Special skills: max 1
        if (skillTag === 'special') {
            return counts.special < 1;
        }

        // Other skill types: max 2 each
        if (skillTag === 'offense') {
            return counts.offense < 2;
        }

        if (skillTag === 'protection') {
            return counts.protection < 2;
        }

        if (skillTag === 'balanced') {
            return counts.balanced < 2;
        }

        // Default: allow selection if tag is unknown
        return true;
    };

    // Filter skills based on current filters and constraints
    const filters = { searchTerm, selectedForceType, selectedSkillTag, skillFilterTerm };
    const baseFilteredSkills = useSkillFilters(passiveSkills, filters);

    // Apply constraint filtering
    const filteredPassiveSkills = baseFilteredSkills.filter(skill => canSelectSkill(skill));

    // Create a bound version of skillMatchesFilter for this component
    const checkSkillMatch = skill => skillMatchesFilter(skill, skillFilterTerm);

    // Get constraint information for display
    const getConstraintInfo = () => {
        const counts = getCurrentPassiveSkillCounts();
        return {
            special: { current: counts.special, max: 1 },
            offense: { current: counts.offense, max: 2 },
            protection: { current: counts.protection, max: 2 },
            balanced: { current: counts.balanced, max: 2 },
        };
    };

    const handlePassiveClick = skill => {
        if (!canSelectSkill(skill)) {
            return; // Prevent selection if constraints are violated
        }
        onPassiveSelect(skill, slotNumber);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box passive-selection-modal" onClick={e => e.stopPropagation()}>
                <div className="passive-skills-page modal-content">
                    <div className="modal-header">
                        <h2>Select Passive Ability - Slot {slotNumber}</h2>
                        <button onClick={onClose} className="close-button">
                            ×
                        </button>
                    </div>

                    <div className="page-container">
                        {/* Header Section */}
                        <div className="header-section">
                            <div className="header-top">
                                <h1 className="page-title">
                                    <div className="title-icon">🛡️</div>
                                    Passive Skills Selection
                                </h1>

                                {/* Skill Constraints Display */}
                                <div className="skill-constraints">
                                    <h3>Skill Limits</h3>
                                    <div className="constraints-grid">
                                        {Object.entries(getConstraintInfo()).map(([type, info]) => (
                                            <div
                                                key={type}
                                                className={`constraint-item ${info.current >= info.max ? 'at-limit' : ''}`}
                                            >
                                                <span className="constraint-type">
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </span>
                                                <span className="constraint-count">
                                                    {info.current}/{info.max}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Filters and Search */}
                            <FiltersSection
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                selectedForceType={selectedForceType}
                                setSelectedForceType={setSelectedForceType}
                                selectedSkillTag={selectedSkillTag}
                                setSelectedSkillTag={setSelectedSkillTag}
                                skillFilterTerm={skillFilterTerm}
                                setSkillFilterTerm={setSkillFilterTerm}
                                showSkillSuggestions={showSkillSuggestions}
                                setShowSkillSuggestions={setShowSkillSuggestions}
                                forceTypes={forceTypes}
                                skillTags={skillTags}
                                filteredSkillsCount={filteredPassiveSkills.length}
                                totalSkillsCount={baseFilteredSkills.length}
                            />
                        </div>

                        {/* Passive Skills Grid */}
                        <div className="passive-skills-grid">
                            {baseFilteredSkills.map(skill => {
                                const isSelectable = canSelectSkill(skill);
                                return (
                                    <div
                                        key={skill.id}
                                        onClick={() => isSelectable && handlePassiveClick(skill)}
                                        className={`selectable-skill-card ${!isSelectable ? 'disabled' : ''}`}
                                        title={
                                            !isSelectable
                                                ? `Cannot select: Maximum ${skill.tag} skills reached`
                                                : ''
                                        }
                                    >
                                        <PassiveSkillCard
                                            skill={skill}
                                            skillMatchesFilter={checkSkillMatch}
                                            isDisabled={!isSelectable}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PassiveSelectionModal;
