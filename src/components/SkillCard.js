import React, { useMemo } from 'react';
import { parseUpgradeData, applyUpgradeValues } from '../utils/skillDataParser';
import { SKILL_CONFIG, SKILL_ICONS, SKILL_MESSAGES } from '../utils/skillConfig';

const SkillCard = ({ skill, index, skillLevel = 1, onLevelChange, isRevivalAvailable = true }) => {
    // Memoize upgrade data parsing for performance - must be before early return
    const upgradeData = useMemo(() => {
        return skill ? parseUpgradeData(skill.data) : {};
    }, [skill]);

    // Get current level data with applied upgrade values - must be before early return
    const getCurrentLevelData = useMemo(() => {
        if (!skill || !skill.data[0]) return '';
        const result = applyUpgradeValues(skill.data[0], upgradeData, skillLevel);

        // Debug logging to see what's happening
        if (skill.name === "Lions Led By Lions" || skill.name === "Wall of Steel") {
            console.log(`🔍 ${skill.name} Level ${skillLevel}:`);
            console.log(`   Base: "${skill.data[0]}"`);
            console.log(`   Result: "${result}"`);
            console.log(`   Upgrade Data:`, upgradeData);
        }

        return result;
    }, [skill, upgradeData, skillLevel]);

    if (!skill) return null;

    const isRevivalSkill = index === SKILL_CONFIG.REVIVAL_SKILL_INDEX;
    const isSkillLocked = isRevivalSkill && !isRevivalAvailable;

    // Process skill data based on skill type and state
    const processSkillData = () => {
        if (isRevivalSkill) {
            const filterKey = isSkillLocked ? SKILL_MESSAGES.REVIVAL_LOCKED : SKILL_MESSAGES.REVIVAL_UNLOCKED;
            const replacementIcon = isSkillLocked ? SKILL_ICONS.LOCKED : SKILL_ICONS.AWAKENED;
            const replacementText = isSkillLocked ? 'LOCKED:' : 'AWAKENED:';

            return skill.data
                .filter(dataItem => dataItem.includes(filterKey))
                .map(dataItem => dataItem.replace(filterKey, `${replacementIcon} ${replacementText}`));
        }

        return [getCurrentLevelData];
    };

    const skillData = processSkillData();

    const handleLevelChange = (delta) => {
        const newLevel = Math.max(
            SKILL_CONFIG.MIN_LEVEL,
            Math.min(SKILL_CONFIG.MAX_LEVEL, skillLevel + delta)
        );
        onLevelChange?.(newLevel);
    };

    const renderLevelControls = () => {
        if (isRevivalSkill) {
            return (
                <div className="skill-level">
                    {isSkillLocked ? (
                        <span className="locked-status">
                            {SKILL_ICONS.LOCKED} {SKILL_MESSAGES.LOCKED}
                        </span>
                    ) : (
                        <span>Level {SKILL_CONFIG.MAX_LEVEL} ({SKILL_MESSAGES.AWAKENED})</span>
                    )}
                </div>
            );
        }

        return (
            <div className="level-selector">
                <button
                    className="level-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleLevelChange(-1);
                    }}
                    disabled={skillLevel <= SKILL_CONFIG.MIN_LEVEL}
                >
                    −
                </button>
                <span className="level-display">Level {skillLevel}</span>
                <button
                    className="level-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleLevelChange(1);
                    }}
                    disabled={skillLevel >= SKILL_CONFIG.MAX_LEVEL}
                >
                    +
                </button>
            </div>
        );
    };

    return (
        <div className={`skill-card ${isRevivalSkill ? 'revival-skill' : ''} ${isSkillLocked ? 'locked' : ''}`}>
            {/* Skill Header */}
            <div className="skill-header">
                <div className="skill-info">
                    {skill.img && (
                        <div className="skill-icon">
                            <img
                                src={`https://www.afuns.cc/img/warpath/db/officers/${skill.img}`}
                                alt={skill.name}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    )}
                    <div className="skill-details">
                        <h4 className="skill-name">
                            {skill.name}
                            {isRevivalSkill && <span className="revival-badge">Revival</span>}
                        </h4>
                        <div className="skill-level-controls">
                            {renderLevelControls()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Skill Content - Always Visible */}
            <div className="skill-content">
                <div className="skill-description">
                    {skillData.map((dataItem, dataIndex) => (
                        <div
                            key={dataIndex}
                            className="skill-data-item primary"
                            dangerouslySetInnerHTML={{
                                __html: dataItem
                                    .replace(/\n/g, '<br/>')
                                    .replace(/(\d+\.?\d*%)/g, '<span class="stat-highlight">$1</span>')
                                    .replace(/(\+\d+)/g, '<span class="bonus-highlight">$1</span>')
                                    .replace(/(AWAKENED:|UNLOCKED:|LOCKED:)/g, '<strong class="status-highlight">$1</strong>')
                                    .replace(/(Dmg Coefficient|Load Speed Buff|Prep Time)/g, '<strong>$1</strong>')
                            }}
                        />
                    ))}
                </div>

                {isRevivalSkill && (
                    <div className="revival-note">
                        <span className="revival-icon">{SKILL_ICONS.REVIVAL}</span>
                        This is a special Revival Booster skill that enhances unit capabilities when awakened.
                    </div>
                )}
            </div>

            {/* Skill Tags/Categories */}
            {skill.category && (
                <div className="skill-tags">
                    <span className="skill-tag">{skill.category}</span>
                    {skill.type && <span className="skill-tag secondary">{skill.type}</span>}
                </div>
            )}
        </div>
    );
};

export default SkillCard;
