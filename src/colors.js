export const getCategoryColorStyles = (percentage) => {
  if (percentage <= 25) {
    return {
      bg: 'var(--color-green-light)',
      text: 'var(--color-green)',
      border: 'var(--color-green)',
      className: ''
    };
  }
  if (percentage <= 50) {
    return {
      bg: 'var(--color-yellow-light)',
      text: 'var(--color-yellow)',
      border: 'var(--color-yellow)',
      className: ''
    };
  }
  if (percentage <= 75) {
    return {
      bg: 'var(--color-orange-light)',
      text: 'var(--color-orange)',
      border: 'var(--color-orange)',
      className: ''
    };
  }
  if (percentage <= 100) {
    return {
      bg: 'var(--color-red-light)',
      text: 'var(--color-red)',
      border: 'var(--color-red)',
      className: 'pulsing-red'
    };
  }
  
  // > 100%
  return {
    bg: 'var(--color-maroon-light)',
    text: 'var(--color-maroon)',
    border: 'var(--color-maroon)',
    className: 'pulsing-maroon'
  };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};
