import React from 'react';

const OfficerSelectionModal = ({
    isOpen,
    onClose,
    onOfficerSelect,
    availableOfficers,
    slotType,
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box officer-selection-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>Select {slotType}</h2>
                        <button onClick={onClose} className="close-button">
                            ×
                        </button>
                    </div>
                    <div className="officers-grid">
                        {availableOfficers.map(officer => (
                            <div
                                key={officer.id}
                                onClick={() => onOfficerSelect(officer.id)}
                                className="officer-card"
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
                </div>
            </div>
        </div>
    );
};

export default OfficerSelectionModal;
