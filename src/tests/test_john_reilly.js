const fs = require('fs');
const path = require('path');

// Import the data
const officersData = require('../database/officer.json');

// Mock the enhanced skillDataParser functions
const REPLACEMENT_PATTERNS = {
    'Dmg Buff': [
        {
            pattern: /(\+?\d+(?:\.\d+)?%?)/g,
            replacement: (newValue, groups) => (newValue.includes('%') ? newValue : `${newValue}%`),
        },
    ],
    'Dmg Reduction': [
        {
            pattern: /(\+?\d+(?:\.\d+)?%?)/g,
            replacement: (newValue, groups) => (newValue.includes('%') ? newValue : `${newValue}%`),
        },
    ],
};

/**
 * Escape special regex characters
 */
const escapeRegex = string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * Try contextual replacement when exact matches fail
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
 * Intelligently replaces values in skill text by finding numeric patterns
 */
const applyIntelligentUpgrade = (data, upgradeKey, newValue, baseValue, allValues = []) => {
    const cleanNewValue = newValue.replace(/[^\d.]/g, '');
    const cleanBaseValue = baseValue.replace(/[^\d.]/g, '');

    if (!cleanNewValue || !cleanBaseValue) return data;

    let result = data;
    let matched = false;

    console.log(`  🔍 Testing upgrade: "${upgradeKey}" from "${baseValue}" to "${newValue}"`);
    console.log(`  📝 Original text: "${data}"`);

    // Strategy 1: Try to match any value from the upgrade array (not just base value)
    // This handles cases where skill text shows current level instead of base level
    if (allValues && allValues.length > 0) {
        console.log(`  🔢 All available values: [${allValues.join(', ')}]`);
        for (const value of allValues) {
            const cleanValue = value.replace(/[^\d.]/g, '');
            if (!cleanValue) continue;

            // Try exact match with %
            const valueWithPercent = `${cleanValue}%`;
            if (data.includes(valueWithPercent)) {
                result = data.replace(valueWithPercent, newValue);
                matched = true;
                console.log(`  ✅ Strategy 1 (exact % match): "${result}"`);
                break;
            }

            // Try plus pattern
            const plusPattern = `+${cleanValue}%`;
            if (data.includes(plusPattern)) {
                const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                result = data.replace(plusPattern, replacement);
                matched = true;
                console.log(`  ✅ Strategy 1 (plus pattern): "${result}"`);
                break;
            }

            // Try standalone number with word boundaries
            const regex = new RegExp(`\\b${escapeRegex(cleanValue)}\\b(?!%)`, 'g');
            const matches = data.match(regex);
            if (matches && matches.length === 1) {
                result = data.replace(regex, cleanNewValue);
                matched = true;
                console.log(`  ✅ Strategy 1 (standalone number): "${result}"`);
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
            console.log(`  ✅ Strategy 2 (spaced numbers): "${result}"`);
        }
    }

    // Strategy 3: Original base value matching (only if not matched by upgrade array)
    if (!matched) {
        // Find exact base value with % symbol
        const baseValueWithPercent = `${cleanBaseValue}%`;
        if (data.includes(baseValueWithPercent)) {
            result = data.replace(baseValueWithPercent, newValue);
            matched = true;
            console.log(`  ✅ Strategy 3 (base % match): "${result}"`);
        }

        // Look for patterns like "+10%" and replace if they match base value
        else {
            const plusPattern = `+${cleanBaseValue}%`;
            if (data.includes(plusPattern)) {
                const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                result = data.replace(plusPattern, replacement);
                matched = true;
                console.log(`  ✅ Strategy 3 (base plus pattern): "${result}"`);
            }
        }
    }

    // Strategy 4: Intelligent contextual matching (only single percentage replacement)
    if (!matched) {
        const contextResult = tryContextualReplacement(data, upgradeKey, newValue, baseValue);
        if (contextResult !== data) {
            result = contextResult;
            matched = true;
            console.log(`  ✅ Strategy 4 (contextual): "${result}"`);
        }
    }

    if (!matched) {
        console.log(`  ❌ No strategy worked for this upgrade`);
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

        console.log(`  Testing upgrade key: "${key}"`);
        console.log(`  Values: [${values.join(', ')}]`);

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
            console.log(`  ✅ Used predefined pattern for ${key}`);
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
 * Parse upgrade data from skill data array
 */
const parseUpgradeData = dataArray => {
    const upgradeInfo = {};

    dataArray.forEach(item => {
        if (item.includes('UPGRADE PREVIEW:')) {
            const lines = item.split('<br />');
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine.includes('UPGRADE PREVIEW')) return;

                // Handle colon format: "Load Speed Buff: 4%/5%/6%/7%/10%"
                if (trimmedLine.includes(':') && trimmedLine.includes('/')) {
                    const [label, values] = trimmedLine.split(':');
                    if (values?.includes('/')) {
                        const valueArray = values
                            .trim()
                            .split('/')
                            .map(v => v.trim());
                        if (valueArray.length >= 5) {
                            upgradeInfo[label.trim()] = valueArray;
                        }
                    }
                }

                // Handle non-colon format: "Dmg Coefficient 550/650/800/950/1200"
                else if (trimmedLine.includes('/')) {
                    // Match multi-word labels: "Word Word numbers/numbers/numbers"
                    const match = trimmedLine.match(
                        /^([A-Za-z\s]+?)\s+(\d+(?:\.\d+)?(?:[%]?)\/.*)/
                    );
                    if (match) {
                        const valueArray = match[2].split('/').map(v => v.trim());
                        if (valueArray.length >= 5) {
                            upgradeInfo[match[1].trim()] = valueArray;
                        }
                    } else {
                        // Fallback for single-word labels
                        const firstSpaceIndex = trimmedLine.indexOf(' ');
                        if (firstSpaceIndex > 0) {
                            const label = trimmedLine.substring(0, firstSpaceIndex);
                            const remainingText = trimmedLine.substring(firstSpaceIndex + 1);

                            if (remainingText.includes('/')) {
                                const valueArray = remainingText.split('/').map(v => v.trim());
                                if (valueArray.length >= 5) {
                                    upgradeInfo[label] = valueArray;
                                }
                            }
                        }
                    }
                }
            });
        }
    });

    return upgradeInfo;
};

