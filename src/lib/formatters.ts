/**
 * Formats a number as Indian Rupees (INR) using the Indian numbering system (Lakhs, Crores).
 * Example: 100000 -> ₹1,00,000.00
 */
export const formatINR = (amount: number, includeDecimals = true) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: includeDecimals ? 2 : 0,
        maximumFractionDigits: includeDecimals ? 2 : 0,
    }).format(amount);
};

/**
 * Compact currency formatter for dashboard cards.
 * Example: 150000 -> ₹1.5L
 */
export const formatCompactINR = (amount: number) => {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
};
