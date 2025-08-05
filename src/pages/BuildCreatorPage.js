import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import officersDataRaw from '../database/officer.json';
import unitsData from '../database/units.json';
import UnitSelectionModal from '../components/UnitSelectionModal';
import OfficerSelectionModal from '../components/OfficerSelectionModal';
import PassiveSelectionModal from '../components/PassiveSelectionModal';
import { AssignedOfficerCard } from '../components/OfficerCard';
import { OFFICER_IMAGE_BASE_URL } from '../utils/constants';
import { renderStars } from '../utils/gradeUtils';

// Convert officers object to array format
const officersData = Object.values(officersDataRaw);

// Helper function to format skill levels for display
const formatSkillLevels = skillLevels => {
    if (!skillLevels || typeof skillLevels !== 'object') {
        return ''; // No skill levels to display
    }

    // Extract the first 4 skill levels (excluding revival skill)
    const levels = [
        skillLevels[0] || 1,
        skillLevels[1] || 1,
        skillLevels[2] || 1,
        skillLevels[3] || 1,
    ];

    return ` (${levels.join('-')})`;
};

// Helper function to get officer ID from officer data
const getOfficerId = officerData => {
    return typeof officerData === 'object' ? officerData.id : officerData;
};

// Helper function to get officer skill levels from officer data
const getOfficerSkillLevels = officerData => {
    return typeof officerData === 'object' ? officerData.skillLevels : null;
};

