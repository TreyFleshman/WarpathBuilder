import React from 'react';
import { OFFICER_IMAGE_BASE_URL } from '../utils/constants';

const PassiveSkillCard = ({ skill, onSkillHover, onSkillLeave, skillMatchesFilter }) => {
    return (
        <div
            className={`passive-skill-card ${skillMatchesFilter(skill) ? 'skill-matched' : ''}`}
        >
            <div className="skill-header">
                <div className="skill-icon-container">
                    {skill.img ? (
                        <img
                            src={`${OFFICER_IMAGE_BASE_URL}${skill.img}`}
                            alt={skill.name}
                            className="skill-image"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'inline';
                            }}
                        />
                    ) : null}
                    <span className="skill-icon-fallback" style={{ display: skill.img ? 'none' : 'inline' }}>
                        🛡️
                    </span>
                </div>
                <div className="skill-info">
                    <h3
                        className="skill-name"
                        onMouseEnter={(e) => onSkillHover(skill, e)}
                        onMouseLeave={onSkillLeave}
                    >
                        {skill.name}
                    </h3>
                    {skill.tag && (
                        <div className="skill-tag" data-tag={skill.tag}>{skill.tag}</div>
                    )}
                    {skillMatchesFilter(skill) && (
                        <span className="skill-match-indicator">✓ Matched</span>
                    )}
                </div>
            </div>

            <div className="skill-description">
                {skill.description && (
                    <p>{skill.description}</p>
                )}
                {skill.data && skill.data.length > 0 && (
                    <div
                        className="skill-details"
                        dangerouslySetInnerHTML={{
                            __html: skill.data[0]?.replace(/<br\s*\/?>/gi, '<br>') || ''
                        }}
                    />
                )}
            </div>

            <div className="skill-officer-info">
                <div className="officer-avatar-small">
                    {skill.officerAvatar ? (
                        <img
                            src={`${OFFICER_IMAGE_BASE_URL}${skill.officerAvatar}`}
                            onError={e => {
                                if (skill.officerAvatarB && e.target.src !== `${OFFICER_IMAGE_BASE_URL}${skill.officerAvatarB}`) {
                                    e.target.src = `${OFFICER_IMAGE_BASE_URL}${skill.officerAvatarB}`;
                                }
                            }}
                            alt={skill.officerName}
                            className="officer-avatar-image"
                        />
                    ) : (
                        <div className="officer-avatar-placeholder">👨‍💼</div>
                    )}
                </div>
                <div className="officer-details">
                    <div className="officer-name">{skill.officerName}</div>
                    <div className="officer-force-type">{skill.officerForceType}</div>
                </div>
            </div>
        </div>
    );
};

export default PassiveSkillCard;
