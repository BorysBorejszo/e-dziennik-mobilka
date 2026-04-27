import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import {
    editorialType,
    getEditorialPalette,
    getEditorialShadow,
} from "../../theme/editorial";
import { useTheme } from "../../theme/ThemeContext";

type PanelProps = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

type SectionHeaderProps = {
    eyebrow?: string;
    title: string;
    meta?: string;
};

type StatCardProps = {
    eyebrow: string;
    value: string;
    caption?: string;
    icon: keyof typeof Ionicons.glyphMap;
    tone?: "primary" | "neutral" | "success" | "warning";
    onPress?: () => void;
};

type SegmentedControlOption<T extends string> = {
    key: T;
    label: string;
    count?: number;
};

type SegmentedControlProps<T extends string> = {
    value: T;
    onChange: (next: T) => void;
    options: Array<SegmentedControlOption<T>>;
    labelStyle?: StyleProp<TextStyle>;
};

type SearchFieldProps = Omit<TextInputProps, "onChangeText" | "value"> & {
    value: string;
    onChangeText: (text: string) => void;
};

type RowCardProps = {
    title: string;
    subtitle?: string;
    meta?: string;
    badge?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    tone?: "primary" | "success" | "warning" | "danger" | "neutral";
    onPress?: () => void;
    children?: React.ReactNode;
};

function getToneColors(
    tone: "primary" | "success" | "warning" | "danger" | "neutral",
    palette: ReturnType<typeof getEditorialPalette>
) {
    switch (tone) {
        case "primary":
            return {
                soft: palette.primaryFixed,
                text: palette.infoText,
                icon: palette.primary,
            };
        case "success":
            return {
                soft: palette.successSoft,
                text: palette.successText,
                icon: palette.success,
            };
        case "warning":
            return {
                soft: palette.warningSoft,
                text: palette.warningText,
                icon: palette.warning,
            };
        case "danger":
            return {
                soft: palette.dangerSoft,
                text: palette.dangerText,
                icon: palette.danger,
            };
        default:
            return {
                soft: palette.pageSection,
                text: palette.textMuted,
                icon: palette.textSoft,
            };
    }
}

export function EditorialPanel({ children, style }: PanelProps) {
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    return (
        <View
            style={[
                styles.panel,
                {
                    backgroundColor: palette.surface,
                },
                getEditorialShadow(theme),
                style,
            ]}
        >
            {children}
        </View>
    );
}

