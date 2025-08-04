import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import unitsData from '../database/units.json'; // Commented out as it's not currently used
import officersData from '../database/officer.json';

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

const UnitsListPage = () => {
    const [units, setUnits] = useState([]);
    const navigate = useNavigate();

    // Load saved unit builds
    useEffect(() => {
        try {
            const savedBuilds = localStorage.getItem('unitBuilds');
            if (savedBuilds) {
                setUnits(JSON.parse(savedBuilds));
            } else {
                setUnits([]);
            }
        } catch (error) {
            console.error('Error loading unit builds:', error);
            setUnits([]);
        }
    }, []);

    const handleSelectUnit = (unitId) => {
        navigate(`/unit/${unitId}`);
    };

    const handleDeleteBuild = (e, buildId) => {
        e.stopPropagation();
        try {
            const savedBuilds = localStorage.getItem('unitBuilds');
            const builds = savedBuilds ? JSON.parse(savedBuilds) : [];
            const updatedBuilds = builds.filter(b => b.id !== buildId);
            localStorage.setItem('unitBuilds', JSON.stringify(updatedBuilds));
            setUnits(updatedBuilds);
        } catch (error) {
            console.error('Error deleting build:', error);
        }
    };

    const handleCreateNew = () => {
        navigate('/builds/new');
    };

    const handleCreateFormation = () => {
        navigate('/builds');
    };

    return (
        <div className="units-list-page">
            <div className="page-header">
                <h2 className="header">Formation Builds</h2>
                <button onClick={handleCreateFormation} className="formation-btn">
                    Manage Formations
                </button>
            </div>
            <div className="units-grid">
                <div onClick={handleCreateNew} className="create-new-card">
                    <div className="icon">+</div>
                    <div className="text">Create New Formation</div>
                </div>
                {units.map((unit) => (
                    <div
                        key={unit.id}
                        onClick={() => handleSelectUnit(unit.id)}
                        className="build-card"
                    >
                        <div className="delete-btn-container">
                            <button
                                onClick={(e) => handleDeleteBuild(e, unit.id)}
                                className="delete-btn"
                            >
                                Delete
                            </button>
                        </div>
                        <h3 className="build-title">
                            {unit.buildName || unit.units_name || `Unit ${unit.id}`}
                        </h3>
                        <div className="build-info">
                            <div>Type: {unit.units}</div>
                            <div>Grade: {unit.grades >= 4 ? renderStars(unit.grades) : unit.grades}</div>
                            <div>Firepower: {unit.firepower ? unit.firepower.toLocaleString() : 'N/A'}</div>
                            <div>Health: {
                                unit.health && unit.health !== ""
                                    ? unit.health.toLocaleString()
                                    : unit.durability && unit.durability !== ""
                                        ? unit.durability.toLocaleString()
                                        : "N/A"
                            }</div>
                        </div>
                        <div className="officers-section">
                            <div className="officers-header">
                                <span>Officers ({unit.officers.length}/2)</span>
                                <span className={`status-badge ${unit.officers.length === 2 ? 'complete' : 'incomplete'}`}>
                                    {unit.officers.length === 2 ? 'Complete' : 'Needs Officers'}
                                </span>
                            </div>
                            {unit.officers.length > 0 ? (
                                <div className="officers-list">
                                    {unit.officers.map(officerId => {
                                        const officer = officersData.find(o => o.id === officerId);
                                        return officer ? (
                                            <div key={officerId} className="officer-card">
                                                <div className="officer-name">{officer.nickname}</div>
                                                <div className="officer-details">
                                                    {officer.character.map(c => c.name).join(', ')}
                                                </div>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            ) : (
                                <div className="officers-list">
                                    <div className="no-officers">No officers assigned</div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; export default UnitsListPage;
