
import React, { useState, useEffect } from 'react';

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

const UnitSelectionModal = ({ isOpen, onClose, onUnitSelect, unitsByType, selectedUnitId }) => {
    const [selectedCamp, setSelectedCamp] = useState('LIBERTY');
    const [selectedType, setSelectedType] = useState('INFANTRY');

    // Update selected type when camp changes to ensure it's valid
    useEffect(() => {
        const availableTypes = Object.entries(unitsByType)
            .filter(([, units]) => units.some(unit => unit.camps.toUpperCase() === selectedCamp))
            .map(([type]) => type);
        if (!availableTypes.includes(selectedType)) {
            setSelectedType(availableTypes[0] || '');
        }
    }, [selectedCamp, unitsByType, selectedType]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box unit-selection-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-content">
                    {/* Header with Camp Selection */}
                    <div className="modal-header">
                        <div className="camp-selection">
                            <h2>Select Unit</h2>
                            <div>
                                {['LIBERTY', 'VANGUARD', 'MARTYS'].map(camp => (
                                    <button
                                        key={camp}
                                        onClick={() => setSelectedCamp(camp)}
                                        className={`camp-button ${selectedCamp === camp ? 'selected' : ''}`}
                                    >
                                        {camp}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="close-button"
                        >
                            ×
                        </button>
                    </div>

                    {/* Unit Type Selection */}
                    <div className="type-filters">
                        {Object.entries(unitsByType)
                            .filter(([, units]) => units.some(unit => unit.camps.toUpperCase() === selectedCamp))
                            .map(([type]) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`type-button ${selectedType === type ? 'selected' : ''}`}
                                >
                                    {type}
                                </button>
                            ))}
                    </div>

                    {/* Filtered Units Display */}
                    <div className="units-grid">
                        {unitsByType[selectedType]?.filter(unit => unit.camps.toUpperCase() === selectedCamp)
                            .sort((a, b) => b.grades + a.grades)
                            .map((unit) => (
                                <div
                                    key={unit.id}
                                    onClick={() => onUnitSelect(unit)}
                                    className={`unit-card ${String(unit.id) === String(selectedUnitId) ? 'selected' : ''} ${unit.grades >= 4 ? 'premium' : ''}`}
                                >
                                    {unit.img && (
                                        <img
                                            src={`https://www.afuns.cc/img/warpath/db/units/${unit.img}`}
                                            alt={unit.units_name || `Unit ${unit.id}`}
                                            className="unit-image"
                                        />
                                    )}
                                    <div className="unit-info">
                                        <div className="unit-name">
                                            {unit.units_name || unit.units}
                                        </div>
                                        <div className="unit-detail">Grade: {unit.grades >= 4 ? renderStars(unit.grades) : unit.grades}</div>
                                        <div className="unit-detail">FP: {unit.firepower.toLocaleString()}</div>
                                        <div className="unit-detail">Health: {
                                            unit.health && unit.health !== ""
                                                ? unit.health.toLocaleString()
                                                : unit.durability && unit.durability !== ""
                                                    ? unit.durability.toLocaleString()
                                                    : "N/A"
                                        }</div>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="selection-summary">
                        <div className="summary-item">
                            <span style={{ color: '#c0c0c0' }}>★★★★★</span> = Grade 4-5 (Silver stars)
                        </div>
                        <div className="summary-item">
                            <span style={{ color: '#ffd700' }}>★</span> = Grade 6, <span style={{ color: '#ffd700' }}>★★</span> = Grade 7 (Gold stars)
                        </div>
                        <div className="summary-item">
                            <span style={{ color: '#4682b4' }}>★</span> = Grade 8, <span style={{ color: '#4682b4' }}>★★</span> = Grade 9+ (Blue stars)
                        </div>
                        <div className="summary-item">
                            <span style={{ color: '#ffd700' }}>★{'>'}</span> = .1 grade, <span style={{ color: '#ffd700' }}>★{'>>'}</span> = .2 grade
                        </div>
                        <div className="summary-item">
                            <span>FP = Firepower</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitSelectionModal;
