import React, { createContext, useContext, useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(320, Math.floor(WINDOW_WIDTH * 0.78));

type SidebarContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current; // 0 closed, 1 open

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, anim]);

  const value = useMemo(() => ({
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((s) => !s),
  }), [isOpen]);

  return (
    <SidebarContext.Provider value={value}>
      {/* Animated wrapper to be consumed by Sidebar component via context */}
      <View style={{ flex: 1 }}>
        {children}
        {/* render a portal-like holder - actual sidebar will be positioned absolute */}
      </View>
    </SidebarContext.Provider>
  );
};

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export const SidebarTrigger: React.FC<{ style?: any; children?: React.ReactNode }> = ({ style, children }) => {
  const { toggle } = useSidebar();
  return (
    <TouchableOpacity onPress={toggle} style={style} accessibilityLabel="Open sidebar">
      {children ?? <Text style={{ color: "#60A5FA", fontSize: 20 }}>☰</Text>}
    </TouchableOpacity>
  );
};

// Low-level Sidebar components
export const Sidebar: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isOpen, close } = useSidebar();
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: isOpen ? 0.5 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, translateX, backdropOpacity]);

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        style={[
          styles.backdrop,
          { opacity: backdropOpacity, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(2,6,23,0.06)' },
        ]}
      >
        <TouchableWithoutFeedback onPress={close}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View
        style={[
          styles.sidebar,
          { width: SIDEBAR_WIDTH, transform: [{ translateX }], backgroundColor: theme === 'dark' ? '#0b0b0b' : '#ffffff' },
        ]}
      >
        {children}
      </Animated.View>
    </>
  );
};

export const SidebarHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.06)' }]}>
      {children ?? <Text style={[styles.headerText, { color: theme === 'dark' ? '#fff' : '#0f172a' }]}>Menu</Text>}
    </View>
  );
};

export const SidebarContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  return <View style={[styles.content, { backgroundColor: theme === 'dark' ? 'transparent' : 'transparent' }]}>{children}</View>;
};

export const SidebarGroup: React.FC<{ title?: string; children?: React.ReactNode }> = ({ title, children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.group}>
      {title ? <Text style={[styles.groupTitle, { color: theme === 'dark' ? '#9CA3AF' : '#6b7280' }]}>{title}</Text> : null}
      {children}
    </View>
  );
};

export const SidebarFooter: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  return <View style={[styles.footer, { borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.06)' }]}>{children}</View>;
};

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 998,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#0b0b0b",
    zIndex: 999,
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  header: {
    // add more top spacing so the 'Menu' label sits lower from the very top
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  headerText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  content: { flex: 1, paddingTop: 12 },
  group: { marginBottom: 8 },
  groupTitle: { color: "#9CA3AF", fontSize: 12, marginBottom: 6 },
  // keep small top padding but add extra bottom padding so 'Zamknij' has space from the bottom edge
  footer: { paddingTop: 8, paddingBottom: 24, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.03)" },
});

export default null;
