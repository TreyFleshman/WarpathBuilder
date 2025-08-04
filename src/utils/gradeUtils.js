// Grade rendering utilities
export const GRADE_CONFIGS = {
    SILVER: { min: 4, max: 6, color: '#c0c0c0', name: 'Silver' },
    GOLD: { min: 6, max: 8, color: '#ffd700', name: 'Gold' },
    STEEL: { min: 8, max: 10, color: '#4682b4', name: 'Steel Blue' }
};

export const getGradeConfig = (grade) => {
    const gradeNum = parseFloat(grade);

    if (gradeNum >= GRADE_CONFIGS.STEEL.min) return GRADE_CONFIGS.STEEL;
    if (gradeNum >= GRADE_CONFIGS.GOLD.min) return GRADE_CONFIGS.GOLD;
    if (gradeNum >= GRADE_CONFIGS.SILVER.min) return GRADE_CONFIGS.SILVER;

    return null;
};

export const calculateStars = (grade) => {
    const gradeNum = parseFloat(grade);
    const baseGrade = Math.floor(gradeNum);
    const decimal = Math.round((gradeNum % 1) * 10) / 10;

    const config = getGradeConfig(gradeNum);
    if (!config) return { stars: '', chevron: '', color: '#666' };

    let numStars = 0;
    if (config === GRADE_CONFIGS.SILVER) {
        numStars = baseGrade;
    } else if (config === GRADE_CONFIGS.GOLD) {
        numStars = gradeNum >= 7 ? 2 : 1;
    } else if (config === GRADE_CONFIGS.STEEL) {
        numStars = gradeNum >= 9 ? 2 : 1;
    }

    const stars = '★'.repeat(numStars);
    const chevron = decimal === 0.1 ? '>' : decimal === 0.2 ? '>>' : '';

    return { stars, chevron, color: config.color };
};

export const renderStars = (grade) => {
    const { stars, chevron, color } = calculateStars(grade);

    return (
        <span style={{ color, fontWeight: 'bold' }}>
            {stars}{chevron}
        </span>
    );
};
