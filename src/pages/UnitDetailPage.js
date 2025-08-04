
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import officersData from '../database/officer.json';
import unitsData from '../database/units.json';
import UnitSelectionModal from '../components/UnitSelectionModal';
import OfficerSelectionModal from '../components/OfficerSelectionModal';
import { AssignedOfficerCard } from '../components/OfficerCard';
import { saveOfficerAssignments, saveBuild } from '../utils/storage';

// Function to render star display based on grade
const renderStars = (grade) => {
    const gradeNum = parseFloat(grade);
    const baseGrade = Math.floor(gradeNum);
    const decimal = Math.round((gradeNum % 1) * 10) / 10; // Get decimal part (0.1, 0.2, etc.)

    let stars = '';
    let color = '';
    let numStars = 0;

    if (gradeNum >= 4 && gradeNum < 6) {
        // Silver stars (4-5.x)
        color = '#c0c0c0'; // Silver
        numStars = baseGrade;
    } else if (gradeNum >= 6 && gradeNum < 8) {
        // Gold stars (6-7.x)
        color = '#ffd700'; // Gold
        if (gradeNum >= 6 && gradeNum < 7) {
            numStars = 1; // Single gold star for 6.x
        } else {
            numStars = 2; // Double gold star for 7.x
        }
    } else if (gradeNum >= 8) {
        // Blue stars (8+)
        color = '#4682b4'; // Steel blue
        if (gradeNum >= 8 && gradeNum < 9) {
            numStars = 1; // Single blue star for 8.x
        } else {
            numStars = 2; // Double blue star for 9.x
        }
    }

    // Generate stars
    for (let i = 0; i < numStars; i++) {
        stars += '★';
    }

    // Add chevrons for decimal grades
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

const UnitDetailPage = () => {
    const { unitId } = useParams();
    const navigate = useNavigate();

    // Organize units by type - memoized to prevent recalculation
    const unitsByType = useMemo(() => {
        return unitsData.reduce((acc, unit) => {
            const type = (unit.units || 'Unknown').toUpperCase();
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
    const [unit, setUnit] = useState({
        id: null,
        name: '',
        captain: null,
        aide: null,
        buildName: ''
    });
    const [availableOfficers, setAvailableOfficers] = useState([]);
    const [error, setError] = useState(null);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(unitId === 'new');
    const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
    const [selectedBaseUnit, setSelectedBaseUnit] = useState(null);
    const [currentOfficerSlot, setCurrentOfficerSlot] = useState(null); // 'captain' or 'aide'

    // Load existing build or prepare for new build
    useEffect(() => {
        if (!unitId) return;

        try {
            if (unitId === 'new') {
                setUnit({ id: null, name: '', officers: [], buildName: '' });
                setSelectedBaseUnit(null);
                return;
            }

            // Try to load existing build first
            const savedBuilds = localStorage.getItem('unitBuilds');
            const builds = savedBuilds ? JSON.parse(savedBuilds) : [];
            const existingBuild = builds.find(b => String(b.id) === String(unitId));

            if (existingBuild) {
                setUnit(existingBuild);
                const selectedUnit = unitsData.find((u) => String(u.id) === String(existingBuild.baseUnitId));
                if (selectedUnit) {
                    setSelectedBaseUnit(selectedUnit);
                }
                return;
            }

            // If not found in builds, check if it's a new unit selection
            const selectedUnit = unitsData.find((u) => String(u.id) === String(unitId));
            if (!selectedUnit) {
                throw new Error('Unit not found');
            }

            setSelectedBaseUnit(selectedUnit);
            setIsUnitModalOpen(false);
            setUnit({
                ...selectedUnit,
                id: null,
                buildName: `${selectedUnit.units_name || selectedUnit.units} Build`,
                officers: [],
                baseUnitId: selectedUnit.id
            });
        } catch (err) {
            setError(err.message);
        }
    }, [unitId]);

    // Update available officers whenever assigned officers change
    useEffect(() => {
        const assignedOfficerIds = new Set();
        unitsData.forEach(u => {
            if (u.captain) assignedOfficerIds.add(u.captain);
            if (u.aide) assignedOfficerIds.add(u.aide);
        });

        const available = officersData.filter(officer =>
            !assignedOfficerIds.has(officer.id) ||
            officer.id === unit.captain ||
            officer.id === unit.aide
        );
        setAvailableOfficers(available);
    }, [unit.captain, unit.aide]);

    const handleOpenOfficerModal = (slot) => {
        setCurrentOfficerSlot(slot);
        setIsOfficerModalOpen(true);
    };

    const handleAssignOfficer = (officerId) => {
        if (!officerId || !currentOfficerSlot) {
            setError('Invalid officer selection');
            return;
        }

        setError(null);

        const officerToAssign = availableOfficers.find(o => String(o.id) === String(officerId));
        if (!officerToAssign) {
            setError('Selected officer is not available');
            return;
        }

        // Check if officer is already assigned to another slot
        if (
            (unit.captain === Number(officerId) && currentOfficerSlot !== 'captain') ||
            (unit.aide === Number(officerId) && currentOfficerSlot !== 'aide')
        ) {
            setError('Officer already assigned to this unit');
            return;
        }

        setUnit(prevUnit => {
            const updatedUnit = {
                ...prevUnit,
                [currentOfficerSlot]: Number(officerId)
            };
            saveOfficerAssignments(updatedUnit);
            return updatedUnit;
        });

        setIsOfficerModalOpen(false);
    };

    const handleRemoveOfficer = (slot) => {
        setError(null);
        setUnit(prevUnit => {
            const updatedUnit = {
                ...prevUnit,
                [slot]: null
            };
            saveOfficerAssignments(updatedUnit);
            return updatedUnit;
        });
    };

    const handleSaveBuild = () => {
        if (!selectedBaseUnit) {
            setError('Please select a unit first');
            return;
        }

        try {
            saveBuild(unit, selectedBaseUnit);
            navigate('/');
        } catch (error) {
            setError('Failed to save build');
        }
    };

    return (
        <div className="unit-detail-page">
            <div className="page-container">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-top">
                        <h1 className="page-title">
                            <div className="title-icon">⚔️</div>
                            Unit Builder
                        </h1>
                        {unit.buildName && (
                            <div className="build-name-section">
                                <input
                                    type="text"
                                    value={unit.buildName}
                                    onChange={(e) => setUnit(prev => ({ ...prev, buildName: e.target.value }))}
                                    placeholder="Enter build name..."
                                    className="build-name-input"
                                />
                            </div>
                        )}
                    </div>

                    <div className="action-buttons">
                        <button
                            onClick={() => navigate('/')}
                            className="btn back-button"
                        >
                            ← Back to Units List
                        </button>
                        <button
                            onClick={() => setIsUnitModalOpen(true)}
                            className="btn change-unit-button"
                        >
                            {selectedBaseUnit ? '🔄 Change Unit' : '📋 Select Unit'}
                        </button>
                        <button
                            onClick={handleSaveBuild}
                            className={`btn save-button ${selectedBaseUnit ? 'enabled' : 'disabled'}`}
                            disabled={!selectedBaseUnit}
                        >
                            💾 Save Build
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* Selected Unit Showcase */}
                {selectedBaseUnit ? (
                    <div className="unit-showcase">
                        <div className="unit-info">
                            <div className="unit-image-container">
                                {selectedBaseUnit.img && (
                                    <img
                                        src={`https://www.afuns.cc/img/warpath/db/units/${selectedBaseUnit.img}`}
                                        alt={selectedBaseUnit.units_name || `Unit ${selectedBaseUnit.id}`}
                                        className="unit-image"
                                    />
                                )}
                                <div className="unit-grade-badge">
                                    Grade {selectedBaseUnit.grades >= 4 ? renderStars(selectedBaseUnit.grades) : selectedBaseUnit.grades}
                                </div>
                            </div>
                            <div className="unit-details-content">
                                <h2 className="unit-name">
                                    {selectedBaseUnit.units_name || selectedBaseUnit.units}
                                </h2>
                                <div className="unit-stats">
                                    <div className="stat-card">
                                        <div className="stat-label">Type</div>
                                        <div className="stat-value">{selectedBaseUnit.units}</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-label">Service</div>
                                        <div className="stat-value">{selectedBaseUnit.services}</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-label">Firepower</div>
                                        <div className="stat-value">{selectedBaseUnit.firepower.toLocaleString()}</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-label">Health</div>
                                        <div className="stat-value">
                                            {selectedBaseUnit.health && selectedBaseUnit.health !== ""
                                                ? selectedBaseUnit.health.toLocaleString()
                                                : selectedBaseUnit.durability && selectedBaseUnit.durability !== ""
                                                    ? selectedBaseUnit.durability.toLocaleString()
                                                    : "N/A"
                                            }
                                        </div>
                                    </div>
                                    {selectedBaseUnit.troop_speed && selectedBaseUnit.troop_speed !== "" && (
                                        <div className="stat-card">
                                            <div className="stat-label">Speed</div>
                                            <div className="stat-value">{selectedBaseUnit.troop_speed}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h2 className="empty-title">No Unit Selected</h2>
                        <p className="empty-description">
                            Choose a unit to start building your army composition
                        </p>
                        <button
                            onClick={() => setIsUnitModalOpen(true)}
                            className="btn change-unit-button"
                        >
                            Select Unit
                        </button>
                    </div>
                )}

                {/* Officers Section */}
                <div className="officers-section">
                    <div className="section-header">
                        <h2 className="section-title">Unit Officers</h2>
                        <p className="section-subtitle">
                            Assign a Captain and Aide to maximize your unit's potential
                        </p>
                    </div>

                    <div className="officers-grid">
                        {/* Captain Slot */}
                        <div className="officer-slot">
                            <div className="slot-header">
                                <h3 className="slot-title">Captain</h3>
                                <div className="slot-badge">Leadership Role</div>
                            </div>
                            {unit.captain ? (
                                <AssignedOfficerCard
                                    key={`captain-${unit.captain}`}
                                    officer={officersData.find(o => o.id === unit.captain)}
                                    onRemove={() => handleRemoveOfficer('captain')}
                                />
                            ) : (
                                <button
                                    onClick={() => handleOpenOfficerModal('captain')}
                                    className="add-officer-button"
                                >
                                    <div className="plus-icon">+</div>
                                    <div className="add-text">Add Captain</div>
                                </button>
                            )}
                        </div>

                        {/* Aide Slot */}
                        <div className="officer-slot">
                            <div className="slot-header">
                                <h3 className="slot-title">Aide</h3>
                                <div className="slot-badge">Support Role</div>
                            </div>
                            {unit.aide ? (
                                <AssignedOfficerCard
                                    key={`aide-${unit.aide}`}
                                    officer={officersData.find(o => o.id === unit.aide)}
                                    onRemove={() => handleRemoveOfficer('aide')}
                                />
                            ) : (
                                <button
                                    onClick={() => handleOpenOfficerModal('aide')}
                                    className="add-officer-button"
                                >
                                    <div className="plus-icon">+</div>
                                    <div className="add-text">Add Aide</div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Unit Selection Modal */}
                <UnitSelectionModal
                    isOpen={isUnitModalOpen}
                    onClose={() => setIsUnitModalOpen(false)}
                    onUnitSelect={(unit) => {
                        setSelectedBaseUnit(unit);
                        setUnit(prev => ({
                            ...prev,
                            id: null,
                            buildName: `${unit.units_name || unit.units} Build`,
                            officers: [],
                            baseUnitId: unit.id
                        }));
                        setIsUnitModalOpen(false);
                    }}
                    unitsByType={unitsByType}
                    selectedUnitId={unitId}
                />

                {/* Officer Selection Modal */}
                <OfficerSelectionModal
                    isOpen={isOfficerModalOpen}
                    onClose={() => setIsOfficerModalOpen(false)}
                    onOfficerSelect={handleAssignOfficer}
                    availableOfficers={availableOfficers}
                    slotType={currentOfficerSlot === 'captain' ? 'Captain' : 'Aide'}
                />
            </div>
        </div>
    );
};

export default UnitDetailPage;
