import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
    const location = useLocation();

    const navItems = [
        {
            path: '/',
            icon: '🏠',
            label: 'Home',
            description: 'Dashboard',
        },
        {
            path: '/units',
            icon: '🪖',
            label: 'Units',
            description: 'Browse all units',
        },
        {
            path: '/officers',
            icon: '👨‍💼',
            label: 'Officers',
            description: 'Browse all officers',
        },
        {
            path: '/passive-skills',
            icon: '🛡️',
            label: 'Passive Skills',
            description: 'Browse passive skills',
        },
        {
            path: '/builds',
            icon: '📋',
            label: 'Formations',
            description: 'Manage builds',
        },
        {
            path: '/builds/new',
            icon: '🏗️',
            label: 'Create Build',
            description: 'New formation',
        },
    ];

    return (
        <nav className="main-navigation">
            <div className="nav-container">
                <Link to="/" className="nav-brand">
                    <div className="brand-icon">⚔️</div>
                    <div className="brand-text">
                        <div className="brand-title">Warpath</div>
                        <div className="brand-subtitle">Command Center</div>
                    </div>
                </Link>

                <div className="nav-menu">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <div className="nav-icon">{item.icon}</div>
                            <div className="nav-content">
                                <div className="nav-label">{item.label}</div>
                                <div className="nav-description">{item.description}</div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="nav-footer">
                    <div className="version-info">v1.0.0</div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
