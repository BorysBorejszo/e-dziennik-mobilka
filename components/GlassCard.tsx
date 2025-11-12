import React, { useEffect, useState } from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { useTheme } from "../app/theme/ThemeContext";

type Props = ViewProps & {
  children: React.ReactNode;
  className?: string;
};

export default function GlassCard({ children, style, className, ...rest }: Props) {
  const [blurAvailable, setBlurAvailable] = useState(false);
  const [BlurView, setBlurView]: any = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    // try to dynamically require expo-blur if it's installed — fall back if not present
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("expo-blur");
      if (mod && mod.BlurView) {
        setBlurView(() => mod.BlurView);
        setBlurAvailable(true);
      }
    } catch (e) {
      setBlurAvailable(false);
    }
  }, []);

  const dynamicContainer = {
    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(2,6,23,0.06)',
    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.98)',
    shadowColor: theme === 'dark' ? '#000' : '#000',
  } as any;

  return (
    <View
      {...rest}
      style={[styles.container, dynamicContainer, style]}
      className={className}
    >
      {blurAvailable && BlurView ? (
        // @ts-ignore - dynamic component type
        <BlurView intensity={60} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : (
        // fallback: subtle translucent overlay handled by backgroundColor in styles
        null
      )}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  content: {
    padding: 14,
    gap: 12,
  },
});
