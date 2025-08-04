// Test script to identify officers with "Balanced" tagged skills
const officerData = require('../database/officer.json');

console.log('Searching for officers with "Balanced" tagged skills...\n');

let balancedSkillsFound = 0;

officerData.forEach(officer => {
    if (officer.jn && Array.isArray(officer.jn)) {
        officer.jn.forEach((skill, index) => {
            if (skill && typeof skill === 'object' && skill.tag === "Balanced") {
                console.log(`Officer: ${officer.nickname}`);
                console.log(`  Skill Index: ${index}`);
                console.log(`  Skill Name: ${skill.name}`);
                console.log(`  Skill Description: ${skill.desc}`);
                console.log(`  Tag: ${skill.tag}`);
                console.log('  ---');
                balancedSkillsFound++;
            }
        });
    }
});

console.log(`Total "Balanced" tagged skills found: ${balancedSkillsFound}`);

// Also check for passive skills (indices 1-3)
console.log('\nChecking passive skills (indices 1-3) for "Balanced" tags...\n');

let passiveBalancedSkills = 0;

officerData.forEach(officer => {
    if (officer.jn && Array.isArray(officer.jn)) {
        officer.jn.forEach((skill, index) => {
            if (skill && typeof skill === 'object' && index > 0 && index < 4 && skill.tag === "Balanced") {
                console.log(`Officer: ${officer.nickname} (Index ${index})`);
                console.log(`  Skill: ${skill.name}`);
                console.log(`  Tag: ${skill.tag}`);
                passiveBalancedSkills++;
            }
        });
    }
});

console.log(`Passive "Balanced" tagged skills found: ${passiveBalancedSkills}`);
