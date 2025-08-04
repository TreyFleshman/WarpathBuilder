import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import officersData from '../database/officer.json';
import unitsData from '../database/units.json';
import UnitSelectionModal from '../components/UnitSelectionModal';
import OfficerSelectionModal from '../components/OfficerSelectionModal';
import { AssignedOfficerCard } from '../components/OfficerCard';

// Function to render star display based on grade
const renderStars = (grade) => {
    const gradeNum = parseFloat(grade);
    const baseGrade = Math.floor(gradeNum);
    const decimal = Math.round((gradeNum % 1) * 10) / 10;

    let stars = '';
    let color = '';
    let numStars = 0;

    if (gradeNum >= 4 && gradeNum < 6) {
        color = '#c0c0c0'; // Silver
        numStars = baseGrade;
    } else if (gradeNum >= 6 && gradeNum < 8) {
        color = '#ffd700'; // Gold
        if (gradeNum >= 6 && gradeNum < 7) {
            numStars = 1;
        } else {
            numStars = 2;
        }
    } else if (gradeNum >= 8) {
        color = '#4682b4'; // Steel blue
        if (gradeNum >= 8 && gradeNum < 9) {
            numStars = 1;
        } else {
            numStars = 2;
        }
    }

    for (let i = 0; i < numStars; i++) {
        stars += '★';
    }

    let chevron = '';
    if (decimal === 0.1) {
        chevron = '>';
    } else if (decimal === 0.2) {
        chevron = '>>';
    }

    return (
        <span style={{ color, fontWeight: 'bold' }}>
            {stars}{chevron}
        </span>
    );
};

