
import React, { useState } from 'react';
import SkillCard from './SkillCard';
import { createDefaultSkillLevels, isRevivalSkillAvailable, SKILL_CONFIG } from '../utils/skillConfig';

export const AssignedOfficerCard = ({ officer, onRemove }) => {
    const [skillLevels, setSkillLevels] = useState(createDefaultSkillLevels());

    const updateSkillLevel = (skillIndex, newLevel) => {
        setSkillLevels(prev => ({ ...prev, [skillIndex]: newLevel }));
    };

    if (!officer) return null;

    return (
        <div className="assigned-officer-card">
            <div className="officer-main-content">
                {/* Officer Header Section */}
                <div className="officer-header-section">
                    <img
                        src={`https://www.afuns.cc/img/warpath/db/officers/${officer.avatar_b}`}
                        onError={e => {
                            if (officer.avatar && e.target.src !== `https://www.afuns.cc/img/warpath/db/officers/${officer.avatar}`) {
                                e.target.src = `https://www.afuns.cc/img/warpath/db/officers/${officer.avatar}`;
                            }
                        }}
                        alt={officer?.nickname}
                        className="officer-avatar"
                    />
                    <div className="officer-details">
                        <div className="officer-header">
                            <h4 className="officer-name">{officer.nickname}</h4>
                            <button onClick={onRemove} className="remove-button">Remove</button>
                        </div>
                        <div className="officer-info">
                            <div><strong>Army:</strong> {officer.army}</div>
                            <div><strong>Characters:</strong> {officer.character.map(c => c.name).join(', ')}</div>
                        </div>
                    </div>
                </div>

                {/* Skills Section */}
                {officer.jn?.length > 0 && (
                    <div className="officer-skills-section">
                        <div className="skills-header">Skills</div>
                        <div className="skills-list">
                            {officer.jn.map((skill, index) => (
                                <SkillCard
                                    key={`${officer.name}-skill-${index}-${skillLevels[index]}`}
                                    skill={skill}
                                    index={index}
                                    skillLevel={skillLevels[index]}
                                    onLevelChange={(newLevel) => updateSkillLevel(index, newLevel)}
                                    isRevivalAvailable={index === SKILL_CONFIG.REVIVAL_SKILL_INDEX ? isRevivalSkillAvailable(skillLevels) : true}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const AvailableOfficerCard = ({ officer, onClick }) => {
    if (!officer) {
        return null;
    }

    return (
        <div onClick={onClick} className="available-officer-card">
            {officer.avatar && (
                <img
                    src={`https://www.afuns.cc/img/warpath/db/officers/${officer.avatar}`}
                    alt={officer.nickname}
                    className="officer-avatar"
                />
            )}
            <div className="officer-name">{officer.nickname}</div>
            <div className="officer-character">
                {officer.character.map(c => c.name).join(', ')}
            </div>
        </div>
    );
};
