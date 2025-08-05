// Quick test for the enhanced upgrade system
const testData = [
    {
        name: 'Fire Suppression - Randall Miller',
        skillText: 'Troop Firepower +12%.',
        upgradeKey: 'Firepower Gain',
        baseValue: '10%',
        newValue: '14%',
    },
    {
        name: "The Lord's Domain - Bekoe Yeboah",
        skillText:
            'If this Officer is in a Tank or Helicopter Troop, it gains a 1 0% bonus to HP and recovers 0.5% HP per second while in the field and not in combat.',
        upgradeKey: 'HP Buff',
        baseValue: '10%',
        newValue: '18%',
    },
    {
        name: 'Battle Command - Percy',
        skillText:
            'Prep Time: 8s. Percy inspires her Troops, inflicting enemy Troop Dmg(Dmg Coefficient 800).Troop Firepower +5% for 8s.',
        upgradeKey: 'Firepower Gain',
        baseValue: '3%',
        newValue: '5%',
    },
];

// Enhanced upgrade function (copied from our implementation)
const applyIntelligentUpgrade = (data, upgradeKey, newValue, baseValue, allValues = []) => {
    const cleanNewValue = newValue.replace(/[^\d.]/g, '');
    const cleanBaseValue = baseValue.replace(/[^\d.]/g, '');

    if (!cleanNewValue || !cleanBaseValue) return data;

    let result = data;
    let matched = false;

    console.log(
        `  🔍 Debug: Looking for "${baseValue}" to replace with "${newValue}" in "${data}"`
    );

    // Strategy 1: Try to match any value from the upgrade array (not just base value)
    // This handles cases where skill text shows current level instead of base level
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
                console.log(
                    `  ✅ Strategy 1A (exact % match): Found "${valueWithPercent}" → "${newValue}"`
                );
                break;
            }

            // Try plus pattern
            const plusPattern = `+${cleanValue}%`;
            if (data.includes(plusPattern)) {
                const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                result = data.replace(plusPattern, replacement);
                matched = true;
                console.log(
                    `  ✅ Strategy 1B (plus pattern): Found "${plusPattern}" → "${replacement}"`
                );
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
            console.log(`  ✅ Strategy 2 (spaced numbers): Matched spaced pattern`);
        }
    }

    // Strategy 3: Find exact base value with % symbol
    if (!matched) {
        const baseValueWithPercent = `${cleanBaseValue}%`;
        if (data.includes(baseValueWithPercent)) {
            result = data.replace(baseValueWithPercent, newValue);
            matched = true;
            console.log(
                `  ✅ Strategy 3A (base % match): Found "${baseValueWithPercent}" → "${newValue}"`
            );
        }
    }

    // Strategy 4: Look for patterns like "+10%" and replace if they match base value
    if (!matched) {
        const plusPattern = `+${cleanBaseValue}%`;
        if (data.includes(plusPattern)) {
            const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
            result = data.replace(plusPattern, replacement);
            matched = true;
            console.log(
                `  ✅ Strategy 4 (base plus pattern): Found "${plusPattern}" → "${replacement}"`
            );
        }
    }

    // Strategy 5: Intelligent contextual matching
    if (!matched) {
        const contextResult = tryContextualReplacement(data, upgradeKey, newValue, baseValue);
        if (contextResult !== data) {
            result = contextResult;
            matched = true;
            console.log(`  ✅ Strategy 5 (contextual): Applied contextual replacement`);
        }
    }

    if (!matched) {
        console.log(`  ❌ No strategy worked for this upgrade`);
    }

    return result;
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

const isNumberClose = (num1, num2, tolerance = 0.1) => {
    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);
    if (isNaN(n1) || isNaN(n2)) return false;

    return Math.abs(n1 - n2) <= tolerance;
};

const escapeRegex = string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Test each case
console.log('🧪 Testing Enhanced Upgrade System\n');

testData.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log(`   Original: "${test.skillText}"`);
    console.log(`   Upgrade: ${test.upgradeKey} from "${test.baseValue}" to "${test.newValue}"`);

    // Add mock upgrade array for testing
    const mockUpgradeArray = ['20%', '25%', '30%', '40%', '50%'];

    const result = applyIntelligentUpgrade(
        test.skillText,
        test.upgradeKey,
        test.newValue,
        test.baseValue,
        mockUpgradeArray
    );

    if (result === test.skillText) {
        console.log(`   ❌ FAILED: No changes made`);
    } else {
        console.log(`   ✅ SUCCESS: "${result}"`);
    }
    console.log('');
});
