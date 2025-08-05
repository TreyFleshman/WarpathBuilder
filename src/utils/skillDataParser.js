// Utility functions for parsing skill upgrade data

/**
 * Parses upgrade data from skill data array
 * @param {Array} dataArray - Array of skill data strings
 * @returns {Object} - Object with upgrade keys and their values
 */
export const parseUpgradeData = dataArray => {
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
 * Parses a single upgrade line
 * @param {string} line - Single line of upgrade data
 * @returns {Object|null} - Parsed data or null if no match
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
        // Match multi-word labels: "Word Word numbers/numbers/numbers"
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
 * Configuration for different replacement patterns
 */
const REPLACEMENT_PATTERNS = {
    'Dmg Coefficient': [
        {
            pattern: /\(Dmg Coefficient\s*\d+(?:\.\d+)?\)/gi,
            replacement: value => `(Dmg Coefficient ${value})`,
        },
        {
            pattern: /Dmg Coefficient\s*\d+(?:\.\d+)?/gi,
            replacement: value => `Dmg Coefficient ${value}`,
        },
    ],
    'Healing Coefficient': [
        {
            pattern: /\(Healing Coefficient\s*\d+(?:\.\d+)?\)/gi,
            replacement: value => `(Healing Coefficient ${value})`,
        },
        {
            pattern: /Healing Coefficient\s*\d+(?:\.\d+)?/gi,
            replacement: value => `Healing Coefficient ${value}`,
        },
    ],
    'Dmg Resist': [
        {
            pattern: /(Dmg Resist by\s*)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Blast Dmg Resist by\s*)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Tank Dmg Resist\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Dmg Resist\s*\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Additional Tank Dmg Resist\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
    ],
    'Load Speed': [
        {
            pattern: /(Load Speed\s+by\s+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Load Speed\s+Buff:\s*)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Load Speed)(\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}+${value}`,
        },
    ],
    'Attack Dmg': [
        {
            pattern: /(Attack Dmg of his Troop by\s*)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Attack Dmg by\s*)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Attack Dmg\s*\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
    ],
    Firepower: [
        {
            pattern:
                /(Firepower of all friendly Ground Forces within \d+ Map Grids by\s*)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Firepower by\s*)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Troop Firepower\s*\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Firepower\s*\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Artillery Firepower\s*\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Infantry Firepower\s*\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
    ],
    Durability: [
        {
            pattern: /(Tank Durability by\s*)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Durability\s*\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
    ],
    'Kill Radius': [
        {
            pattern: /(Artillery Kill Radius\s*\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
        {
            pattern: /(Kill Radius\s*\+)(\d+(?:\.\d+)?%?)/gi,
            replacement: (value, match) => `${match[1]}${value}`,
        },
    ],
};

/**
 * Applies upgrade values to skill data text using intelligent pattern matching
 * @param {string} data - Original skill data text
 * @param {Object} upgradeInfo - Parsed upgrade information
 * @param {number} level - Selected skill level (1-5)
 * @returns {string} - Updated skill data text
 */
export const applyUpgradeValues = (data, upgradeInfo, level) => {
    let currentData = data;

    Object.entries(upgradeInfo).forEach(([key, values]) => {
        const currentValue = values[level - 1];
        if (!currentValue) return;

        // Strategy 1: Use predefined replacement patterns for known skill types
        const patternConfig = Object.entries(REPLACEMENT_PATTERNS).find(
            ([patternKey]) => key.includes(patternKey) || key === patternKey
        );

        if (patternConfig) {
            const [, patterns] = patternConfig;
            patterns.forEach(({ pattern, replacement }) => {
                currentData = currentData.replace(pattern, (match, ...groups) => {
                    return replacement(currentValue, [match, ...groups]);
                });
            });
        } else {
            // Strategy 2: Intelligent auto-detection for unknown patterns
            currentData = applyIntelligentUpgrade(
                currentData,
                key,
                currentValue,
                values[0],
                values
            );
        }
    });

    return currentData;
};

/**
 * Intelligently replaces values in skill text by finding numeric patterns
 * @param {string} data - Skill text
 * @param {string} upgradeKey - The upgrade key (e.g., "Dmg Buff")
 * @param {string} newValue - The new value to use
 * @param {string} baseValue - The base value (level 1)
 * @returns {string} - Updated skill text
 */
const applyIntelligentUpgrade = (data, upgradeKey, newValue, baseValue, allValues = []) => {
    const cleanNewValue = newValue.replace(/[^\d.]/g, '');
    const cleanBaseValue = baseValue.replace(/[^\d.]/g, '');

    if (!cleanNewValue || !cleanBaseValue) return data;

    let result = data;
    let matched = false;

    // Strategy 1: Try to match any value from the upgrade array (not just base value)
    // This handles cases where skill text shows current level instead of base level
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

            // Try standalone number with word boundaries
            const regex = new RegExp(`\\b${escapeRegex(cleanValue)}\\b(?!%)`, 'g');
            const matches = data.match(regex);
            if (matches && matches.length === 1) {
                result = data.replace(regex, cleanNewValue);
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

    // Strategy 3: Original base value matching (only if not matched by upgrade array)
    if (!matched) {
        // Find exact base value with % symbol
        const baseValueWithPercent = `${cleanBaseValue}%`;
        if (data.includes(baseValueWithPercent)) {
            result = data.replace(baseValueWithPercent, newValue);
            matched = true;
        }

        // Look for patterns like "+10%" and replace if they match base value
        else {
            const plusPattern = `+${cleanBaseValue}%`;
            if (data.includes(plusPattern)) {
                const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                result = data.replace(plusPattern, replacement);
                matched = true;
            }
        }
    }

    // Strategy 4: Intelligent contextual matching (only single percentage replacement)
    if (!matched) {
        result = tryContextualReplacement(data, upgradeKey, newValue, baseValue);
        matched = result !== data;
    }

    return result;
};

/**
 * Tries to find the most appropriate number to replace based on context
 */
const tryContextualReplacement = (data, upgradeKey, newValue, baseValue) => {
    const cleanNewValue = newValue.replace(/[^\d.]/g, '');
    const cleanBaseValue = baseValue.replace(/[^\d.]/g, '');

    // Extract all numbers with % from the text
    const percentNumbers = data.match(/\d+(?:\.\d+)?%/g) || [];

    // Extract all standalone numbers
    const standaloneNumbers = data.match(/\b\d+(?:\.\d+)?\b/g) || [];

    // For percentage-based upgrades, prioritize % numbers
    if (newValue.includes('%')) {
        for (const percentNum of percentNumbers) {
            const numValue = percentNum.replace('%', '');
            // If this number is close to our base value, replace it
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
 * Checks if two numbers are close enough to be considered the same
 */
const isNumberClose = (num1, num2, tolerance = 0.1) => {
    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);
    if (isNaN(n1) || isNaN(n2)) return false;

    // Allow for small differences due to rounding or minor discrepancies
    return Math.abs(n1 - n2) <= tolerance;
};

/**
 * Escapes special regex characters
 */
const escapeRegex = string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
