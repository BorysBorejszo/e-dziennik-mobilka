import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

type CardProps = ViewProps & {
  children?: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({ children, className = '', style, ...rest }) => {
  const { theme } = useTheme();
  const base = theme === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200';
  return (
    // remove `w-full` to avoid causing horizontal overflow when Card is used with horizontal margins
    <View {...rest} style={style} className={`${base} rounded-xl ${className}`}>
      {children}
    </View>
  );
};

export default Card;
