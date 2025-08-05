import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div className="home-page">
            <div className="home-container">
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-content">
                        <div className="hero-icon">⚔️</div>
                        <h1 className="hero-title">Warpath Command Center</h1>
                        <p className="hero-subtitle">
                            Strategic warfare planning and formation management
                        </p>
                        <p className="hero-description">
                            Build powerful military formations, configure officer skills, and
                            optimize your tactical advantage on the battlefield.
                        </p>
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="quick-actions">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="actions-grid">
                        <Link to="/builds/new" className="action-card primary">
                            <div className="action-icon">🏗️</div>
                            <h3>Create Formation</h3>
                            <p>Build a new military formation from scratch</p>
                        </Link>

                        <Link to="/builds" className="action-card">
                            <div className="action-icon">📋</div>
                            <h3>My Formations</h3>
                            <p>View and manage your saved formations</p>
                        </Link>
                    </div>
                </section>

                {/* Navigation Cards */}
                <section className="navigation-section">
                    <h2 className="section-title">Explore Database</h2>
                    <div className="nav-grid">
                        <Link to="/units" className="nav-card">
                            <div className="nav-icon">🪖</div>
                            <h3>Units</h3>
                            <p>Browse all military units and their specifications</p>
                            <div className="nav-arrow">→</div>
                        </Link>

                        <Link to="/officers" className="nav-card">
                            <div className="nav-icon">👨‍💼</div>
                            <h3>Officers</h3>
                            <p>Explore officers, their skills and specializations</p>
                            <div className="nav-arrow">→</div>
                        </Link>

                        <Link to="/passive-skills" className="nav-card">
                            <div className="nav-icon">🛡️</div>
                            <h3>Passive Skills</h3>
                            <p>Discover passive abilities and tactical bonuses</p>
                            <div className="nav-arrow">→</div>
                        </Link>
                    </div>
                </section>

                {/* Features Section */}
                <section className="features-section">
                    <h2 className="section-title">Platform Features</h2>
                    <div className="features-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🎯</div>
                            <h4>Strategic Planning</h4>
                            <p>
                                Create optimized unit compositions for different battlefield
                                scenarios
                            </p>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon">⚡</div>
                            <h4>Officer Skills</h4>
                            <p>
                                Configure officer skill levels and track their combat effectiveness
                            </p>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon">🔄</div>
                            <h4>Formation Management</h4>
                            <p>
                                Save, edit, and share your military formations with other commanders
                            </p>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon">📊</div>
                            <h4>Comprehensive Database</h4>
                            <p>
                                Access detailed information about units, officers, and passive
                                abilities
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default HomePage;
