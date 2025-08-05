// Local storage utilities with error handling

const STORAGE_KEYS = {
    OFFICER_ASSIGNMENTS: 'unitOfficerAssignments',
    UNIT_BUILDS: 'unitBuilds',
};

/**
 * Safely parse JSON with fallback
 */
const safeJSONParse = (data, fallback = null) => {
    try {
        return JSON.parse(data);
    } catch (error) {
        console.warn('Failed to parse JSON:', error);
        return fallback;
    }
};

/**
 * Safely stringify JSON
 */
const safeJSONStringify = data => {
    try {
        return JSON.stringify(data);
    } catch (error) {
        console.error('Failed to stringify JSON:', error);
        throw new Error('Data serialization failed');
    }
};

/**
 * Save officer assignments for a unit
 */
export const saveOfficerAssignments = updatedUnit => {
    try {
        const savedData = localStorage.getItem(STORAGE_KEYS.OFFICER_ASSIGNMENTS) || '{}';
        const assignments = safeJSONParse(savedData, {});

        assignments[updatedUnit.id] = updatedUnit.officers;
        localStorage.setItem(STORAGE_KEYS.OFFICER_ASSIGNMENTS, safeJSONStringify(assignments));
    } catch (error) {
        console.error('Error saving officer assignments:', error);
        throw new Error('Failed to save officer assignments');
    }
};

/**
 * Save unit build configuration
 */
export const saveBuild = (unit, selectedBaseUnit) => {
    try {
        const savedData = localStorage.getItem(STORAGE_KEYS.UNIT_BUILDS) || '[]';
        const builds = safeJSONParse(savedData, []);

        const buildId = unit.id || Date.now();
        const buildName =
            unit.buildName || `${selectedBaseUnit.units_name || selectedBaseUnit.units} Build`;

        // Merge unit configuration with base unit stats
        const updatedBuild = {
            ...selectedBaseUnit, // Include all base unit data (health, durability, firepower, etc.)
            ...unit, // Override with unit configuration (captain, aide, buildName, etc.)
            id: buildId,
            buildName,
            baseUnitId: selectedBaseUnit.id,
            lastModified: Date.now(),
        };

        const existingBuildIndex = builds.findIndex(b => b.id === buildId);
        if (existingBuildIndex !== -1) {
            builds[existingBuildIndex] = updatedBuild;
        } else {
            builds.push(updatedBuild);
        }

        localStorage.setItem(STORAGE_KEYS.UNIT_BUILDS, safeJSONStringify(builds));
        return buildId;
    } catch (error) {
        console.error('Error saving build:', error);
        throw new Error('Failed to save build');
    }
};
