/**
 * Shared test utilities for skill upgrade testing
 * Consolidates duplicated functions across test files
 */

/**
 * Parse upgrade data from officer skill data arrays
 */
const parseUpgradeData = dataArray => {
    const upgradeInfo = {};

    dataArray.forEach(item => {
        if (item.includes('UPGRADE PREVIEW:')) {
            const lines = item.split('<br />');
            lines.forEach(line => {
                const parsedData = parseUpgradeLine(line.trim());
                if (parsedData) {
                    upgradeInfo[parsedData.label] = parsedData.values;
                }
            });
        }
    });

    return upgradeInfo;
};

/**
 * Parse individual upgrade line
 */
const parseUpgradeLine = line => {
    if (!line || line.includes('UPGRADE PREVIEW')) return null;

    // Handle colon format: "Load Speed Buff: 4%/5%/6%/7%/10%"
    if (line.includes(':') && line.includes('/')) {
        const [label, values] = line.split(':');
        if (values?.includes('/')) {
            const valueArray = values
                .trim()
                .split('/')
                .map(v => v.trim());
            if (valueArray.length >= 5) {
                return {
                    label: label.trim(),
                    values: valueArray,
                };
            }
        }
    }

    // Handle non-colon format: "Dmg Coefficient 550/650/800/950/1200"
    if (line.includes('/')) {
        const match = line.match(/^([A-Za-z\s]+?)\s+(\d+(?:\.\d+)?(?:[%]?)\/.*)/);
        if (match) {
            const valueArray = match[2].split('/').map(v => v.trim());
            if (valueArray.length >= 5) {
                return {
                    label: match[1].trim(),
                    values: valueArray,
                };
            }
        }

        // Fallback for single-word labels
        const firstSpaceIndex = line.indexOf(' ');
        if (firstSpaceIndex > 0) {
            const label = line.substring(0, firstSpaceIndex);
            const remainingText = line.substring(firstSpaceIndex + 1);

            if (remainingText.includes('/')) {
                const valueArray = remainingText.split('/').map(v => v.trim());
                if (valueArray.length >= 5) {
                    return {
                        label,
                        values: valueArray,
                    };
                }
            }
        }
    }

    return null;
};

/**
 * Escape special regex characters
 */
const escapeRegex = string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Check if two numbers are close enough to be considered the same
 */
const isNumberClose = (num1, num2, tolerance = 0.1) => {
    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);
    if (isNaN(n1) || isNaN(n2)) return false;
    return Math.abs(n1 - n2) <= tolerance;
};

/**
 * Try contextual replacement when exact matches fail
 */
const tryContextualReplacement = (data, upgradeKey, newValue, baseValue) => {
    const cleanNewValue = newValue.replace(/[^\d.]/g, '');
    const cleanBaseValue = baseValue.replace(/[^\d.]/g, '');

    // Extract all numbers with % from the text
    const percentNumbers = data.match(/\d+(?:\.\d+)?%/g) || [];
    const standaloneNumbers = data.match(/\b\d+(?:\.\d+)?\b/g) || [];

    // For percentage-based upgrades, prioritize % numbers
    if (newValue.includes('%')) {
        for (const percentNum of percentNumbers) {
            const numValue = percentNum.replace('%', '');
            if (isNumberClose(numValue, cleanBaseValue)) {
                return data.replace(percentNum, newValue);
            }
        }
    }
    // For non-percentage upgrades, try standalone numbers
    else {
        for (const num of standaloneNumbers) {
            if (isNumberClose(num, cleanBaseValue)) {
                return data.replace(new RegExp(`\\b${escapeRegex(num)}\\b`, 'g'), cleanNewValue);
            }
        }
    }

    return data;
};

/**
 * Intelligently replace values in skill text by finding numeric patterns
 */
const applyIntelligentUpgrade = (data, upgradeKey, newValue, baseValue, allValues = []) => {
    const cleanNewValue = newValue.replace(/[^\d.]/g, '');
    const cleanBaseValue = baseValue.replace(/[^\d.]/g, '');

    if (!cleanNewValue || !cleanBaseValue) return data;

    let result = data;
    let matched = false;

    // Strategy 1: Try to match any value from the upgrade array
    if (allValues && allValues.length > 0) {
        for (const value of allValues) {
            const cleanValue = value.replace(/[^\d.]/g, '');
            if (!cleanValue) continue;

            // Try exact match with %
            const valueWithPercent = `${cleanValue}%`;
            if (data.includes(valueWithPercent)) {
                result = data.replace(valueWithPercent, newValue);
                matched = true;
                break;
            }

            // Try plus pattern
            const plusPattern = `+${cleanValue}%`;
            if (data.includes(plusPattern)) {
                const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                result = data.replace(plusPattern, replacement);
                matched = true;
                break;
            }
        }
    }

    // Strategy 2: Handle spaced numbers like "1 0%" -> "10%"
    if (!matched) {
        const spacedPattern = cleanBaseValue.split('').join('\\s+');
        const spacedRegex = new RegExp(`\\+?${spacedPattern}%`, 'g');
        if (spacedRegex.test(data)) {
            const replacement = newValue.includes('%') ? newValue : `${newValue}%`;
            result = data.replace(spacedRegex, replacement);
            matched = true;
        }
    }

    // Strategy 3: Original base value matching
    if (!matched) {
        const baseValueWithPercent = `${cleanBaseValue}%`;
        if (data.includes(baseValueWithPercent)) {
            result = data.replace(baseValueWithPercent, newValue);
            matched = true;
        } else {
            const plusPattern = `+${cleanBaseValue}%`;
            if (data.includes(plusPattern)) {
                const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                result = data.replace(plusPattern, replacement);
                matched = true;
            }
        }
    }

    // Strategy 4: Intelligent contextual matching
    if (!matched) {
        const contextResult = tryContextualReplacement(data, upgradeKey, newValue, baseValue);
        if (contextResult !== data) {
            result = contextResult;
            matched = true;
        }
    }

    return result;
};

/**
 * Apply upgrade values to skill data
 */
const applyUpgradeValues = (data, upgradeInfo, level) => {
    let currentData = data;

    Object.entries(upgradeInfo).forEach(([key, values]) => {
        const currentValue = values[level - 1];
        if (!currentValue) return;

        currentData = applyIntelligentUpgrade(currentData, key, currentValue, values[0], values);
    });

    return currentData;
};

module.exports = {
    parseUpgradeData,
    parseUpgradeLine,
    escapeRegex,
    isNumberClose,
    tryContextualReplacement,
    applyIntelligentUpgrade,
    applyUpgradeValues,
};