const BuildCreatorPage = () => {
    const { buildId } = useParams();
    const navigate = useNavigate();

    // Organize units by type
    const unitsByType = useMemo(() => {
        return unitsData.reduce((acc, unit) => {
            // Clean up unit type by removing newlines and normalizing spaces
            const type = (unit.units || 'Unknown')
                .replace(/\n/g, ' ')  // Replace newlines with spaces
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim()               // Remove leading/trailing spaces
                .toUpperCase();       // Convert to uppercase

            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push({
                ...unit,
                camps: (unit.camps || '').toUpperCase()
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
        airUnits: Array(3).fill(null),    // 3 air unit slots
        createdAt: null,
        updatedAt: null
    });

    const [availableOfficers, setAvailableOfficers] = useState([]);
    const [error, setError] = useState(null);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
    const [currentSelection, setCurrentSelection] = useState(null); // { type: 'ground'|'air', index: number, role: 'unit'|'captain'|'aide' }
    const [isOfficerDetailsOpen, setIsOfficerDetailsOpen] = useState(false);
    const [selectedOfficerForDetails, setSelectedOfficerForDetails] = useState(null);

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
                    updatedAt: new Date().toISOString()
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
            if (unit?.captain) assignedOfficerIds.add(unit.captain);
            if (unit?.aide) assignedOfficerIds.add(unit.aide);
        });

        // Filter officers based on assignment status and army compatibility
        const available = officersData.filter(officer => {
            // Check if officer is already assigned (unless it's the current unit's officer)
            const isAlreadyAssigned = assignedOfficerIds.has(officer.id) &&
                !(currentSelection?.unit?.captain === officer.id) &&
                !(currentSelection?.unit?.aide === officer.id);

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

    const handleSelectUnit = (selectedUnit) => {
        if (!currentSelection || currentSelection.role !== 'unit') return;

        const { type, index } = currentSelection;
        const newUnit = {
            ...selectedUnit,
            captain: null,
            aide: null,
            buildName: `${selectedUnit.units_name || selectedUnit.units} Configuration`
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

    const handleAssignOfficer = (officerId) => {
        if (!currentSelection || !currentSelection.unit) return;

        const { type, index, role } = currentSelection;

        setBuild(prev => {
            const newBuild = { ...prev };
            const unitArray = type === 'ground' ? newBuild.groundUnits : newBuild.airUnits;

            if (unitArray[index]) {
                unitArray[index] = {
                    ...unitArray[index],
                    [role]: Number(officerId)
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
    };

    const handleRemoveOfficer = (type, index, role) => {
        setBuild(prev => {
            const newBuild = { ...prev };
            const unitArray = type === 'ground' ? newBuild.groundUnits : newBuild.airUnits;

            if (unitArray[index]) {
                unitArray[index] = {
                    ...unitArray[index],
                    [role]: null
                };
            }

            newBuild.updatedAt = new Date().toISOString();
            return newBuild;
        });
    };

    const handleViewOfficerDetails = (officerId) => {
        const officer = officersData.find(o => o.id === officerId);
        if (officer) {
            setSelectedOfficerForDetails(officer);
            setIsOfficerDetailsOpen(true);
        }
    };

    const handleCloseOfficerDetails = () => {
        setIsOfficerDetailsOpen(false);
        setSelectedOfficerForDetails(null);
    };

    const handleSaveBuild = () => {
        try {
            const savedBuilds = localStorage.getItem('formationBuilds');
            const builds = savedBuilds ? JSON.parse(savedBuilds) : [];

            const buildToSave = {
                ...build,
                id: build.id || Date.now(),
                updatedAt: new Date().toISOString()
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
                    <h4 className="slot-title">
                        {isGroundUnit ? `Ground ${slotNumber}` : `Air ${slotNumber}`}
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
                        {/* Unit Info Header */}
                        <div className="unit-header">
                            <div className="unit-image-thumb">
                                {unit.img && (
                                    <img
                                        src={`https://www.afuns.cc/img/warpath/db/units/${unit.img}`}
                                        alt={unit.units_name || unit.units}
                                        className="unit-thumb"
                                    />
                                )}
                            </div>
                            <div className="unit-info">
                                <div className="unit-name">{unit.units_name || unit.units}</div>
                                <div className="unit-grade">
                                    Grade {unit.grades >= 4 ? renderStars(unit.grades) : unit.grades}
                                </div>
                                <div className="unit-stats">
                                    <span>🔥 {unit.firepower?.toLocaleString()}</span>
                                    <span>❤️ {(unit.health || unit.durability)?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Simple Officer Assignment */}
                        <div className="officer-assignments">
                            <div className="officer-row">
                                <span className="role-label">Captain</span>
                                {unit.captain ? (
                                    <div className="officer-display">
                                        <span
                                            className="officer-name clickable"
                                            onClick={() => handleViewOfficerDetails(unit.captain)}
                                            title="Click to view officer details"
                                        >
                                            {officersData.find(o => o.id === unit.captain)?.nickname || 'Unknown'}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveOfficer(type, index, 'captain')}
                                            className="remove-officer-btn"
                                            title="Remove Captain"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleOpenOfficerModal(type, index, 'captain')}
                                        className="assign-officer-btn"
                                    >
                                        + Assign Captain
                                    </button>
                                )}
                            </div>
                            <div className="officer-row">
                                <span className="role-label">Aide</span>
                                {unit.aide ? (
                                    <div className="officer-display">
                                        <span
                                            className="officer-name clickable"
                                            onClick={() => handleViewOfficerDetails(unit.aide)}
                                            title="Click to view officer details"
                                        >
                                            {officersData.find(o => o.id === unit.aide)?.nickname || 'Unknown'}
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
                                        + Assign Aide
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => handleOpenUnitModal(type, index)}
                        className="add-unit-button"
                    >
                        <div className="plus-icon">+</div>
                        <div className="add-text">
                            Add {isGroundUnit ? 'Ground' : 'Air'} Unit
                        </div>
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
                                onChange={(e) => setBuild(prev => ({
                                    ...prev,
                                    name: e.target.value,
                                    updatedAt: new Date().toISOString()
                                }))}
                                placeholder="Formation name..."
                                className="build-name-input"
                            />
                            <textarea
                                value={build.description}
                                onChange={(e) => setBuild(prev => ({
                                    ...prev,
                                    description: e.target.value,
                                    updatedAt: new Date().toISOString()
                                }))}
                                placeholder="Formation description..."
                                className="build-description-input"
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button
                            onClick={handleSaveBuild}
                            className="btn save-button"
                        >
                            💾 Save Formation
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}
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
                        <p className="section-subtitle">Configure up to 5 ground units for your formation</p>
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
                        <p className="section-subtitle">Configure up to 3 air units for your formation</p>
                    </div>
                    <div className="units-grid air-units">
                        {build.airUnits.map((unit, index) =>
                            renderUnitSlot(unit, 'air', index)
                        )}
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
                        <div className="officer-details-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Officer Details</h2>
                                <button onClick={handleCloseOfficerDetails} className="close-btn">✕</button>
                            </div>
                            <div className="modal-content">
                                <AssignedOfficerCard
                                    officer={selectedOfficerForDetails}
                                    onRemove={null}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuildCreatorPage;