export function EditorialSectionHeader({
    eyebrow,
    title,
    meta,
}: SectionHeaderProps) {
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    return (
        <View style={styles.sectionHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
                {eyebrow ? (
                    <Text
                        style={[editorialType.eyebrow, { color: palette.textSoft }]}
                    >
                        {eyebrow}
                    </Text>
                ) : null}
                <Text
                    style={[
                        editorialType.headline,
                        { color: palette.text, marginTop: eyebrow ? 6 : 0 },
                    ]}
                >
                    {title}
                </Text>
            </View>
            {meta ? (
                <View
                    style={[
                        styles.metaBadge,
                        { backgroundColor: palette.primaryFixed },
                    ]}
                >
                    <Text style={[editorialType.meta, { color: palette.infoText }]}>
                        {meta}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

export function EditorialStatCard({
    eyebrow,
    value,
    caption,
    icon,
    tone = "neutral",
    onPress,
}: StatCardProps) {
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);
    const colors = getToneColors(tone, palette);
    const content = (
        <EditorialPanel style={styles.statCard}>
            <View
                style={[
                    styles.statIconWrap,
                    { backgroundColor: colors.soft },
                ]}
            >
                <Ionicons name={icon} size={20} color={colors.icon} />
            </View>
            <Text style={[editorialType.meta, { color: palette.textSoft, marginTop: 14 }]}>
                {eyebrow}
            </Text>
            <Text style={[editorialType.headline, { color: palette.text, marginTop: 4 }]}>
                {value}
            </Text>
            {caption ? (
                <Text
                    style={[
                        editorialType.body,
                        { color: palette.textMuted, marginTop: 8 },
                    ]}
                >
                    {caption}
                </Text>
            ) : null}
        </EditorialPanel>
    );

    if (!onPress) return content;

    return (
        <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
            {content}
        </TouchableOpacity>
    );
}

export function EditorialSegmentedControl<T extends string>({
    value,
    onChange,
    options,
    labelStyle,
}: SegmentedControlProps<T>) {
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    return (
        <View
            style={[
                styles.segmentedShell,
                {
                    backgroundColor: palette.pageSection,
                },
            ]}
        >
            {options.map((option) => {
                const active = option.key === value;

                return (
                    <TouchableOpacity
                        key={option.key}
                        onPress={() => onChange(option.key)}
                        style={[
                            styles.segmentedPill,
                            active ? { backgroundColor: palette.primary } : null,
                        ]}
                        activeOpacity={0.9}
                    >
                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.88}
                            style={[
                                editorialType.meta,
                                {
                                    color: active ? palette.onPrimary : palette.textMuted,
                                },
                                labelStyle,
                            ]}
                        >
                            {option.label}
                            {typeof option.count === "number"
                                ? ` (${option.count})`
                                : ""}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export function EditorialSearchField({
    value,
    onChangeText,
    placeholder,
    ...rest
}: SearchFieldProps) {
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    return (
        <View
            style={[
                styles.searchWrap,
                {
                    backgroundColor: palette.pageSection,
                },
            ]}
        >
            <Ionicons name="search-outline" size={18} color={palette.textSoft} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={palette.textSoft}
                style={[
                    styles.searchInput,
                    {
                        color: palette.text,
                    },
                ]}
                {...rest}
            />
            {value ? (
                <TouchableOpacity onPress={() => onChangeText("")}>
                    <Ionicons
                        name="close-circle"
                        size={18}
                        color={palette.textSoft}
                    />
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

export function EditorialRowCard({
    title,
    subtitle,
    meta,
    badge,
    icon = "ellipse",
    tone = "neutral",
    onPress,
    children,
}: RowCardProps) {
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);
    const colors = getToneColors(tone, palette);
    const content = (
        <EditorialPanel>
            <View style={styles.rowCard}>
                <View
                    style={[
                        styles.rowIcon,
                        {
                            backgroundColor: colors.soft,
                        },
                    ]}
                >
                    <Ionicons name={icon} size={18} color={colors.icon} />
                </View>

                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={[editorialType.title, { color: palette.text }]}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text
                            style={[
                                editorialType.body,
                                { color: palette.textMuted, marginTop: 6 },
                            ]}
                        >
                            {subtitle}
                        </Text>
                    ) : null}
                    {children}
                </View>

                <View style={{ alignItems: "flex-end" }}>
                    {badge ? (
                        <View
                            style={[
                                styles.badge,
                                {
                                    backgroundColor: colors.soft,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    editorialType.meta,
                                    { color: colors.text },
                                ]}
                            >
                                {badge}
                            </Text>
                        </View>
                    ) : null}
                    {meta ? (
                        <Text
                            style={[
                                editorialType.meta,
                                {
                                    color: palette.textSoft,
                                    marginTop: badge ? 10 : 0,
                                },
                            ]}
                        >
                            {meta}
                        </Text>
                    ) : null}
                </View>
            </View>
        </EditorialPanel>
    );

    if (!onPress) return content;

    return (
        <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
            {content}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    panel: {
        borderRadius: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    metaBadge: {
        minWidth: 56,
        minHeight: 56,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    statCard: {
        minHeight: 176,
        paddingHorizontal: 18,
        paddingVertical: 18,
    },
    statIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    segmentedShell: {
        flexDirection: "row",
        borderRadius: 22,
        padding: 5,
        gap: 6,
    },
    segmentedPill: {
        flex: 1,
        minHeight: 44,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    searchWrap: {
        minHeight: 54,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontWeight: "500",
        paddingVertical: 0,
    },
    rowCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 18,
    },
    rowIcon: {
        width: 46,
        height: 46,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    badge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
});
