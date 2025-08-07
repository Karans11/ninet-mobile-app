// utils/categoryColors.ts - CREATE THIS NEW FILE
export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'AI Models': '#3B82F6',           // Blue
    'Machine Learning': '#10B981',    // Emerald
    'Policy': '#F59E0B',              // Amber
    'Research': '#8B5CF6',            // Purple
    'Industry News': '#EF4444',       // Red
    'Startups': '#06B6D4',            // Cyan
    'AI Security': '#DC2626',         // Red-600
    'AI Tools': '#059669',            // Emerald-600
    'Computer Vision': '#7C3AED',     // Violet
    'Natural Language Processing': '#DB2777', // Pink
    'Robotics': '#EA580C'             // Orange
  };
  
  return colors[category] || '#6B7280'; // Default gray for unknown categories
};

// Export category color mapping for consistency across components
export const CATEGORY_COLORS = {
  'AI Models': '#3B82F6',
  'Machine Learning': '#10B981',
  'Policy': '#F59E0B',
  'Research': '#8B5CF6',
  'Industry News': '#EF4444',
  'Startups': '#06B6D4',
  'AI Security': '#DC2626',
  'AI Tools': '#059669',
  'Computer Vision': '#7C3AED',
  'Natural Language Processing': '#DB2777',
  'Robotics': '#EA580C'
} as const;
