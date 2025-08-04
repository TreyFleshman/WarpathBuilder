import React from 'react';
import { OFFICER_IMAGE_BASE_URL } from '../utils/constants';

const SkillHoverModal = ({ hoveredSkill, hoverPosition }) => {
    if (!hoveredSkill) return null;

    return (
        <div
            className="skill-hover-modal"
            style={{
                position: 'fixed',
                left: `${hoverPosition.x}px`,
                top: `${hoverPosition.y - 10}px`,
                transform: 'translateX(-50%) translateY(-100%)',
                zIndex: 999999,
                pointerEvents: 'none'
            }}
        >
            <div className="skill-hover-content">
                <div className="skill-hover-header">
                    <div className="skill-hover-icon">
                        {hoveredSkill.img ? (
                            <img
                                src={`${OFFICER_IMAGE_BASE_URL}${hoveredSkill.img}`}
                                alt={hoveredSkill.name}
                                className="skill-hover-image"
                            />
                        ) : (
                            <div className="skill-hover-fallback">🛡️</div>
                        )}
                    </div>
                    <div className="skill-hover-title">
                        <h4 className="skill-hover-name">{hoveredSkill.name}</h4>
                        {hoveredSkill.tag && (
                            <div className="skill-hover-tag">{hoveredSkill.tag}</div>
                        )}
                    </div>
                </div>

                {hoveredSkill.description && (
                    <div className="skill-hover-description">
                        {hoveredSkill.description}
                    </div>
                )}

                {hoveredSkill.data && hoveredSkill.data.length > 0 && (
                    <div className="skill-hover-details">
                        <div className="skill-hover-details-title">Details:</div>
                        <div
                            className="skill-hover-details-content"
                            dangerouslySetInnerHTML={{
                                __html: hoveredSkill.data[0]?.replace(/<br\s*\/?>/gi, '<br>') || ''
                            }}
                        />
                    </div>
                )}

                <div className="skill-hover-officer">
                    <div className="skill-hover-officer-title">From Officer:</div>
                    <div className="skill-hover-officer-name">{hoveredSkill.officerName}</div>
                </div>
            </div>
        </div>
    );
};

export default SkillHoverModal;
