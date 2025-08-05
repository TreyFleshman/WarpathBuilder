import React, { useState, useEffect } from 'react';
import { renderStars } from '../utils/gradeUtils';

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
                        <button onClick={onClose} className="close-button">
                            ×
                        </button>
                    </div>

                    {/* Unit Type Selection */}
                    <div className="type-filters">
                        {Object.entries(unitsByType)
                            .filter(([, units]) =>
                                units.some(unit => unit.camps.toUpperCase() === selectedCamp)
                            )
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
                        {unitsByType[selectedType]
                            ?.filter(unit => unit.camps.toUpperCase() === selectedCamp)
                            .sort((a, b) => b.grades + a.grades)
                            .map(unit => (
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
                                        <div className="unit-detail">
                                            Grade:{' '}
                                            {unit.grades >= 4
                                                ? renderStars(unit.grades)
                                                : unit.grades}
                                        </div>
                                        <div className="unit-detail">
                                            FP: {unit.firepower.toLocaleString()}
                                        </div>
                                        <div className="unit-detail">
                                            Health:{' '}
                                            {unit.health && unit.health !== ''
                                                ? unit.health.toLocaleString()
                                                : unit.durability && unit.durability !== ''
                                                  ? unit.durability.toLocaleString()
                                                  : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="selection-summary">
                        <div className="summary-item">
                            <span style={{ color: '#c0c0c0' }}>★★★★★</span> = Grade 4-5 (Silver
                            stars)
                        </div>
                        <div className="summary-item">
                            <span style={{ color: '#ffd700' }}>★</span> = Grade 6,{' '}
                            <span style={{ color: '#ffd700' }}>★★</span> = Grade 7 (Gold stars)
                        </div>
                        <div className="summary-item">
                            <span style={{ color: '#4682b4' }}>★</span> = Grade 8,{' '}
                            <span style={{ color: '#4682b4' }}>★★</span> = Grade 9+ (Blue stars)
                        </div>
                        <div className="summary-item">
                            <span style={{ color: '#ffd700' }}>★{'>'}</span> = .1 grade,{' '}
                            <span style={{ color: '#ffd700' }}>★{'>>'}</span> = .2 grade
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
