import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BuildsListPage = () => {
    const navigate = useNavigate();
    const [builds, setBuilds] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadBuilds();
    }, []);

    const loadBuilds = () => {
        try {
            const savedBuilds = localStorage.getItem('formationBuilds');
            const formationBuilds = savedBuilds ? JSON.parse(savedBuilds) : [];

            // Sort by updated date, newest first
            const sortedBuilds = formationBuilds.sort(
                (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
            );

            setBuilds(sortedBuilds);
        } catch (err) {
            setError('Failed to load builds');
        }
    };

    const handleDeleteBuild = buildId => {
        try {
            const savedBuilds = localStorage.getItem('formationBuilds');
            const builds = savedBuilds ? JSON.parse(savedBuilds) : [];
            const filteredBuilds = builds.filter(b => b.id !== buildId);

            localStorage.setItem('formationBuilds', JSON.stringify(filteredBuilds));
            loadBuilds(); // Reload the list
        } catch (err) {
            setError('Failed to delete build');
        }
    };

    const handleDuplicateBuild = build => {
        try {
            const newBuild = {
                ...build,
                id: Date.now(),
                name: `${build.name} (Copy)`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const savedBuilds = localStorage.getItem('formationBuilds');
            const builds = savedBuilds ? JSON.parse(savedBuilds) : [];
            builds.push(newBuild);

            localStorage.setItem('formationBuilds', JSON.stringify(builds));
            loadBuilds(); // Reload the list
        } catch (err) {
            setError('Failed to duplicate build');
        }
    };

    const formatDate = dateString => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getBuildStats = build => {
        const groundCount = build.groundUnits.filter(u => u !== null).length;
        const airCount = build.airUnits.filter(u => u !== null).length;
        const officerCount = [...build.groundUnits, ...build.airUnits].reduce((count, unit) => {
            if (!unit) return count;
            return count + (unit.captain ? 1 : 0) + (unit.aide ? 1 : 0);
        }, 0);

        return { groundCount, airCount, officerCount };
    };

    return (
        <div className="builds-list-page">
            <div className="page-container">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-top">
                        <h1 className="page-title">
                            <div className="title-icon">📋</div>
                            Formation Builds
                        </h1>
                        <p className="page-subtitle">
                            Manage your military formations and unit configurations
                        </p>
                    </div>

                    <div className="action-buttons">
                        <button
                            onClick={() => navigate('/builds/new')}
                            className="btn create-button"
                        >
                            🏗️ Create New Formation
                        </button>
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}
                </div>

                {/* Builds Grid */}
                <div className="builds-content">
                    {builds.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🏗️</div>
                            <h2 className="empty-title">No Formations Yet</h2>
                            <p className="empty-description">
                                Create your first military formation with multiple units and
                                officers
                            </p>
                            <button
                                onClick={() => navigate('/builds/new')}
                                className="btn create-button"
                            >
                                Create First Formation
                            </button>
                        </div>
                    ) : (
                        <div className="builds-grid">
                            {builds.map(build => {
                                const stats = getBuildStats(build);
                                return (
                                    <div key={build.id} className="build-card">
                                        <div className="build-header">
                                            <h3 className="build-name">{build.name}</h3>
                                            <div className="build-actions">
                                                <button
                                                    onClick={() => navigate(`/builds/${build.id}`)}
                                                    className="action-btn edit-btn"
                                                    title="Edit Formation"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicateBuild(build)}
                                                    className="action-btn duplicate-btn"
                                                    title="Duplicate Formation"
                                                >
                                                    📋
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                'Are you sure you want to delete this formation?'
                                                            )
                                                        ) {
                                                            handleDeleteBuild(build.id);
                                                        }
                                                    }}
                                                    className="action-btn delete-btn"
                                                    title="Delete Formation"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        {build.description && (
                                            <p className="build-description">{build.description}</p>
                                        )}

                                        <div className="build-stats">
                                            <div className="stat-item">
                                                <span className="stat-icon">🌍</span>
                                                <span className="stat-label">Ground</span>
                                                <span className="stat-value">
                                                    {stats.groundCount}/5
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-icon">✈️</span>
                                                <span className="stat-label">Air</span>
                                                <span className="stat-value">
                                                    {stats.airCount}/3
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-icon">👨‍💼</span>
                                                <span className="stat-label">Officers</span>
                                                <span className="stat-value">
                                                    {stats.officerCount}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="build-preview">
                                            <div className="units-preview">
                                                <div className="ground-units-preview">
                                                    <h5>Ground Units</h5>
                                                    <div className="unit-icons">
                                                        {build.groundUnits.map((unit, index) => (
                                                            <div
                                                                key={index}
                                                                className={`unit-slot-preview ${unit ? 'filled' : 'empty'}`}
                                                            >
                                                                {unit ? (
                                                                    <img
                                                                        src={`https://www.afuns.cc/img/warpath/db/units/${unit.img}`}
                                                                        alt={
                                                                            unit.units_name ||
                                                                            unit.units
                                                                        }
                                                                        className="unit-icon-small"
                                                                        title={
                                                                            unit.units_name ||
                                                                            unit.units
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <div className="empty-slot">
                                                                        +
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="air-units-preview">
                                                    <h5>Air Units</h5>
                                                    <div className="unit-icons">
                                                        {build.airUnits.map((unit, index) => (
                                                            <div
                                                                key={index}
                                                                className={`unit-slot-preview ${unit ? 'filled' : 'empty'}`}
                                                            >
                                                                {unit ? (
                                                                    <img
                                                                        src={`https://www.afuns.cc/img/warpath/db/units/${unit.img}`}
                                                                        alt={
                                                                            unit.units_name ||
                                                                            unit.units
                                                                        }
                                                                        className="unit-icon-small"
                                                                        title={
                                                                            unit.units_name ||
                                                                            unit.units
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <div className="empty-slot">
                                                                        +
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="build-meta">
                                            <div className="meta-item">
                                                <span className="meta-label">Created:</span>
                                                <span className="meta-value">
                                                    {formatDate(build.createdAt)}
                                                </span>
                                            </div>
                                            {build.updatedAt !== build.createdAt && (
                                                <div className="meta-item">
                                                    <span className="meta-label">Updated:</span>
                                                    <span className="meta-value">
                                                        {formatDate(build.updatedAt)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuildsListPage;
