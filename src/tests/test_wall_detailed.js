const fs = require('fs');

// Import the real data
const officersData = require('../database/officer.json');

// Copy the actual functions from skillDataParser.js
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

const escapeRegex = string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const isNumberClose = (num1, num2, tolerance = 0.1) => {
    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);
    if (isNaN(n1) || isNaN(n2)) return false;

    return Math.abs(n1 - n2) <= tolerance;
};

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

const applyIntelligentUpgrade = (data, upgradeKey, newValue, baseValue, allValues = []) => {
    const cleanNewValue = newValue.replace(/[^\d.]/g, '');
    const cleanBaseValue = baseValue.replace(/[^\d.]/g, '');

    if (!cleanNewValue || !cleanBaseValue) return data;

    let result = data;
    let matched = false;

    console.log(`  🔍 Looking for "${baseValue}" to replace with "${newValue}"`);
    console.log(`  📝 In text: "${data}"`);

    // Strategy 1: Try to match any value from the upgrade array (not just base value)
    if (allValues && allValues.length > 0) {
        console.log(`  🔢 Available values: [${allValues.join(', ')}]`);
        for (const value of allValues) {
            const cleanValue = value.replace(/[^\d.]/g, '');
            if (!cleanValue) continue;

            // Try exact match with %
            const valueWithPercent = `${cleanValue}%`;
            if (data.includes(valueWithPercent)) {
                result = data.replace(valueWithPercent, newValue);
                matched = true;
                console.log(`  ✅ Strategy 1A: Found "${valueWithPercent}" → "${newValue}"`);
                break;
            }

            // Try plus pattern
            const plusPattern = `+${cleanValue}%`;
            if (data.includes(plusPattern)) {
                const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                result = data.replace(plusPattern, replacement);
                matched = true;
                console.log(`  ✅ Strategy 1B: Found "${plusPattern}" → "${replacement}"`);
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
            console.log(`  ✅ Strategy 2: Matched spaced pattern`);
        }
    }

    // Strategy 3: Original base value matching
    if (!matched) {
        const baseValueWithPercent = `${cleanBaseValue}%`;
        if (data.includes(baseValueWithPercent)) {
            result = data.replace(baseValueWithPercent, newValue);
            matched = true;
            console.log(`  ✅ Strategy 3: Found "${baseValueWithPercent}" → "${newValue}"`);
        } else {
            const plusPattern = `+${cleanBaseValue}%`;
            if (data.includes(plusPattern)) {
                const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                result = data.replace(plusPattern, replacement);
                matched = true;
                console.log(`  ✅ Strategy 3: Found "${plusPattern}" → "${replacement}"`);
            }
        }
    }

    // Strategy 4: Intelligent contextual matching
    if (!matched) {
        const contextResult = tryContextualReplacement(data, upgradeKey, newValue, baseValue);
        if (contextResult !== data) {
            result = contextResult;
            matched = true;
            console.log(`  ✅ Strategy 4: Applied contextual replacement`);
        }
    }

    if (!matched) {
        console.log(`  ❌ No strategy worked`);
    }

    return result;
};

const applyUpgradeValues = (data, upgradeInfo, level) => {
    let currentData = data;

    Object.entries(upgradeInfo).forEach(([key, values]) => {
        const currentValue = values[level - 1];
        if (!currentValue) return;

        console.log(`\n  Applying upgrade: "${key}" Level ${level} = "${currentValue}"`);
        currentData = applyIntelligentUpgrade(currentData, key, currentValue, values[0], values);
    });

    return currentData;
};

// Find John Reilly
const johnReilly = officersData.find(officer => officer.name === 'John Reilly');

if (!johnReilly) {
    console.log('❌ John Reilly not found!');
    process.exit(1);
}

console.log('🎖️  REAL APPLICATION TEST: John Reilly - Wall of Steel');
console.log('=' * 60);

// Get the Wall of Steel skill (index 3)
const wallOfSteelSkill = johnReilly.jn[3];
console.log(`📋 Skill Name: ${wallOfSteelSkill.name}`);
console.log(`📝 Raw Skill Data:`);
wallOfSteelSkill.data.forEach((item, index) => {
    console.log(`   [${index}]: "${item}"`);
});

// Parse upgrade data
const upgradeData = parseUpgradeData(wallOfSteelSkill.data);
console.log(`\n📊 Parsed Upgrade Data:`, JSON.stringify(upgradeData, null, 2));

// Test the actual upgrade logic
console.log(`\n🧪 Testing Upgrade Logic for Level 3:`);

const baseText = wallOfSteelSkill.data[0];
console.log(`\nBase Text: "${baseText}"`);

const level3Result = applyUpgradeValues(baseText, upgradeData, 3);
console.log(`\nLevel 3 Result: "${level3Result}"`);

if (level3Result === baseText) {
    console.log(`❌ FAILED: No changes made for Level 3`);
} else {
    console.log(`✅ SUCCESS: Changes applied for Level 3`);
}
