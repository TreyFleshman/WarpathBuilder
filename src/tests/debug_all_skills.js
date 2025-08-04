const fs = require('fs');

// Import the real data
const officersData = require('../database/officer.json');

// Copy the actual functions from skillDataParser.js
const parseUpgradeData = (dataArray) => {
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

const parseUpgradeLine = (line) => {
    if (!line || line.includes('UPGRADE PREVIEW')) return null;

    // Handle colon format: "Load Speed Buff: 4%/5%/6%/7%/10%"
    if (line.includes(':') && line.includes('/')) {
        const [label, values] = line.split(':');
        if (values?.includes('/')) {
            const valueArray = values.trim().split('/').map(v => v.trim());
            if (valueArray.length >= 5) {
                return {
                    label: label.trim(),
                    values: valueArray
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
                    values: valueArray
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
                        values: valueArray
                    };
                }
            }
        }
    }

    return null;
};

const escapeRegex = (string) => {
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

    // Strategy 1: Try to match any value from the upgrade array (not just base value)
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

const applyUpgradeValues = (data, upgradeInfo, level) => {
    let currentData = data;

    Object.entries(upgradeInfo).forEach(([key, values]) => {
        const currentValue = values[level - 1];
        if (!currentValue) return;

        currentData = applyIntelligentUpgrade(currentData, key, currentValue, values[0], values);
    });

    return currentData;
};

// Find John Reilly
const johnReilly = officersData.find(officer => officer.name === "John Reilly");

if (!johnReilly) {
    console.log("❌ John Reilly not found!");
    process.exit(1);
}

console.log("🎖️  COMPREHENSIVE TEST: All John Reilly Skills");
console.log("=" * 70);

// Test all skills
johnReilly.jn.forEach((skill, skillIndex) => {
    console.log(`\n\n📋 SKILL ${skillIndex}: ${skill.name}`);
    console.log("-" * 50);

    console.log(`📝 Raw Skill Data:`);
    skill.data.forEach((item, index) => {
        console.log(`   [${index}]: "${item}"`);
    });

    // Parse upgrade data
    const upgradeData = parseUpgradeData(skill.data);
    console.log(`\n📊 Parsed Upgrade Data:`, JSON.stringify(upgradeData, null, 2));

    if (Object.keys(upgradeData).length === 0) {
        console.log(`⚠️  No upgrade data found for this skill`);
        return;
    }

    // Test levels 1, 3, and 5
    [1, 3, 5].forEach(level => {
        console.log(`\n🧪 Level ${level}:`);
        const baseText = skill.data[0];
        const result = applyUpgradeValues(baseText, upgradeData, level);

        console.log(`   Base: "${baseText}"`);
        console.log(`   L${level}:   "${result}"`);

        if (result === baseText && level > 1) {
            console.log(`   ❌ FAILED: No changes for Level ${level}`);
        } else if (level > 1) {
            console.log(`   ✅ SUCCESS: Changes applied for Level ${level}`);
        }
    });
});

console.log(`\n\n🏁 Test Complete!`);
