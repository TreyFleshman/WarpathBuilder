// Enhanced Unit Card Component
import React from 'react';
import GradeBadge from './GradeBadge';

const UnitCard = ({ unit, onClick }) => {
    return (
        <div className="unit-card enhanced" onClick={onClick}>
            <div
                className="unit-image-container enhanced"
                style={{
                    height: '200px',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1a252f, #2c3e50)'
                }}
            >
                <div className="image-wrapper" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unit.img && (
                        <img
                            src={`https://www.afuns.cc/img/warpath/db/units/${unit.img}`}
                            alt={unit.units_name || unit.units}
                            className="unit-image enhanced"
                            loading="lazy"
                            style={{
                                width: '75%',
                                height: '75%',
                                objectFit: 'contain',
                                objectPosition: 'center',
                                filter: 'brightness(1.05) contrast(1.05)',
                                imageRendering: 'crisp-edges',
                                imageRendering: '-webkit-optimize-contrast',
                                imageRendering: 'optimize-contrast',
                                msInterpolationMode: 'nearest-neighbor',
                                transform: 'translateZ(0)',
                                backfaceVisibility: 'hidden'
                            }}
                        />
                    )}
                    <div className="image-overlay"></div>
                </div>

                <div className="grade-badge-container" style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                    <GradeBadge grade={unit.grades} />
                </div>

                {/* Service indicator */}
                <div className="service-indicator" style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
                    {unit.normalizedService === 'AIRFORCE' ? '✈️' : '🪖'}
                </div>
            </div>

            <div className="unit-info enhanced">
                <h3 className="unit-name">{unit.units_name || unit.units}</h3>
                <div className="unit-type-badge">{unit.normalizedType}</div>

                <div className="unit-stats enhanced">
                    <div className="stat-item firepower">
                        <span className="stat-icon">🔥</span>
                        <span className="stat-label">Firepower</span>
                        <span className="stat-value">{unit.firepower?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="stat-item health">
                        <span className="stat-icon">❤️</span>
                        <span className="stat-label">Health</span>
                        <span className="stat-value">{(unit.health || unit.durability)?.toLocaleString() || 'N/A'}</span>
                    </div>
                </div>

                {unit.normalizedCamps && (
                    <div className="unit-camps-badge">{unit.normalizedCamps}</div>
                )}
            </div>
        </div>
    );
};

export default UnitCard;
