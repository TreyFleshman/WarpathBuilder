// Comprehensive test case for skill upgrade logic
// This script will test all officers and their skills to identify patterns

const fs = require('fs');
const path = require('path');

// Load officers data
const officersData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'database', 'officer.json'), 'utf8')
);

// Import our parsing functions (simplified for Node.js testing)
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

    // Enhanced parsing for different formats
    const patterns = [
        // Pattern: "Label: value1/value2/value3/value4/value5"
        /^([^:]+):\s*(.+)$/,
        // Pattern: "Label value1/value2/value3/value4/value5"
        /^([^\/\d]+)\s+(.+)$/,
    ];

    for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
            const [, label, valuesStr] = match;

            if (valuesStr.includes('/')) {
                const valueArray = valuesStr.split('/').map(v => v.trim());
                if (valueArray.length >= 4) {
                    // At least 4 levels
                    return {
                        label: label.trim(),
                        values: valueArray,
                    };
                }
            }
        }
    }

    return null;
};

const applyIntelligentUpgrade = (data, upgradeKey, newValue, baseValue) => {
    console.log(`  Testing upgrade: "${upgradeKey}" from "${baseValue}" to "${newValue}"`);
    console.log(`  Original text: "${data}"`);

    // Clean the values - remove % and convert to numbers for comparison
    const cleanNewValue = newValue.replace(/[^\d.]/g, '');
    const cleanBaseValue = baseValue.replace(/[^\d.]/g, '');

    if (!cleanNewValue || !cleanBaseValue) {
        console.log(
            `  ❌ Failed: Invalid values (clean new: "${cleanNewValue}", clean base: "${cleanBaseValue}")`
        );
        return data;
    }

    let result = data;
    let matched = false;

    // Strategy 1: Find exact base value with % symbol
    const baseValueWithPercent = `${cleanBaseValue}%`;
    if (data.includes(baseValueWithPercent)) {
        result = data.replace(new RegExp(cleanBaseValue + '%', 'g'), newValue);
        matched = true;
        console.log(`  ✅ Strategy 1 (exact % match): "${result}"`);
    }

    // Strategy 2: Find exact base value without % symbol
    else if (data.includes(cleanBaseValue)) {
        const regex = new RegExp(`\\b${cleanBaseValue}\\b`, 'g');
        result = data.replace(regex, cleanNewValue);
        matched = true;
        console.log(`  ✅ Strategy 2 (exact number match): "${result}"`);
    }

    // Strategy 3: Find any number followed by % that matches the base value
    else {
        const percentRegex = new RegExp(`\\b${cleanBaseValue}%`, 'g');
        if (percentRegex.test(data)) {
            result = data.replace(percentRegex, newValue);
            matched = true;
            console.log(`  ✅ Strategy 3 (percent regex): "${result}"`);
        }
    }

    // Strategy 4: Look for patterns like "+10%" or "+10" and replace if they match base value
    if (!matched) {
        const plusPatterns = [
            new RegExp(`\\+${cleanBaseValue}%`, 'g'),
            new RegExp(`\\+${cleanBaseValue}\\b`, 'g'),
        ];

        for (const pattern of plusPatterns) {
            if (pattern.test(data)) {
                const replacement = newValue.includes('%') ? `+${newValue}` : `+${newValue}%`;
                result = data.replace(pattern, replacement);
                matched = true;
                console.log(`  ✅ Strategy 4 (plus pattern): "${result}"`);
                break;
            }
        }
    }

    if (!matched) {
        console.log(`  ❌ No strategy worked for this upgrade`);
    }

    return result;
};

// Test function for a single skill
const testSkill = (officer, skill, skillIndex) => {
    console.log(`\n--- Testing ${officer.name} - Skill ${skillIndex}: ${skill.name} ---`);

    if (!skill.data || skill.data.length === 0) {
        console.log(`❌ No skill data available`);
        return false;
    }

    const upgradeData = parseUpgradeData(skill.data);

    if (Object.keys(upgradeData).length === 0) {
        console.log(`ℹ️  No upgrade data (static skill)`);
        return true; // Static skills are fine
    }

    console.log(`📊 Found upgrade data:`, upgradeData);

    const baseSkillText = skill.data[0];
    console.log(`📝 Base skill text: "${baseSkillText}"`);

    let allUpgradesWorked = true;

    Object.entries(upgradeData).forEach(([key, values]) => {
        console.log(`\n  Testing upgrade key: "${key}"`);
        console.log(`  Values: [${values.join(', ')}]`);

        // Test upgrading from level 1 to level 3
        const baseValue = values[0];
        const level3Value = values[2];

        if (baseValue && level3Value) {
            const result = applyIntelligentUpgrade(baseSkillText, key, level3Value, baseValue);

            if (result === baseSkillText) {
                console.log(`  ❌ FAILED: No changes applied`);
                allUpgradesWorked = false;
            } else {
                console.log(`  ✅ SUCCESS: Text was modified`);
            }
        } else {
            console.log(`  ⚠️  Missing values for testing`);
        }
    });

    return allUpgradesWorked;
};

// Main test function
const runComprehensiveTest = () => {
    console.log('🚀 Starting comprehensive skill upgrade test...\n');

    let totalOfficers = 0;
    let totalSkills = 0;
    let skillsWithUpgrades = 0;
    let workingUpgrades = 0;
    let failedSkills = [];

    officersData.forEach(officer => {
        totalOfficers++;
        console.log(`\n🎖️  TESTING OFFICER: ${officer.name} (${officer.nickname})`);

        if (!officer.jn || officer.jn.length === 0) {
            console.log(`❌ No skills found for ${officer.name}`);
            return;
        }

        officer.jn.forEach((skill, index) => {
            totalSkills++;
            const result = testSkill(officer, skill, index);

            if (result === true) {
                workingUpgrades++;
            } else if (result === false) {
                skillsWithUpgrades++;
                failedSkills.push({
                    officer: officer.name,
                    skill: skill.name,
                    data: skill.data,
                });
            } else {
                skillsWithUpgrades++;
                workingUpgrades++;
            }
        });
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Officers: ${totalOfficers}`);
    console.log(`Total Skills: ${totalSkills}`);
    console.log(`Skills with Upgrades: ${skillsWithUpgrades}`);
    console.log(`Working Upgrades: ${workingUpgrades}`);
    console.log(`Failed Upgrades: ${failedSkills.length}`);

    if (failedSkills.length > 0) {
        console.log('\n❌ FAILED SKILLS:');
        failedSkills.forEach(failed => {
            console.log(`  - ${failed.officer}: ${failed.skill}`);
        });

        console.log('\n🔍 DETAILED FAILURE ANALYSIS:');
        failedSkills.slice(0, 3).forEach((failed, index) => {
            console.log(`\n${index + 1}. ${failed.officer} - ${failed.skill}:`);
            failed.data.forEach((dataItem, dataIndex) => {
                console.log(`   Data[${dataIndex}]: "${dataItem}"`);
            });
        });
    }
};

// Run the test
runComprehensiveTest();
