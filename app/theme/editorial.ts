import { TextStyle, ViewStyle } from "react-native";

export type ThemeMode = "light" | "dark";

export type EditorialPalette = {
    background: string;
    pageSection: string;
    surface: string;
    surfaceMuted: string;
    surfaceBright: string;
    surfaceGlass: string;
    inputSurface: string;
    text: string;
    textMuted: string;
    textSoft: string;
    primary: string;
    primaryContainer: string;
    primaryFixed: string;
    onPrimary: string;
    inverseText: string;
    success: string;
    successSoft: string;
    successText: string;
    warning: string;
    warningSoft: string;
    warningText: string;
    danger: string;
    dangerSoft: string;
    dangerText: string;
    info: string;
    infoSoft: string;
    infoText: string;
    outline: string;
    scrim: string;
    shadow: string;
    tabBar: string;
};

const lightPalette: EditorialPalette = {
    background: "#f8f9fa",
    pageSection: "#f3f4f5",
    surface: "#ffffff",
    surfaceMuted: "#edf1f5",
    surfaceBright: "#f8f9fa",
    surfaceGlass: "rgba(255,255,255,0.78)",
    inputSurface: "#e9edf2",
    text: "#10203a",
    textMuted: "#5d6b82",
    textSoft: "#7f8ba0",
    primary: "#0040a1",
    primaryContainer: "#0056d2",
    primaryFixed: "rgba(0,86,210,0.12)",
    onPrimary: "#ffffff",
    inverseText: "#f8f9fa",
    success: "#1b7c54",
    successSoft: "rgba(27,124,84,0.12)",
    successText: "#13553a",
    warning: "#c7851d",
    warningSoft: "rgba(199,133,29,0.12)",
    warningText: "#8c5810",
    danger: "#cf5a41",
    dangerSoft: "rgba(207,90,65,0.12)",
    dangerText: "#953923",
    info: "#0056d2",
    infoSoft: "rgba(0,86,210,0.10)",
    infoText: "#00377f",
    outline: "rgba(195,198,214,0.18)",
    scrim: "rgba(11,22,43,0.34)",
    shadow: "#10203a",
    tabBar: "rgba(248,249,250,0.92)",
};

const darkPalette: EditorialPalette = {
    background: "#07111f",
    pageSection: "#0d1828",
    surface: "#122033",
    surfaceMuted: "#16263c",
    surfaceBright: "#0a1422",
    surfaceGlass: "rgba(18,32,51,0.72)",
    inputSurface: "#192b44",
    text: "#f5f8ff",
    textMuted: "#c4cedd",
    textSoft: "#8ea0bb",
    primary: "#5c96ff",
    primaryContainer: "#7aa8ff",
    primaryFixed: "rgba(92,150,255,0.15)",
    onPrimary: "#051223",
    inverseText: "#07111f",
    success: "#67c896",
    successSoft: "rgba(103,200,150,0.16)",
    successText: "#d8ffe8",
    warning: "#f2b85b",
    warningSoft: "rgba(242,184,91,0.16)",
    warningText: "#fff0d2",
    danger: "#ff8b72",
    dangerSoft: "rgba(255,139,114,0.16)",
    dangerText: "#ffe0d8",
    info: "#7aa8ff",
    infoSoft: "rgba(122,168,255,0.18)",
    infoText: "#eef4ff",
    outline: "rgba(195,198,214,0.12)",
    scrim: "rgba(2,8,23,0.62)",
    shadow: "#020617",
    tabBar: "rgba(10,20,34,0.9)",
};

export function getEditorialPalette(theme: ThemeMode): EditorialPalette {
    return theme === "dark" ? darkPalette : lightPalette;
}

export function getEditorialShadow(
    theme: ThemeMode,
    variant: "card" | "floating" = "card"
): ViewStyle {
    const floating = variant === "floating";

    return {
        shadowColor: theme === "dark" ? "#020617" : "#10203a",
        shadowOffset: {
            width: 0,
            height: floating ? 18 : 10,
        },
        shadowOpacity: theme === "dark" ? (floating ? 0.34 : 0.2) : floating ? 0.1 : 0.06,
        shadowRadius: floating ? 32 : 24,
        elevation: floating ? 18 : 8,
    };
}

export const editorialType = {
    eyebrow: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 1.2,
        textTransform: "uppercase",
    } satisfies TextStyle,
    sectionLabel: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
        letterSpacing: 0.2,
    } satisfies TextStyle,
    title: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "700",
        letterSpacing: -0.2,
    } satisfies TextStyle,
    headline: {
        fontSize: 28,
        lineHeight: 32,
        fontWeight: "800",
        letterSpacing: -0.9,
    } satisfies TextStyle,
    display: {
        fontSize: 48,
        lineHeight: 52,
        fontWeight: "800",
        letterSpacing: -1.8,
    } satisfies TextStyle,
    body: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: "500",
    } satisfies TextStyle,
    meta: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600",
        letterSpacing: 0.1,
    } satisfies TextStyle,
};