// Test John Reilly specifically
const testJohnReilly = () => {
    console.log('🎖️  DETAILED TESTING: John Reilly (Vortex)');
    console.log('=' * 60);

    const johnReilly = officersData.find(officer => officer.name === 'John Reilly');

    if (!johnReilly) {
        console.log('❌ John Reilly not found in officers data!');
        return;
    }

    console.log(`👤 Officer: ${johnReilly.name} (${johnReilly.nickname})`);
    console.log(`📍 Found ${johnReilly.jn.length} skills\n`);

    johnReilly.jn.forEach((skill, index) => {
        console.log(`--- Testing John Reilly - Skill ${index}: ${skill.name} ---`);

        const upgradeData = parseUpgradeData(skill.data);

        if (Object.keys(upgradeData).length === 0) {
            console.log('ℹ️  No upgrade data (static skill)');
        } else {
            console.log(`📊 Found upgrade data: ${JSON.stringify(upgradeData)}`);
            console.log(`📝 Base skill text: "${skill.data[0]}"`);

            Object.entries(upgradeData).forEach(([upgradeKey, values]) => {
                // Test level 3 upgrade (middle level)
                const testLevel = 3;
                const baseData = skill.data[0];
                const result = applyUpgradeValues(baseData, { [upgradeKey]: values }, testLevel);

                const success = result !== baseData;
                console.log(
                    `  ${success ? '✅ SUCCESS' : '❌ FAILED'}: Text was ${success ? 'modified' : 'unchanged'}`
                );

                if (!success) {
                    console.log(`  🔍 Debug info:`);
                    console.log(`    - Upgrade Key: "${upgradeKey}"`);
                    console.log(`    - Base Value: "${values[0]}"`);
                    console.log(`    - Target Value: "${values[testLevel - 1]}"`);
                    console.log(`    - Skill Text: "${baseData}"`);
                }
            });
        }
        console.log();
    });
};

// Run the test
testJohnReilly();
