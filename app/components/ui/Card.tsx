import React from "react";
import { View, ViewProps } from "react-native";
import {
    getEditorialPalette,
    getEditorialShadow,
} from "../../theme/editorial";
import { useTheme } from "../../theme/ThemeContext";

type CardProps = ViewProps & {
  children?: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({
    children,
    className = "",
    style,
    ...rest
}) => {
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    return (
        <View
            {...rest}
            style={[
                {
                    backgroundColor: palette.surface,
                    borderRadius: 22,
                },
                getEditorialShadow(theme),
                style,
            ]}
            className={className}
        >
            {children}
        </View>
    );
};

export default Card;
