const fs = require('fs');
const path = require('path');

// Import the data
const officersData = require('../database/officer.json');

// Mock the REPLACEMENT_PATTERNS and functions from skillDataParser.js
const REPLACEMENT_PATTERNS = {
    "Dmg Buff": [
        {
            pattern: /(\+?\d+(?:\.\d+)?%?)/g,
            replacement: (newValue, groups) => newValue.includes('%') ? newValue : `${newValue}%`
        }
    ],
    "Dmg Reduction": [
        {
            pattern: /(\+?\d+(?:\.\d+)?%?)/g,
            replacement: (newValue, groups) => newValue.includes('%') ? newValue : `${newValue}%`
        }
    ]
};

/**
 * Escape special regex characters
 */
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Try contextual replacement when exact matches fail
 */
const tryContextualReplacement = (data, upgradeKey, newValue, baseValue) => {
    // Look for any percentage value in the text
    const percentagePattern = /(\+?\d+(?:\.\d+)?%)/g;
    const matches = data.match(percentagePattern);

    if (matches && matches.length === 1) {
        // If there's only one percentage, replace it
        return data.replace(percentagePattern, newValue.includes('%') ? newValue : `${newValue}%`);
    }

    // If multiple percentages, try to find the one closest to base value
    if (matches && matches.length > 1) {
        const cleanBaseValue = parseFloat(baseValue.replace(/[^\d.]/g, ''));
        let bestMatch = null;
        let smallestDiff = Infinity;

        matches.forEach(match => {
            const cleanMatch = parseFloat(match.replace(/[^\d.]/g, ''));
            const diff = Math.abs(cleanMatch - cleanBaseValue);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                bestMatch = match;
            }
        });

        if (bestMatch) {
            return data.replace(bestMatch, newValue.includes('%') ? newValue : `${newValue}%`);
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

    // Strategy 1: Try to match any value from the upgrade array (not just base value)
    // This handles cases where skill text shows current level instead of base level
    if (allValues && allValues.length > 0) {
        for (const value of allValues) {
            const cleanValue = value.replace(/[^\d.]/g, '');
            if (!cleanValue) continue;

            // Try exact match with %
            const valueWithPercent = `${cleanValue}%`;
            if (data.includes(valueWithPercent)) {
                result = data.replace(new RegExp(escapeRegex(valueWithPercent), 'g'), newValue);
                matched = true;
                break;
            }

            // Try plus pattern
            const plusPattern = `+${cleanValue}%`;
            if (data.includes(plusPattern)) {
                const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                result = data.replace(new RegExp(escapeRegex(plusPattern), 'g'), replacement);
                matched = true;
                break;
            }

            // Try standalone number
            const regex = new RegExp(`\\b${escapeRegex(cleanValue)}\\b`, 'g');
            if (regex.test(data)) {
                result = data.replace(regex, cleanNewValue);
                matched = true;
                break;
            }
        }
    }

    // Strategy 2: Original base value matching
    if (!matched) {
        // Find exact base value with % symbol
        const baseValueWithPercent = `${cleanBaseValue}%`;
        if (data.includes(baseValueWithPercent)) {
            result = data.replace(new RegExp(escapeRegex(baseValueWithPercent), 'g'), newValue);
            matched = true;
        }

        // Find exact base value without % symbol
        else if (data.includes(cleanBaseValue)) {
            const regex = new RegExp(`\\b${escapeRegex(cleanBaseValue)}\\b`, 'g');
            result = data.replace(regex, cleanNewValue);
            matched = true;
        }

        // Handle spaced numbers like "1 0%" -> "10%"
        else {
            const spacedPattern = cleanBaseValue.split('').join('\\s*');
            const spacedRegex = new RegExp(`\\b${spacedPattern}%`, 'g');
            if (spacedRegex.test(data)) {
                result = data.replace(spacedRegex, newValue);
                matched = true;
            }
        }

        // Look for patterns like "+10%" or "+10" and replace if they match base value
        if (!matched) {
            const plusPatterns = [
                new RegExp(`\\+${escapeRegex(cleanBaseValue)}%`, 'g'),
                new RegExp(`\\+${escapeRegex(cleanBaseValue)}\\b`, 'g')
            ];

            for (const pattern of plusPatterns) {
                if (pattern.test(data)) {
                    const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                    result = data.replace(pattern, replacement);
                    matched = true;
                    break;
                }
            }
        }
    }

    // Strategy 3: Intelligent contextual matching
    if (!matched) {
        result = tryContextualReplacement(data, upgradeKey, newValue, baseValue);
        matched = result !== data;
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

        // Strategy 1: Use predefined replacement patterns for known skill types
        const patternConfig = Object.entries(REPLACEMENT_PATTERNS).find(([patternKey]) =>
            key.includes(patternKey) || key === patternKey
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
            currentData = applyIntelligentUpgrade(currentData, key, currentValue, values[0], values);
        }
    });

    return currentData;
};

