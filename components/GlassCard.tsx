import React, { useEffect, useState } from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import {
  getEditorialPalette,
  getEditorialShadow,
} from "../app/theme/editorial";
import { useTheme } from "../app/theme/ThemeContext";

type Props = ViewProps & {
  children: React.ReactNode;
  className?: string;
};

export default function GlassCard({
  children,
  style,
  className,
  ...rest
}: Props) {
  const [blurAvailable, setBlurAvailable] = useState(false);
  const [BlurView, setBlurView]: any = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const mod = await import("expo-blur");
        if (mod && mod.BlurView) {
          setBlurView(() => mod.BlurView);
          setBlurAvailable(true);
        }
      } catch {
        setBlurAvailable(false);
      }
    })();
  }, []);

  const palette = getEditorialPalette(theme);

  const dynamicContainer = {
    backgroundColor: palette.surfaceGlass,
  } as any;

  return (
    <View
      {...rest}
      style={[
        styles.container,
        dynamicContainer,
        getEditorialShadow(theme, "floating"),
        style,
      ]}
      className={className}
    >
      {blurAvailable && BlurView ? (
        // @ts-ignore - dynamic component type
        <BlurView
          intensity={60}
          tint={theme === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : // fallback: subtle translucent overlay handled by backgroundColor in styles
      null}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
  },
  content: {
    padding: 18,
    gap: 14,
  },
});
