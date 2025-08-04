// Enhanced Grade Component
import React from 'react';

const GradeBadge = ({ grade, size = 'normal' }) => {
    const gradeNum = parseFloat(grade);
    const baseGrade = Math.floor(gradeNum);
    const decimal = Math.round((gradeNum % 1) * 10) / 10;

    let stars = '';
    let color = '';
    let backgroundColor = '';
    let numStars = 0;

    if (gradeNum >= 4 && gradeNum < 6) {
        color = '#2c3e50'; // Dark text
        backgroundColor = 'linear-gradient(135deg, #bdc3c7, #ecf0f1)'; // Silver gradient
        numStars = baseGrade;
    } else if (gradeNum >= 6 && gradeNum < 8) {
        color = '#8b4513'; // Dark brown text
        backgroundColor = 'linear-gradient(135deg, #f39c12, #f1c40f)'; // Gold gradient
        if (gradeNum >= 6 && gradeNum < 7) {
            numStars = 1;
        } else {
            numStars = 2;
        }
    } else if (gradeNum >= 8) {
        color = '#ffffff'; // White text
        backgroundColor = 'linear-gradient(135deg, #3498db, #2980b9)'; // Blue gradient
        if (gradeNum >= 8 && gradeNum < 9) {
            numStars = 1;
        } else {
            numStars = 2;
        }
    } else {
        color = '#2c3e50';
        backgroundColor = 'linear-gradient(135deg, #95a5a6, #7f8c8d)'; // Gray gradient
    }

    for (let i = 0; i < numStars; i++) {
        stars += '★';
    }

    let chevron = '';
    if (decimal === 0.1) {
        chevron = '>';
    } else if (decimal === 0.2) {
        chevron = '>>';
    }

    const sizeClass = size === 'large' ? 'grade-badge-large' : 'grade-badge-normal';

    return (
        <div
            className={`grade-badge ${sizeClass}`}
            style={{
                background: backgroundColor,
                color,
                fontWeight: 'bold',
                padding: size === 'large' ? '8px 16px' : '4px 8px',
                borderRadius: '8px',
                fontSize: size === 'large' ? '1.2rem' : '0.9rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                border: '2px solid rgba(255,255,255,0.8)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}
        >
            <span style={{ fontSize: '0.8em', opacity: 0.9 }}>Grade</span>
            <span style={{ fontSize: '1.1em' }}>{grade >= 4 ? stars : grade}</span>
            {chevron && <span style={{ fontSize: '0.9em' }}>{chevron}</span>}
        </div>
    );
};

export default GradeBadge;
