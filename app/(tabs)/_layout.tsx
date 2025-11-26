import Ionicons from "@expo/vector-icons/build/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter, useSegments } from "expo-router";
import * as React from "react";
import {
    Animated,
    Dimensions,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import {
    GestureHandlerRootView,
    PanGestureHandler,
    State,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppSidebar from "../components/app-sidebar";
import SafeView from "../components/SafeView";
import { SidebarProvider } from "../components/ui/sidebar";
import "../globals.css";
import { useTheme } from "../theme/ThemeContext";
import AttendancePage from "./attendance";
import GradesPage from "./grades";
import IndexPage from "./index";
import MessagesPage from "./messages";
import SchedulePage from "./schedule";
import SettingsPage from "./settings";

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();

  // route order must match the Tabs.Screen order below
  const routes = [
    "index",
    "schedule",
    "grades",
    "attendance",
    "messages",
    "settings",
  ];

  // determine current active segment (last segment)
  const currentSegment = segments[segments.length - 1] || "index";
  const currentIndex = Math.max(
    0,
    routes.indexOf(currentSegment) === -1 ? 0 : routes.indexOf(currentSegment)
  );

  const isAnimatingRef = React.useRef(false);

  const navigateToIndex = (i: number) => {
    const idx = (i + routes.length) % routes.length;
    // animate base offset to the tapped page for a smooth transition
    if (isAnimatingRef.current) return;
    const target = -idx * screenWidth;
    isAnimatingRef.current = true;
    Animated.timing(offset, {
      toValue: target,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      // finalize state
      translateX.setValue(0);
      offset.setValue(target);
      setActiveIndex(idx);
      isAnimatingRef.current = false;
      // Note: we intentionally do NOT call router.replace here to avoid layout thrash.
    });
  };
  // animated swipe handling: render pages side-by-side and translate container
  const screenWidth = Dimensions.get("window").width;
  const translateX = React.useRef(new Animated.Value(0)).current; // gesture translation during drag
  const offset = React.useRef(
    new Animated.Value(-currentIndex * screenWidth)
  ).current; // base offset for active page

  // combined translation = offset + gesture translation
  const combinedTranslate = Animated.add(offset, translateX);

  // instead of using Animated.event (native) we use a JS handler so we can detect
  // whether the gesture is primarily horizontal or vertical and ignore verticals.
  const isHorizontalRef = React.useRef(false);

  const onGestureJS = (event: any) => {
    const ne = event.nativeEvent;
    const tx = ne.translationX ?? 0;
    const ty = ne.translationY ?? 0;
    // if vertical movement dominates, mark as not-horizontal and reset translateX
    if (!isHorizontalRef.current && Math.abs(ty) > Math.abs(tx)) {
      isHorizontalRef.current = false;
      translateX.setValue(0);
      return;
    }
    // if we already decided it's horizontal or horizontal dominates now, use it
    if (Math.abs(tx) > Math.abs(ty)) {
      isHorizontalRef.current = true;
      translateX.setValue(tx);
    }
  };

  // local active index state so we can update offset when route changes
  const [activeIndex, setActiveIndex] = React.useState(currentIndex);

  // keep offset in sync when segments change (e.g., programmatic navigation)
  React.useEffect(() => {
    const idx = Math.max(
      0,
      routes.indexOf(currentSegment) === -1 ? 0 : routes.indexOf(currentSegment)
    );
    setActiveIndex(idx);
    offset.setValue(-idx * screenWidth);
    translateX.setValue(0);
  }, [currentSegment]);

  const handleStateChange = (event: any) => {
    const ne = event.nativeEvent;
    if (ne.state === State.END) {
      const dx = ne.translationX;
      const dy = ne.translationY ?? 0;
      // if the gesture was mostly vertical, ignore it (allow inner ScrollViews to handle)
      if (Math.abs(dy) > Math.abs(dx) || !isHorizontalRef.current) {
        // reset any temporary gesture translation and clear flag
        isHorizontalRef.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        return;
      }
      const threshold = Math.min(120, screenWidth * 0.25); // require a larger swipe on wide screens
      if (dx < -threshold) {
        // go to next
        const next = (activeIndex + 1 + routes.length) % routes.length;
        const target = -next * screenWidth;
        // animate base offset to the next page while resetting the gesture translateX to 0
        Animated.parallel([
          Animated.timing(offset, {
            toValue: target,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // finalize
          translateX.setValue(0);
          offset.setValue(target);
          setActiveIndex(next);
          isHorizontalRef.current = false;
          const route = routes[next];
          const path = route === "index" ? "/" : `/${route}`;
          // do NOT call router.replace when swiping — update UI only (live preview + offset)
          // Navigation URL will still update when user taps the tab bar.
        });
      } else if (dx > threshold) {
        // go to prev
        const prev = (activeIndex - 1 + routes.length) % routes.length;
        const target = -prev * screenWidth;
        Animated.parallel([
          Animated.timing(offset, {
            toValue: target,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start(() => {
          translateX.setValue(0);
          offset.setValue(target);
          setActiveIndex(prev);
          isHorizontalRef.current = false;
          const route = routes[prev];
          const path = route === "index" ? "/" : `/${route}`;
          // do NOT call router.replace when swiping — update UI only (live preview + offset)
          // Navigation URL will still update when user taps the tab bar.
        });
      } else {
        // snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const { theme } = useTheme();

  // Re-enabled swipe on Android with direction filtering (vertical drags fail early).
  // Previously disabled due to nested ScrollView conflicts; failOffsetY + logic above
  // now ensures vertical scroll keeps priority while horizontal swipe changes pages.
  const swipeEnabled = true;

  const bg = theme === "dark" ? "#000" : "#fff";
  const tabBarBg = theme === "dark" ? "#0b0b0b" : "#f8fafc";
  const tabBarBorder = theme === "dark" ? "#374151" : "#e5e7eb";
  const activeTint = theme === "dark" ? "#60A5FA" : "#2563EB";
  const inactiveTint = theme === "dark" ? "#9CA3AF" : "#6B7280";

  const insets = useSafeAreaInsets();

  return (
    <SidebarProvider>
      {/* ThemeProvider exists at app/_layout.tsx (root) — don't re-create here in normal use */}
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: bg }}>
        {/* top-level safe area: ensure header/toolbar area is stable across pages */}
        <SafeView edges={['top']} style={{ flex: 1, backgroundColor: bg }}>
          {/* App Sidebar (sliding drawer) */}
          <AppSidebar />

          {/* Trigger removed from top — triggers are placed inline in page headers */}

          <View style={{ flex: 1 }}>
            <PanGestureHandler
              onGestureEvent={onGestureJS}
              onHandlerStateChange={handleStateChange}
              // Slightly lower horizontal threshold for quicker engagement.
              activeOffsetX={[-15, 15]}
              // If vertical movement exceeds 18px early, fail to let inner ScrollViews handle it.
              failOffsetY={[-18, 18]}
              enabled={swipeEnabled}
              // JS handler differentiates horizontal vs vertical to avoid hijacking vertical scroll.
            >
              <Animated.View
                style={{
                  flex: 1,
                  transform: [{ translateX: combinedTranslate }],
                }}
              >
                {/* horizontal row of pages for live preview */}
                <View
                  style={{
                    width: screenWidth * routes.length,
                    flexDirection: "row",
                  }}
                >
                  {[
                    IndexPage,
                    SchedulePage,
                    GradesPage,
                    AttendancePage,
                    MessagesPage,
                    SettingsPage,
                  ].map((Page, idx) => (
                    // ensure each page fills available height so inner ScrollViews can size correctly
                    <View
                      key={routes[idx]}
                      style={{ width: screenWidth, flex: 1 }}
                    >
                      <Page />
                    </View>
                  ))}
                </View>
              </Animated.View>
            </PanGestureHandler>
          </View>

          {/* Custom static tab bar (not animated) */}
          <View
            style={{
              flexDirection: "row",
              height: 72 + insets.bottom,
              paddingBottom: 8 + insets.bottom,
              paddingTop: 6,
              backgroundColor: tabBarBg,
              borderTopWidth: 0,
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            {routes.map((route, i) => {
              const focused = i === activeIndex;
              const color = focused ? activeTint : inactiveTint;
              return (
                <TouchableOpacity
                  key={route}
                  onPress={() => navigateToIndex(i)}
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    {/* larger icon container so icons match the provided screenshot */}
                    <View
                      style={{
                        height: 36,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {route === "index" && (
                        <Entypo name="home" size={26} color={color} />
                      )}
                      {route === "schedule" && (
                        <Entypo name="calendar" size={26} color={color} />
                      )}
                      {route === "settings" && (
                        <Entypo name="cog" size={26} color={color} />
                      )}
                      {route === "grades" && (
                        <Ionicons
                          name="ribbon-outline"
                          size={28}
                          color={color}
                          style={{ marginTop: 1 }}
                        />
                      )}
                      {route === "attendance" && (
                        <Ionicons
                          name="stats-chart-outline"
                          size={28}
                          color={color}
                          style={{ marginTop: 1 }}
                        />
                      )}
                      {route === "messages" && (
                        <Entypo name="chat" size={26} color={color} />
                      )}
                    </View>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        color,
                        fontSize: 12,
                        marginTop: 0,
                        maxWidth: 48,
                        textAlign: "center",
                      }}
                    >
                      {route === "index"
                        ? "Główna"
                        : route === "schedule"
                          ? "Plan"
                          : route === "settings"
                            ? "Ustawienia"
                            : route === "grades"
                              ? "Oceny"
                              : route === "attendance"
                                ? "Frekwencja"
                                : "Wiadomości"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
  </SafeView>
      </GestureHandlerRootView>
    </SidebarProvider>
  );
}
