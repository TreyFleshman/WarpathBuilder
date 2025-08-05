const fs = require('fs');

// Import the real data
const officersData = require('../database/officer.json');
const { parseUpgradeData, applyUpgradeValues } = require('../utils/skillDataParser');

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
console.log(`\n🧪 Testing Upgrade Logic:`);

const baseText = wallOfSteelSkill.data[0];
console.log(`Base Text: "${baseText}"`);

// Test different levels
for (let level = 1; level <= 5; level++) {
    const result = applyUpgradeValues(baseText, upgradeData, level);
    console.log(`Level ${level}: "${result}"`);

    // Check if the result changed
    if (result === baseText) {
        console.log(`   ❌ Level ${level}: No changes made`);
    } else {
        console.log(`   ✅ Level ${level}: Changes applied`);
    }
}

console.log(`\n🔍 Expected Upgrade Values for Wall of Steel:`);
if (upgradeData['Blast Dmg Resist Buff']) {
    upgradeData['Blast Dmg Resist Buff'].forEach((value, index) => {
        console.log(`   Level ${index + 1}: ${value}`);
    });
}
