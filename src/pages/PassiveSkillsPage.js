import React, { useState } from 'react';
import officersDataRaw from '../database/officer.json';
import { usePassiveSkills, useSkillFilters } from '../utils/passiveSkillsHooks';
import { skillMatchesFilter } from '../utils/passiveSkillsUtils';
import { DEFAULT_FILTERS } from '../utils/constants';
import FiltersSection from '../components/FiltersSection';
import PassiveSkillCard from '../components/PassiveSkillCard';
import '../styles/PassiveSkillsPage.scss';

// Convert officers object to array format
const officersData = Object.values(officersDataRaw);

const PassiveSkillsPage = () => {
    // State management
    const [searchTerm, setSearchTerm] = useState(DEFAULT_FILTERS.searchTerm);
    const [selectedForceType, setSelectedForceType] = useState(DEFAULT_FILTERS.selectedForceType);
    const [selectedSkillTag, setSelectedSkillTag] = useState(DEFAULT_FILTERS.selectedSkillTag);
    const [skillFilterTerm, setSkillFilterTerm] = useState(DEFAULT_FILTERS.skillFilterTerm);
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

    // Extract passive skills data
    const { passiveSkills, forceTypes, skillTags } = usePassiveSkills(officersData);

    // Filter skills based on current filters
    const filters = { searchTerm, selectedForceType, selectedSkillTag, skillFilterTerm };
    const filteredPassiveSkills = useSkillFilters(passiveSkills, filters);

    // Create a bound version of skillMatchesFilter for this component
    const checkSkillMatch = skill => skillMatchesFilter(skill, skillFilterTerm);

    return (
        <div className="passive-skills-page">
            <div className="page-container">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-top">
                        <h1 className="page-title">
                            <div className="title-icon">🛡️</div>
                            Passive Skills Database
                        </h1>
                        <p className="page-subtitle">
                            Browse and explore all passive skills from military officers
                        </p>
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
                    />
                </div>

                {/* Passive Skills Grid */}
                <div className="passive-skills-grid">
                    {filteredPassiveSkills.map(skill => (
                        <PassiveSkillCard
                            key={skill.id}
                            skill={skill}
                            skillMatchesFilter={checkSkillMatch}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PassiveSkillsPage;