const BuildCreatorPage = () => {
    const { buildId } = useParams();
    const navigate = useNavigate();

    // Organize units by type
    const unitsByType = useMemo(() => {
        return unitsData.reduce((acc, unit) => {
            // Clean up unit type by removing newlines and normalizing spaces
            const type = (unit.units || 'Unknown')
                .replace(/\n/g, ' ') // Replace newlines with spaces
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim() // Remove leading/trailing spaces
                .toUpperCase(); // Convert to uppercase

            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push({
                ...unit,
                camps: (unit.camps || '').toUpperCase(),
            });
            return acc;
        }, {});
    }, []);

    // State management
    const [build, setBuild] = useState({
        id: null,
        name: '',
        description: '',
        groundUnits: Array(5).fill(null), // 5 ground unit slots
        airUnits: Array(3).fill(null), // 3 air unit slots
        createdAt: null,
        updatedAt: null,
    });

    const [availableOfficers, setAvailableOfficers] = useState([]);
    const [error, setError] = useState(null);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
    const [isPassiveModalOpen, setIsPassiveModalOpen] = useState(false);
    const [currentSelection, setCurrentSelection] = useState(null); // { type: 'ground'|'air', index: number, role: 'unit'|'captain'|'aide'|'passive', slotNumber?: number }
    const [isOfficerDetailsOpen, setIsOfficerDetailsOpen] = useState(false);
    const [selectedOfficerForDetails, setSelectedOfficerForDetails] = useState(null);
    const [hoveredPassive, setHoveredPassive] = useState(null);
    const [hoveredSkill, setHoveredSkill] = useState(null);
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

    // Filter units by service compatibility when modal is open
    const filteredUnitsByType = useMemo(() => {
        if (!currentSelection || currentSelection.role !== 'unit') {
            return unitsByType;
        }

        const isGroundSlot = currentSelection.type === 'ground';

        return Object.keys(unitsByType).reduce((acc, unitType) => {
            const compatibleUnits = unitsByType[unitType].filter(unit => {
                const unitService = unit.services?.toLowerCase() || '';

                if (isGroundSlot) {
                    // Ground slots can only have Ground Forces units
                    return unitService.includes('ground');
                } else {
                    // Air slots can only have Air Force units
                    return unitService.includes('air');
                }
            });

            // Only include unit types that have compatible units
            if (compatibleUnits.length > 0) {
                acc[unitType] = compatibleUnits;
            }

            return acc;
        }, {});
    }, [unitsByType, currentSelection]);

    // Load existing build or prepare for new build
    useEffect(() => {
        if (!buildId) return;

        try {
            if (buildId === 'new') {
                setBuild({
                    id: null,
                    name: 'New Formation',
                    description: '',
                    groundUnits: Array(5).fill(null),
                    airUnits: Array(3).fill(null),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
                return;
            }

            // Try to load existing build
            const savedBuilds = localStorage.getItem('formationBuilds');
            const builds = savedBuilds ? JSON.parse(savedBuilds) : [];
            const existingBuild = builds.find(b => String(b.id) === String(buildId));

            if (existingBuild) {
                setBuild(existingBuild);
                return;
            }

            throw new Error('Build not found');
        } catch (err) {
            setError(err.message);
        }
    }, [buildId]);

    // Update available officers based on current assignments and army compatibility
    useEffect(() => {
        const assignedOfficerIds = new Set();

        // Collect all assigned officers from current build
        [...build.groundUnits, ...build.airUnits].forEach(unit => {
            if (unit?.captain) {
                // Handle both old format (just ID) and new format (object with id)
                const captainId = typeof unit.captain === 'object' ? unit.captain.id : unit.captain;
                assignedOfficerIds.add(captainId);
            }
            if (unit?.aide) {
                // Handle both old format (just ID) and new format (object with id)
                const aideId = typeof unit.aide === 'object' ? unit.aide.id : unit.aide;
                assignedOfficerIds.add(aideId);
            }
        });

        // Filter officers based on assignment status and army compatibility
        const available = officersData.filter(officer => {
            // Check if officer is already assigned (unless it's the current unit's officer)
            const currentCaptainId = currentSelection?.unit?.captain
                ? typeof currentSelection.unit.captain === 'object'
                    ? currentSelection.unit.captain.id
                    : currentSelection.unit.captain
                : null;
            const currentAideId = currentSelection?.unit?.aide
                ? typeof currentSelection.unit.aide === 'object'
                    ? currentSelection.unit.aide.id
                    : currentSelection.unit.aide
                : null;

            const isAlreadyAssigned =
                assignedOfficerIds.has(officer.id) &&
                !(currentCaptainId === officer.id) &&
                !(currentAideId === officer.id);

            if (isAlreadyAssigned) return false;

            // Check army compatibility when assigning officers
            if (currentSelection?.type) {
                const isGroundUnit = currentSelection.type === 'ground';
                const officerArmy = officer.army?.toLowerCase() || '';

                // Ground units can only have Ground Forces officers
                if (isGroundUnit && !officerArmy.includes('ground')) {
                    return false;
                }

                // Air units can only have Air Force officers
                if (!isGroundUnit && !officerArmy.includes('air')) {
                    return false;
                }
            }

            return true;
        });

        setAvailableOfficers(available);
    }, [build, currentSelection]);

    const handleOpenUnitModal = (type, index) => {
        setCurrentSelection({ type, index, role: 'unit' });
        setIsUnitModalOpen(true);
    };

    const handleOpenOfficerModal = (type, index, role) => {
        const unit = type === 'ground' ? build.groundUnits[index] : build.airUnits[index];
        setCurrentSelection({ type, index, role, unit });
        setIsOfficerModalOpen(true);
    };

    const handleSelectUnit = selectedUnit => {
        if (!currentSelection || currentSelection.role !== 'unit') return;

        const { type, index } = currentSelection;
        const newUnit = {
            ...selectedUnit,
            captain: null,
            aide: null,
            buildName: `${selectedUnit.units_name || selectedUnit.units} Configuration`,
        };

        setBuild(prev => {
            const newBuild = { ...prev };
            if (type === 'ground') {
                newBuild.groundUnits[index] = newUnit;
            } else {
                newBuild.airUnits[index] = newUnit;
            }
            newBuild.updatedAt = new Date().toISOString();
            return newBuild;
        });

        setIsUnitModalOpen(false);
        setCurrentSelection(null);
    };

    const handleAssignOfficer = (officerId, skillLevels = null) => {
        if (!currentSelection || !currentSelection.unit) return;

        const { type, index, role } = currentSelection;

        setBuild(prev => {
            const newBuild = { ...prev };
            const unitArray = type === 'ground' ? newBuild.groundUnits : newBuild.airUnits;

            if (unitArray[index]) {
                const officerData = {
                    id: Number(officerId),
                    skillLevels: skillLevels || { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 }, // Default skill levels
                };

                unitArray[index] = {
                    ...unitArray[index],
                    [role]: officerData,
                };
            }

            newBuild.updatedAt = new Date().toISOString();
            return newBuild;
        });

        setIsOfficerModalOpen(false);
        setCurrentSelection(null);
    };

    const handleRemoveUnit = (type, index) => {
        setBuild(prev => {
            const newBuild = { ...prev };
            if (type === 'ground') {
                newBuild.groundUnits[index] = null;
            } else {
                newBuild.airUnits[index] = null;
            }
            newBuild.updatedAt = new Date().toISOString();
            return newBuild;
        });

        // Clear hover states when removing a unit
        setHoveredPassive(null);
        setHoveredSkill(null);
    };

    const handleRemoveOfficer = (type, index, role) => {
        setBuild(prev => {
            const newBuild = { ...prev };
            const unitArray = type === 'ground' ? newBuild.groundUnits : newBuild.airUnits;

            if (unitArray[index]) {
                unitArray[index] = {
                    ...unitArray[index],
                    [role]: null,
                };
            }

            newBuild.updatedAt = new Date().toISOString();
            return newBuild;
        });

        // Clear hover state when removing an officer
        setHoveredSkill(null);
    };

    const handleRemovePassive = (type, index, slotNumber) => {
        setBuild(prev => {
            const newBuild = { ...prev };
            const unitArray = type === 'ground' ? newBuild.groundUnits : newBuild.airUnits;

            if (unitArray[index]) {
                unitArray[index] = {
                    ...unitArray[index],
                    [`passive${slotNumber}`]: null,
                };
            }

            newBuild.updatedAt = new Date().toISOString();
            return newBuild;
        });

        // Clear hover state when removing a passive skill
        setHoveredPassive(null);
        setHoveredSkill(null);
    };

    const handleOpenPassiveModal = (type, index, slotNumber) => {
        const unit = type === 'ground' ? build.groundUnits[index] : build.airUnits[index];
        setCurrentSelection({ type, index, role: 'passive', slotNumber, unit });
        setIsPassiveModalOpen(true);
    };

    const handlePassiveSelect = (passive, slotNumber) => {
        if (!currentSelection) return;

        setBuild(prev => {
            const newBuild = { ...prev };
            const { type, index } = currentSelection;
            const unitArray = type === 'ground' ? newBuild.groundUnits : newBuild.airUnits;

            if (unitArray[index]) {
                unitArray[index] = {
                    ...unitArray[index],
                    [`passive${slotNumber}`]: {
                        id: passive.id,
                        name: passive.name,
                        description: passive.description,
                        data: passive.data,
                        img: passive.img,
                        tag: passive.tag,
                        officerName: passive.officerName,
                    },
                };
            }

            newBuild.updatedAt = new Date().toISOString();
            return newBuild;
        });
        setIsPassiveModalOpen(false);
        setCurrentSelection(null);
    };

    const handlePassiveHover = (passive, event) => {
        setHoveredPassive(passive);
        setHoverPosition({ x: event.clientX, y: event.clientY });
    };

    const handlePassiveLeave = () => {
        setHoveredPassive(null);
    };

    const handleViewOfficerDetails = (officerId, unitType, unitIndex, role) => {
        const officer = officersData.find(o => o.id === officerId);
        if (officer) {
            // Get the unit and officer data
            const unitArray = unitType === 'ground' ? build.groundUnits : build.airUnits;
            const unit = unitArray[unitIndex];
            const officerData = unit?.[role];

            setSelectedOfficerForDetails({
                officer,
                unitType,
                unitIndex,
                role,
                skillLevels: getOfficerSkillLevels(officerData) || { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 },
            });
            setIsOfficerDetailsOpen(true);
        }
    };

    const handleCloseOfficerDetails = () => {
        setIsOfficerDetailsOpen(false);
        setSelectedOfficerForDetails(null);
    };

    const handleUpdateOfficerSkills = skillLevels => {
        if (!selectedOfficerForDetails) return;

        const { unitType, unitIndex, role } = selectedOfficerForDetails;

        setBuild(prev => {
            const newBuild = { ...prev };
            const unitArray = unitType === 'ground' ? newBuild.groundUnits : newBuild.airUnits;

            if (unitArray[unitIndex] && unitArray[unitIndex][role]) {
                // Update the officer data with new skill levels
                const currentOfficerData = unitArray[unitIndex][role];
                const officerId =
                    typeof currentOfficerData === 'object'
                        ? currentOfficerData.id
                        : currentOfficerData;

                unitArray[unitIndex][role] = {
                    id: officerId,
                    skillLevels: skillLevels,
                };

                newBuild.updatedAt = new Date().toISOString();
            }

            return newBuild;
        });

        // Update the modal state as well
        setSelectedOfficerForDetails(prev => ({
            ...prev,
            skillLevels: skillLevels,
        }));
    };

    const handleSaveBuild = () => {
        try {
            const savedBuilds = localStorage.getItem('formationBuilds');
            const builds = savedBuilds ? JSON.parse(savedBuilds) : [];

            const buildToSave = {
                ...build,
                id: build.id || Date.now(),
                updatedAt: new Date().toISOString(),
            };

            const existingIndex = builds.findIndex(b => b.id === buildToSave.id);
            if (existingIndex >= 0) {
                builds[existingIndex] = buildToSave;
            } else {
                builds.push(buildToSave);
            }

            localStorage.setItem('formationBuilds', JSON.stringify(builds));
            navigate('/builds');
        } catch (error) {
            setError('Failed to save build');
        }
    };

    const renderUnitSlot = (unit, type, index) => {
        const slotNumber = index + 1;
        const isGroundUnit = type === 'ground';

        return (
            <div key={`${type}-${index}`} className="unit-slot">
                <div className="slot-header">
                    <h4
                        className="slot-title"
                        title={
                            unit
                                ? unit.units_name || unit.units
                                : isGroundUnit
                                  ? `Ground ${slotNumber}`
                                  : `Air ${slotNumber}`
                        }
                    >
                        {unit
                            ? unit.units_name || unit.units
                            : isGroundUnit
                              ? `Ground ${slotNumber}`
                              : `Air ${slotNumber}`}
                    </h4>
                    {unit && (
                        <button
                            onClick={() => handleRemoveUnit(type, index)}
                            className="remove-unit-btn"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {unit ? (
                    <div className="unit-configuration">
                        {/* Enhanced Unit Image Container */}
                        <div className="unit-image-container">
                            <img
                                src={`https://www.afuns.cc/img/warpath/db/units/${unit.img}`}
                                alt={unit.units_name || unit.units}
                                className="unit-image"
                                onError={e => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                }}
                            />
                            <div
                                className="unit-image-fallback"
                                style={{ display: unit.img ? 'none' : 'flex' }}
                            >
                                🏗️
                            </div>
                            <div className="grade-badge">
                                Grade {unit.grades >= 4 ? renderStars(unit.grades) : unit.grades}
                            </div>
                        </div>

                        {/* Enhanced Unit Info Section */}
                        <div className="unit-info-section">
                            {/* Badges Row */}
                            <div className="unit-badges-row">
                                <div className="unit-type-badge">{unit.units || 'Unknown'}</div>
                                {unit.camps && (
                                    <div
                                        className={`unit-camps-badge camp-${(unit.camps || '').toLowerCase().replace(/\s+/g, '-')}`}
                                    >
                                        {unit.camps}
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Stats Grid */}
                            <div className="unit-stats-grid">
                                <div className="stat-item firepower">
                                    <div className="stat-icon">🔥</div>
                                    <div className="stat-label">Firepower</div>
                                    <div className="stat-value">
                                        {unit.firepower?.toLocaleString() || 'N/A'}
                                    </div>
                                </div>
                                <div className="stat-item health">
                                    <div className="stat-icon">❤️</div>
                                    <div className="stat-label">Health</div>
                                    <div className="stat-value">
                                        {(unit.health || unit.durability)?.toLocaleString() ||
                                            'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Officer Assignment */}
                        <div className="officer-assignments">
                            <div className="officer-row">
                                <span className="role-label">Captain</span>
                                {unit.captain ? (
                                    <div className="officer-display">
                                        <span
                                            className="officer-name clickable"
                                            onClick={() =>
                                                handleViewOfficerDetails(
                                                    getOfficerId(unit.captain),
                                                    type,
                                                    index,
                                                    'captain'
                                                )
                                            }
                                            title="Click to view officer details"
                                        >
                                            {officersData.find(
                                                o => o.id === getOfficerId(unit.captain)
                                            )?.nickname || 'Unknown'}
                                            {formatSkillLevels(getOfficerSkillLevels(unit.captain))}
                                        </span>
                                        <button
                                            onClick={() =>
                                                handleRemoveOfficer(type, index, 'captain')
                                            }
                                            className="remove-officer-btn"
                                            title="Remove Captain"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() =>
                                            handleOpenOfficerModal(type, index, 'captain')
                                        }
                                        className="assign-officer-btn"
                                    >
                                        + Assign
                                    </button>
                                )}
                            </div>
                            <div className="officer-row">
                                <span className="role-label">Aide</span>
                                {unit.aide ? (
                                    <div className="officer-display">
                                        <span
                                            className="officer-name clickable"
                                            onClick={() =>
                                                handleViewOfficerDetails(
                                                    getOfficerId(unit.aide),
                                                    type,
                                                    index,
                                                    'aide'
                                                )
                                            }
                                            title="Click to view officer details"
                                        >
                                            {officersData.find(
                                                o => o.id === getOfficerId(unit.aide)
                                            )?.nickname || 'Unknown'}
                                            {formatSkillLevels(getOfficerSkillLevels(unit.aide))}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveOfficer(type, index, 'aide')}
                                            className="remove-officer-btn"
                                            title="Remove Aide"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleOpenOfficerModal(type, index, 'aide')}
                                        className="assign-officer-btn"
                                    >
                                        + Assign
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Passive Abilities Section */}
                        <div className="passive-abilities">
                            <div className="passive-abilities-header">
                                <span className="passive-label">Passive Abilities</span>
                            </div>
                            <div className="passive-abilities-grid">
                                {[1, 2, 3, 4].map(slotNumber => (
                                    <div key={slotNumber} className="passive-slot">
                                        {unit[`passive${slotNumber}`] ? (
                                            <div
                                                className="passive-display"
                                                onMouseEnter={e =>
                                                    handlePassiveHover(
                                                        unit[`passive${slotNumber}`],
                                                        e
                                                    )
                                                }
                                                onMouseLeave={handlePassiveLeave}
                                            >
                                                <img
                                                    src={`${OFFICER_IMAGE_BASE_URL}${unit[`passive${slotNumber}`].img}`}
                                                    alt={unit[`passive${slotNumber}`].name}
                                                    className="passive-image"
                                                    onError={e => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.display =
                                                            'flex';
                                                    }}
                                                />
                                                <div
                                                    className="passive-image-fallback"
                                                    style={{ display: 'none' }}
                                                >
                                                    🔹
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        handleRemovePassive(type, index, slotNumber)
                                                    }
                                                    className="remove-passive-btn"
                                                    title={`Remove Passive ${slotNumber}`}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    handleOpenPassiveModal(type, index, slotNumber)
                                                }
                                                className="assign-passive-btn"
                                                title={`Assign Passive ${slotNumber}`}
                                            >
                                                +
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => handleOpenUnitModal(type, index)}
                        className="add-unit-button"
                    >
                        <div className="plus-icon">+</div>
                        <div className="add-text">Add {isGroundUnit ? 'Ground' : 'Air'} Unit</div>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="build-creator-page">
            <div className="page-container">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-top">
                        <h1 className="page-title">
                            <div className="title-icon">🏗️</div>
                            Formation Builder
                        </h1>
                        <div className="build-meta">
                            <input
                                type="text"
                                value={build.name}
                                onChange={e =>
                                    setBuild(prev => ({
                                        ...prev,
                                        name: e.target.value,
                                        updatedAt: new Date().toISOString(),
                                    }))
                                }
                                placeholder="Formation name..."
                                className="build-name-input"
                            />
                            <textarea
                                value={build.description}
                                onChange={e =>
                                    setBuild(prev => ({
                                        ...prev,
                                        description: e.target.value,
                                        updatedAt: new Date().toISOString(),
                                    }))
                                }
                                placeholder="Formation description..."
                                className="build-description-input"
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button onClick={handleSaveBuild} className="btn save-button">
                            💾 Save Formation
                        </button>
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}
                </div>

                {/* Formation Overview */}
                <div className="formation-overview">
                    <div className="formation-stats">
                        <div className="stat-card">
                            <div className="stat-label">Ground Units</div>
                            <div className="stat-value">
                                {build.groundUnits.filter(u => u !== null).length}/5
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Air Units</div>
                            <div className="stat-value">
                                {build.airUnits.filter(u => u !== null).length}/3
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Officers</div>
                            <div className="stat-value">
                                {[...build.groundUnits, ...build.airUnits].reduce((count, unit) => {
                                    if (!unit) return count;
                                    return count + (unit.captain ? 1 : 0) + (unit.aide ? 1 : 0);
                                }, 0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ground Units Section */}
                <div className="units-section">
                    <div className="section-header">
                        <h2 className="section-title">Ground Forces</h2>
                        <p className="section-subtitle">
                            Configure up to 5 ground units for your formation
                        </p>
                    </div>
                    <div className="units-grid ground-units">
                        {build.groundUnits.map((unit, index) =>
                            renderUnitSlot(unit, 'ground', index)
                        )}
                    </div>
                </div>

                {/* Air Units Section */}
                <div className="units-section">
                    <div className="section-header">
                        <h2 className="section-title">Air Force</h2>
                        <p className="section-subtitle">
                            Configure up to 3 air units for your formation
                        </p>
                    </div>
                    <div className="units-grid air-units">
                        {build.airUnits.map((unit, index) => renderUnitSlot(unit, 'air', index))}
                    </div>
                </div>

                {/* Unit Selection Modal */}
                <UnitSelectionModal
                    isOpen={isUnitModalOpen}
                    onClose={() => {
                        setIsUnitModalOpen(false);
                        setCurrentSelection(null);
                    }}
                    onUnitSelect={handleSelectUnit}
                    unitsByType={filteredUnitsByType}
                />

                {/* Officer Selection Modal */}
                <OfficerSelectionModal
                    isOpen={isOfficerModalOpen}
                    onClose={() => {
                        setIsOfficerModalOpen(false);
                        setCurrentSelection(null);
                    }}
                    onOfficerSelect={handleAssignOfficer}
                    availableOfficers={availableOfficers}
                    slotType={currentSelection?.role === 'captain' ? 'Captain' : 'Aide'}
                />

                {/* Officer Details Modal */}
                {isOfficerDetailsOpen && selectedOfficerForDetails && (
                    <div className="modal-overlay" onClick={handleCloseOfficerDetails}>
                        <div className="officer-details-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Officer Details</h2>
                                <button onClick={handleCloseOfficerDetails} className="close-btn">
                                    ✕
                                </button>
                            </div>
                            <div className="modal-content">
                                <AssignedOfficerCard
                                    officer={selectedOfficerForDetails.officer}
                                    skillLevels={selectedOfficerForDetails.skillLevels}
                                    onSkillLevelsChange={handleUpdateOfficerSkills}
                                    onRemove={null}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Passive Selection Modal */}
                <PassiveSelectionModal
                    isOpen={isPassiveModalOpen}
                    onClose={() => {
                        setIsPassiveModalOpen(false);
                        setCurrentSelection(null);
                    }}
                    onPassiveSelect={handlePassiveSelect}
                    slotNumber={currentSelection?.slotNumber}
                    currentUnit={currentSelection?.unit}
                />

                {/* Officer Skill Hover Modal */}
                {hoveredPassive && (
                    <div
                        className="skill-hover-modal"
                        style={{
                            position: 'fixed',
                            left: `${hoverPosition.x}px`,
                            top: `${hoverPosition.y - 42.5}px`,
                            transform: 'translateX(-50%) translateY(-100%)',
                            zIndex: 999999,
                            pointerEvents: 'none',
                        }}
                    >
                        <div className="skill-hover-content">
                            <div className="skill-hover-header">
                                <div className="skill-hover-icon">
                                    {hoveredPassive.img ? (
                                        <img
                                            src={`https://www.afuns.cc/img/warpath/db/officers/${hoveredPassive.img}`}
                                            alt={hoveredPassive.name}
                                            className="skill-hover-image"
                                            onError={e => {
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="skill-hover-fallback"
                                        style={{ display: hoveredPassive.img ? 'none' : 'flex' }}
                                    >
                                        🔹
                                    </div>
                                </div>
                                <div className="skill-hover-title">
                                    <h4 className="skill-hover-name">{hoveredPassive.name}</h4>
                                    {hoveredPassive.tag && (
                                        <div className="skill-hover-tag">{hoveredPassive.tag}</div>
                                    )}
                                </div>
                            </div>

                            {hoveredPassive.desc && (
                                <div className="skill-hover-description">{hoveredPassive.desc}</div>
                            )}

                            {hoveredPassive.data && hoveredPassive.data.length > 0 && (
                                <div className="skill-hover-details">
                                    <div className="skill-hover-details-title">Details:</div>
                                    <div
                                        className="skill-hover-details-content"
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                hoveredPassive.data[0]?.replace(
                                                    /<br\s*\/?>/gi,
                                                    '<br>'
                                                ) || '',
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Officer Skill Hover Modal */}
                {hoveredSkill && (
                    <div
                        className="skill-hover-modal"
                        style={{
                            position: 'fixed',
                            left: `${hoverPosition.x}px`,
                            top: `${hoverPosition.y - 42.5}px`,
                            transform: 'translateX(-50%) translateY(-100%)',
                            zIndex: 999999,
                            pointerEvents: 'none',
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
                                            onError={e => {
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="skill-hover-fallback"
                                        style={{ display: hoveredSkill.img ? 'none' : 'flex' }}
                                    >
                                        🔹
                                    </div>
                                </div>
                                <div className="skill-hover-title">
                                    <h4 className="skill-hover-name">{hoveredSkill.name}</h4>
                                    {hoveredSkill.tag && (
                                        <div className="skill-hover-tag">{hoveredSkill.tag}</div>
                                    )}
                                </div>
                            </div>

                            {hoveredSkill.desc && (
                                <div className="skill-hover-description">{hoveredSkill.desc}</div>
                            )}

                            {hoveredSkill.data && hoveredSkill.data.length > 0 && (
                                <div className="skill-hover-details">
                                    <div className="skill-hover-details-title">Details:</div>
                                    <div
                                        className="skill-hover-details-content"
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                hoveredSkill.data[0]?.replace(
                                                    /<br\s*\/?>/gi,
                                                    '<br>'
                                                ) || '',
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuildCreatorPage;