// Test specific problem cases
const testSpecificCases = () => {
    console.log("🔍 Testing Final Enhanced System on Specific Problem Cases:");
    console.log("=" * 60);

    // Test Case 1: Fire Suppression - Randall Miller
    // Issue: Skill text has "+12%" but upgrade preview base is "10%"
    const fireSuppressionData = "Fire Suppression: Fire Suppression Capacity +12% (Non-Stacking);When Equipped: +90 Rage";
    const fireSuppressionUpgrade = {
        "Dmg Buff": ["10%", "12%", "14%", "16%", "18%"]
    };

    console.log("\n🧪 Test 1: Fire Suppression (Randall Miller)");
    console.log("Original:", fireSuppressionData);
    console.log("Upgrade Values:", JSON.stringify(fireSuppressionUpgrade["Dmg Buff"]));

    const fireResult = applyUpgradeValues(fireSuppressionData, fireSuppressionUpgrade, 3);
    console.log("Result Level 3:", fireResult);
    console.log("Expected: Should change +12% to +14%");
    console.log("Success:", fireResult.includes("14%") ? "✅" : "❌");

    // Test Case 2: Battle Command - Percy
    // Issue: Skill text has "+5%" but upgrade preview base is "3%"
    const battleCommandData = "Battle Command: All DMG +5%;Max Number of Equipped:1";
    const battleCommandUpgrade = {
        "Dmg Buff": ["3%", "5%", "7%", "9%", "11%"]
    };

    console.log("\n🧪 Test 2: Battle Command (Percy)");
    console.log("Original:", battleCommandData);
    console.log("Upgrade Values:", JSON.stringify(battleCommandUpgrade["Dmg Buff"]));

    const battleResult = applyUpgradeValues(battleCommandData, battleCommandUpgrade, 4);
    console.log("Result Level 4:", battleResult);
    console.log("Expected: Should change +5% to +9%");
    console.log("Success:", battleResult.includes("9%") ? "✅" : "❌");

    // Test Case 3: The Lord's Domain - Bekoe Yeboah
    // Issue: Spaced numbers "1 0%" instead of "10%"
    const lordsDomainData = "The Lord's Domain: Chance of Triggering Critical DMG +1 0%";
    const lordsDomainUpgrade = {
        "Dmg Buff": ["10%", "12%", "14%", "16%", "18%"]
    };

    console.log("\n🧪 Test 3: The Lord's Domain (Bekoe Yeboah)");
    console.log("Original:", lordsDomainData);
    console.log("Upgrade Values:", JSON.stringify(lordsDomainUpgrade["Dmg Buff"]));

    const lordsResult = applyUpgradeValues(lordsDomainData, lordsDomainUpgrade, 2);
    console.log("Result Level 2:", lordsResult);
    console.log("Expected: Should change +1 0% to +12%");
    console.log("Success:", lordsResult.includes("12%") ? "✅" : "❌");
};

// Run the tests
testSpecificCases();
