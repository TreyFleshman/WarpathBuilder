import React, { useState } from 'react';
import SkillCard from './SkillCard';
import {
    createDefaultSkillLevels,
    isRevivalSkillAvailable,
    SKILL_CONFIG,
} from '../utils/constants';

const OfficerSelectionModalEnhanced = ({
    isOpen,
    onClose,
    onOfficerSelect,
    availableOfficers,
    slotType,
}) => {
    const [selectedOfficer, setSelectedOfficer] = useState(null);
    const [skillLevels, setSkillLevels] = useState(createDefaultSkillLevels());
    const [step, setStep] = useState('select'); // 'select' or 'configure'

    if (!isOpen) return null;

    const handleOfficerClick = officer => {
        setSelectedOfficer(officer);
        setSkillLevels(createDefaultSkillLevels());
        setStep('configure');
    };

    const handleBack = () => {
        setStep('select');
        setSelectedOfficer(null);
    };

    const handleConfirmAssignment = () => {
        if (selectedOfficer) {
            onOfficerSelect(selectedOfficer.id, skillLevels);
            handleClose();
        }
    };

    const handleClose = () => {
        setStep('select');
        setSelectedOfficer(null);
        setSkillLevels(createDefaultSkillLevels());
        onClose();
    };

    const updateSkillLevel = (skillIndex, newLevel) => {
        setSkillLevels(prev => ({ ...prev, [skillIndex]: newLevel }));
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal-box officer-selection-modal enhanced"
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>
                            {step === 'select'
                                ? `Select ${slotType}`
                                : `Configure ${selectedOfficer?.nickname} Skills`}
                        </h2>
                        <button onClick={handleClose} className="close-button">
                            ×
                        </button>
                    </div>

                    {step === 'select' ? (
                        <div className="officers-grid">
                            {availableOfficers.map(officer => (
                                <div
                                    key={officer.id}
                                    onClick={() => handleOfficerClick(officer)}
                                    className="officer-card selectable"
                                >
                                    <img
                                        src={`https://www.afuns.cc/img/warpath/db/officers/${officer.avatar}`}
                                        onError={e => {
                                            if (officer.avatar_b) {
                                                e.target.src = `https://www.afuns.cc/img/warpath/db/officers/${officer.avatar_b}`;
                                            }
                                        }}
                                        alt={officer.nickname}
                                        className="officer-avatar"
                                    />
                                    <div className="officer-info">
                                        <div className="officer-name">{officer.nickname}</div>
                                        <div className="officer-character">
                                            {officer.character.map(c => c.name).join(', ')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="skill-configuration">
                            <div className="officer-summary">
                                <img
                                    src={`https://www.afuns.cc/img/warpath/db/officers/${selectedOfficer.avatar}`}
                                    onError={e => {
                                        if (selectedOfficer.avatar_b) {
                                            e.target.src = `https://www.afuns.cc/img/warpath/db/officers/${selectedOfficer.avatar_b}`;
                                        }
                                    }}
                                    alt={selectedOfficer.nickname}
                                    className="officer-avatar-large"
                                />
                                <div className="officer-details">
                                    <h3>{selectedOfficer.nickname}</h3>
                                    <p>
                                        <strong>Army:</strong> {selectedOfficer.army}
                                    </p>
                                    <p>
                                        <strong>Characters:</strong>{' '}
                                        {selectedOfficer.character.map(c => c.name).join(', ')}
                                    </p>
                                </div>
                            </div>

                            {selectedOfficer.jn?.length > 0 && (
                                <div className="skills-configuration">
                                    <div className="skills-header">
                                        <h4>Configure Skills</h4>
                                        <p>Set the skill levels for this officer:</p>
                                    </div>
                                    <div className="skills-list">
                                        {selectedOfficer.jn.map((skill, index) => (
                                            <SkillCard
                                                key={`config-skill-${index}-${skillLevels[index]}`}
                                                skill={skill}
                                                index={index}
                                                skillLevel={skillLevels[index]}
                                                onLevelChange={newLevel =>
                                                    updateSkillLevel(index, newLevel)
                                                }
                                                isRevivalAvailable={
                                                    index === SKILL_CONFIG.REVIVAL_SKILL_INDEX
                                                        ? isRevivalSkillAvailable(skillLevels)
                                                        : true
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button onClick={handleBack} className="btn-secondary">
                                    ← Back to Officers
                                </button>
                                <button onClick={handleConfirmAssignment} className="btn-primary">
                                    Assign Officer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfficerSelectionModalEnhanced;
