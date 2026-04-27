import React from "react";
import { Text, View } from "react-native";
import {
  editorialType,
  getEditorialPalette,
} from "../../theme/editorial";
import { useTheme } from "../../theme/ThemeContext";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  className = "",
}) => {
  const { theme } = useTheme();
  const palette = getEditorialPalette(theme);

  return (
    <View
      className={`items-center justify-center py-12 ${className}`}
      style={{
        backgroundColor: palette.pageSection,
        borderRadius: 22,
        paddingHorizontal: 20,
      }}
    >
      {icon}
      {title ? (
        <Text
          style={[
            editorialType.title,
            {
              color: palette.text,
              textAlign: "center",
              marginTop: 16,
            },
          ]}
        >
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text
          style={[
            editorialType.body,
            {
              color: palette.textMuted,
              textAlign: "center",
              marginTop: 8,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

export default EmptyState;
