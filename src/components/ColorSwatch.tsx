import React from 'react';

interface ColorSwatchProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const getColorValue = (color: string): string => {
  // Map common color names to hex values
  const colorMap: Record<string, string> = {
    'none': '#E5E7EB',
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#EF4444',
    'blue': '#3B82F6',
    'green': '#10B981',
    'yellow': '#F59E0B',
    'purple': '#8B5CF6',
    'pink': '#EC4899',
    'gray': '#6B7280',
    'brown': '#92400E',
    // Add more color mappings as needed
  };

  // Try to match the color name
  const normalizedColor = color.toLowerCase().trim();
  if (colorMap[normalizedColor]) {
    return colorMap[normalizedColor];
  }

  // If it looks like a hex code, use it directly
  if (/^#[0-9A-F]{6}$/i.test(color)) {
    return color;
  }

  // Default fallback color
  return '#E5E7EB';
};

const getSizeClasses = (size: ColorSwatchProps['size'] = 'md') => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };
  return sizes[size];
};

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const colorValue = getColorValue(color);
  const sizeClass = getSizeClasses(size);
  
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`${sizeClass} rounded-full border border-gray-200 flex-shrink-0 ${className}`}
        style={{ backgroundColor: colorValue }}
        title={color}
      />
      {showLabel && (
        <span className="text-xs text-gray-600 truncate">
          {color}
        </span>
      )}
    </div>
  );
};

export const ColorSwatchList: React.FC<{
  colors: string[];
  maxDisplay?: number;
  showLabels?: boolean;
  size?: ColorSwatchProps['size'];
}> = ({
  colors,
  maxDisplay = 3,
  showLabels = false,
  size = 'md'
}) => {
  const displayColors = colors.slice(0, maxDisplay);
  const remaining = colors.length - maxDisplay;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayColors.map((color, index) => (
        <ColorSwatch
          key={`${color}-${index}`}
          color={color}
          size={size}
          showLabel={showLabels}
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-gray-500">
          +{remaining}
        </span>
      )}
    </div>
  );
};
