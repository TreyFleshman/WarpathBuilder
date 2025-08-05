import React, { useState, useMemo } from 'react';
import unitsData from '../database/units.json';
import UnitCard from '../components/UnitCard';
import { renderStars } from '../utils/gradeUtils';
import '../styles/EnhancedUnitCard.scss';
import '../styles/UnitsGrid.scss';

const UnitsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUnitType, setSelectedUnitType] = useState('all');
    const [selectedCamp, setSelectedCamp] = useState('all');
    const [selectedService, setSelectedService] = useState('all');
    const [selectedGrade, setSelectedGrade] = useState('all');
    const [selectedUnit, setSelectedUnit] = useState(null);

    // Define unit types with their icons and mappings
    const unitTypeFilters = [
        {
            id: 'all',
            name: 'All Types',
            icon: '🏆',
            matches: [],
            services: ['all'], // Always visible
        },
        {
            id: 'infantry',
            name: 'Infantry',
            icon: '🪖',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type01.jpg',
            matches: ['INFANTRY'],
            services: ['GROUND FORCES'], // Only visible for ground forces
        },
        {
            id: 'light_tanks',
            name: 'Light Tanks',
            icon: '🚙',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type07.jpg',
            matches: ['LIGHT TANK'],
            services: ['GROUND FORCES'],
        },
        {
            id: 'medium_tanks',
            name: 'Medium Tanks',
            icon: '🛡️',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type02.jpg',
            matches: ['MEDIUM TANKS'],
            services: ['GROUND FORCES'],
        },
        {
            id: 'heavy_tanks',
            name: 'Heavy Tanks',
            icon: '🏗️',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type03.jpg',
            matches: ['HEAVY TANK'],
            services: ['GROUND FORCES'],
        },
        {
            id: 'tank_destroyers',
            name: 'Tank Destroyers',
            icon: '🎯',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type04.jpg',
            matches: ['TANK DESTROYERS'],
            services: ['GROUND FORCES'],
        },
        {
            id: 'super_heavy_tanks',
            name: 'Super Heavy Tanks',
            icon: '⚔️',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type09.jpg',
            matches: ['SUPER\nHEAVY TANK', 'SUPER HEAVY TANK'],
            services: ['GROUND FORCES'],
        },
        {
            id: 'main_battle_tanks',
            name: 'Main Battle Tanks',
            icon: '🛡️',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type14.jpg',
            matches: ['MAIN BATTLE TANKS'],
            services: ['GROUND FORCES'],
        },
        {
            id: 'anti_tank_guns',
            name: 'Anti-Tank Guns',
            icon: '🎯',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type08.jpg',
            matches: ['ANTI-TANK GUNS'],
            services: ['GROUND FORCES'],
        },
        {
            id: 'artillery',
            name: 'Artillery',
            icon: '💥',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type05.jpg',
            matches: ['ARTILLERY', 'HOWITZERS'],
            services: ['GROUND FORCES'],
        },
        {
            id: 'rockets',
            name: 'Rocket Launchers',
            icon: '🚀',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type06.jpg',
            matches: ['ROCKET \nLAUNCHERS', 'ROCKET LAUNCHERS'],
            services: ['GROUND FORCES'],
        },
        {
            id: 'fighter_planes',
            name: 'Fighter Planes',
            icon: '✈️',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type10.jpg',
            matches: ['FIGHTER\nPLANES', 'FIGHTER PLANES'],
            services: ['AIRFORCE'], // Only visible for airforce
        },
        {
            id: 'bombers',
            name: 'Bombers',
            icon: '🛩️',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type11.jpg',
            matches: ['BOMBERS'],
            services: ['AIRFORCE'], // Only visible for airforce
        },
        {
            id: 'helicopters',
            name: 'Helicopters',
            icon: '🚁',
            imageUrl: 'http://www.afuns.cc/img/warpath/db/en/items/unit_type15.jpg',
            matches: ['HELICOPTERS', 'HELICOPTER'],
            services: ['GROUND FORCES'], // Visible for both services
        },
    ];

    // Filter unit types based on selected service
    const visibleUnitTypeFilters = useMemo(() => {
        if (selectedService === 'all') {
            return unitTypeFilters;
        }
        return unitTypeFilters.filter(
            filter => filter.services.includes('all') || filter.services.includes(selectedService)
        );
    }, [selectedService]);

    // Reset unit type selection if current selection is not visible
    React.useEffect(() => {
        if (selectedUnitType !== 'all') {
            const isCurrentSelectionVisible = visibleUnitTypeFilters.some(
                filter => filter.id === selectedUnitType
            );
            if (!isCurrentSelectionVisible) {
                setSelectedUnitType('all');
            }
        }
    }, [selectedService, selectedUnitType, visibleUnitTypeFilters]);

    // Debug: Log the filter order
    console.log(
        'Unit Type Filters Order:',
        unitTypeFilters.map(f => f.name)
    );

    // Process and organize units data
    const { processedUnits, camps, services, grades } = useMemo(() => {
        const processed = unitsData.map(unit => ({
            ...unit,
            normalizedType: (unit.units || 'Unknown')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toUpperCase(),
            normalizedService: (unit.services || 'Unknown').toUpperCase(),
            normalizedCamps: (unit.camps || '').toUpperCase(),
        }));

        const uniqueCamps = [
            ...new Set(
                processed.map(unit => unit.normalizedCamps).filter(camp => camp && camp !== '')
            ),
        ].sort();
        const uniqueServices = [...new Set(processed.map(unit => unit.normalizedService))]
            .filter(service => service && service !== 'UNKNOWN')
            .sort();
        const uniqueGrades = [
            ...new Set(processed.map(unit => unit.grades).filter(grade => grade != null)),
        ].sort((a, b) => a - b);

        return {
            processedUnits: processed,
            camps: uniqueCamps,
            services: uniqueServices,
            grades: uniqueGrades,
        };
    }, []);

    // Filter units
    const filteredUnits = useMemo(() => {
        let filtered = processedUnits.filter(unit => {
            const matchesSearch =
                unit.units_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                unit.units?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCamp = selectedCamp === 'all' || unit.normalizedCamps === selectedCamp;
            const matchesService =
                selectedService === 'all' || unit.normalizedService === selectedService;
            const matchesGrade =
                selectedGrade === 'all' || unit.grades === parseFloat(selectedGrade);

            // Visual unit type filter logic
            let matchesUnitType = true;
            if (selectedUnitType !== 'all') {
                const selectedFilter = unitTypeFilters.find(
                    filter => filter.id === selectedUnitType
                );
                if (selectedFilter && selectedFilter.matches.length > 0) {
                    matchesUnitType = selectedFilter.matches.some(
                        match => unit.normalizedType === match.toUpperCase()
                    );
                }
            }

            return (
                matchesSearch && matchesCamp && matchesService && matchesGrade && matchesUnitType
            );
        });

        return filtered;
    }, [
        processedUnits,
        searchTerm,
        selectedCamp,
        selectedService,
        selectedGrade,
        selectedUnitType,
    ]);

    const handleUnitClick = unit => {
        setSelectedUnit(unit);
    };

    const closeUnitModal = () => {
        setSelectedUnit(null);
    };

    return (
        <div className="units-page">
            <div className="page-container">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-top">
                        <h1 className="page-title">
                            <div className="title-icon">🪖</div>
                            Units Database
                        </h1>
                        <p className="page-subtitle">
                            Browse and explore all available military units
                        </p>
                    </div>

                    {/* Filters and Search */}
                    <div className="filters-section">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search units..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        {/* Visual Unit Type Filter */}
                        <div className="unit-type-filters">
                            <h3 className="filter-title">Filter by Unit Type</h3>
                            <div className="unit-type-grid">
                                {visibleUnitTypeFilters.map((filter, index) => (
                                    <div
                                        key={filter.id}
                                        className={`unit-type-item ${selectedUnitType === filter.id ? 'active' : ''}`}
                                        onClick={() => setSelectedUnitType(filter.id)}
                                    >
                                        <div className="unit-type-icon">
                                            {filter.imageUrl ? (
                                                <img
                                                    src={filter.imageUrl}
                                                    alt={filter.name}
                                                    className="unit-type-image"
                                                    onError={e => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display =
                                                            'block';
                                                    }}
                                                />
                                            ) : (
                                                <span className="unit-type-emoji">
                                                    {filter.icon}
                                                </span>
                                            )}
                                            <span
                                                className="unit-type-fallback"
                                                style={{ display: 'none' }}
                                            >
                                                {filter.icon}
                                            </span>
                                        </div>
                                        <span className="unit-type-text">{filter.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tabular Filters */}
                        <div className="tabular-filters">
                            <div className="filters-row">
                                {/* Service Filter */}
                                <div className="filter-tabs">
                                    <h4 className="filter-tabs-title">Service:</h4>
                                    <div className="tabs-container">
                                        <button
                                            className={`tab-button ${selectedService === 'all' ? 'active' : ''}`}
                                            onClick={() => setSelectedService('all')}
                                        >
                                            ALL SERVICES
                                        </button>
                                        {services.map(service => (
                                            <button
                                                key={service}
                                                className={`tab-button ${selectedService === service ? 'active' : ''}`}
                                                onClick={() => setSelectedService(service)}
                                            >
                                                {service}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Camp Filter */}
                                <div className="filter-tabs">
                                    <h4 className="filter-tabs-title">Camp:</h4>
                                    <div className="tabs-container">
                                        <button
                                            className={`tab-button ${selectedCamp === 'all' ? 'active' : ''}`}
                                            onClick={() => setSelectedCamp('all')}
                                        >
                                            ALL CAMPS
                                        </button>
                                        {camps.map(camp => (
                                            <button
                                                key={camp}
                                                className={`tab-button ${selectedCamp === camp ? 'active' : ''}`}
                                                onClick={() => setSelectedCamp(camp)}
                                            >
                                                {camp}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Grade Filter Dropdown */}
                            <div className="grade-filter">
                                <h4 className="filter-tabs-title">Grade:</h4>
                                <select
                                    value={selectedGrade}
                                    onChange={e => setSelectedGrade(e.target.value)}
                                    className="grade-select"
                                >
                                    <option value="all">All Grades</option>
                                    {grades.map(grade => (
                                        <option key={grade} value={grade}>
                                            Grade {grade}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="results-info">
                        <span className="results-count">{filteredUnits.length} units found</span>
                    </div>
                </div>

                {/* Units Grid */}
                <div className="units-grid">
                    {filteredUnits.map((unit, index) => (
                        <UnitCard
                            key={`${unit.id}-${index}`}
                            unit={unit}
                            onClick={() => handleUnitClick(unit)}
                        />
                    ))}
                </div>

                {/* Unit Detail Modal */}
                {selectedUnit && (
                    <div className="modal-overlay" onClick={closeUnitModal}>
                        <div className="unit-detail-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedUnit.units_name || selectedUnit.units}</h2>
                                <button onClick={closeUnitModal} className="close-btn">
                                    ✕
                                </button>
                            </div>
                            <div className="modal-content">
                                <div className="unit-detail-grid">
                                    <div className="unit-image-section">
                                        {selectedUnit.img && (
                                            <img
                                                src={`https://www.afuns.cc/img/warpath/db/units/${selectedUnit.img}`}
                                                alt={selectedUnit.units_name || selectedUnit.units}
                                                className="unit-detail-image"
                                            />
                                        )}
                                        <div className="unit-grade-large">
                                            <div className="grade-badge large">
                                                Grade{' '}
                                                {selectedUnit.grades >= 4
                                                    ? renderStars(selectedUnit.grades)
                                                    : selectedUnit.grades}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="unit-details-section">
                                        <div className="detail-row">
                                            <span className="detail-label">Type:</span>
                                            <span className="detail-value">
                                                {selectedUnit.normalizedType}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Service:</span>
                                            <span className="detail-value">
                                                {selectedUnit.normalizedService}
                                            </span>
                                        </div>
                                        {selectedUnit.normalizedCamps && (
                                            <div className="detail-row">
                                                <span className="detail-label">Camps:</span>
                                                <span className="detail-value">
                                                    {selectedUnit.normalizedCamps}
                                                </span>
                                            </div>
                                        )}
                                        <div className="detail-row">
                                            <span className="detail-label">Firepower:</span>
                                            <span className="detail-value">
                                                {selectedUnit.firepower?.toLocaleString() || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Health:</span>
                                            <span className="detail-value">
                                                {(
                                                    selectedUnit.health || selectedUnit.durability
                                                )?.toLocaleString() || 'N/A'}
                                            </span>
                                        </div>
                                        {selectedUnit.speed && (
                                            <div className="detail-row">
                                                <span className="detail-label">Speed:</span>
                                                <span className="detail-value">
                                                    {selectedUnit.speed}
                                                </span>
                                            </div>
                                        )}
                                        {selectedUnit.range && (
                                            <div className="detail-row">
                                                <span className="detail-label">Range:</span>
                                                <span className="detail-value">
                                                    {selectedUnit.range}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnitsPage;
