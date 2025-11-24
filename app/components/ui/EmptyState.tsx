import React from 'react';
import { Text, View } from 'react-native';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, className = '' }) => {
  return (
    <View className={`items-center justify-center py-12 ${className}`}>
      {icon}
      {title ? <Text className="mt-4 text-center text-lg font-medium">{title}</Text> : null}
      {subtitle ? <Text className="mt-2 text-center text-sm text-gray-500">{subtitle}</Text> : null}
    </View>
  );
};

export default EmptyState;
