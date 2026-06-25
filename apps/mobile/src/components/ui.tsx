import { useEffect, useMemo, useRef, type ComponentProps, type ReactNode } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { getNextThemeMode, getRouteTheme } from "@platform/ui";
import type { BrandRouteThemeKey } from "@platform/types";
import { useThemeMode } from "../theme/theme-context";

type BannerTone = "neutral" | "danger" | "success";

const displayFontFamily = Platform.select({
  ios: "System",
  android: "sans-serif-medium",
  default: undefined
});

const bodyFontFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: undefined
});

function useUiStyles(routeTheme: BrandRouteThemeKey = "home") {
  const { theme, mode } = useThemeMode();
  const route = getRouteTheme(theme.routeThemes, routeTheme);

  return useMemo(() => {
    const isDark = mode === "dark";

    return StyleSheet.create({
      screen: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: theme.spacing.xl,
        backgroundColor: isDark ? theme.colors.canvas : route.backgroundSoft
      },
      surface: {
        borderRadius: 28,
        padding: 18,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        shadowColor: "#000000",
        shadowOpacity: isDark ? 0.24 : 0.1,
        shadowRadius: 18,
        shadowOffset: { width: 6, height: 8 },
        elevation: 4
      },
      surfaceCompact: {
        padding: 14
      },
      surfaceGlass: {
        backgroundColor: theme.colors.surfaceGlass,
        borderColor: theme.colors.borderSoft
      },
      surfaceAccent: {
        backgroundColor: isDark ? route.background : route.background,
        borderColor: route.primary
      },
      sectionTitle: {
        gap: 6,
        marginBottom: 14
      },
      eyebrow: {
        alignSelf: "flex-start",
        fontSize: 13,
        color: theme.colors.primary,
        fontWeight: "800",
        letterSpacing: 0.8,
        textTransform: "uppercase"
      },
      title: {
        fontSize: 30,
        lineHeight: 37,
        color: theme.colors.textStrong,
        fontWeight: "300",
        fontFamily: displayFontFamily
      },
      subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: theme.colors.textMuted,
        fontFamily: bodyFontFamily
      },
      metricCard: {
        flex: 1,
        minWidth: "30%",
        borderRadius: 24,
        padding: 16,
        backgroundColor: isDark ? route.background : route.background,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        shadowColor: "#000000",
        shadowOpacity: isDark ? 0.2 : 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 4, height: 6 },
        elevation: 3
      },
      metricLabel: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginBottom: 6,
        fontWeight: "600"
      },
      metricValue: {
        fontSize: 28,
        fontWeight: "800",
        color: theme.colors.textStrong,
        marginBottom: 6,
        fontFamily: displayFontFamily
      },
      metricHint: {
        fontSize: 13,
        lineHeight: 19,
        color: theme.colors.textMuted
      },
      badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: theme.colors.secondary,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft
      },
      badgeAccent: {
        backgroundColor: route.background,
        borderColor: route.primary
      },
      badgeDanger: {
        backgroundColor: `${theme.colors.danger}1A`,
        borderColor: `${theme.colors.danger}33`
      },
      badgeText: {
        color: theme.colors.textStrong,
        fontSize: 12,
        fontWeight: "700"
      },
      badgeTextAccent: {
        color: route.primaryStrong
      },
      badgeTextDanger: {
        color: theme.colors.danger
      },
      choiceChip: {
        minHeight: 38,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        backgroundColor: theme.colors.surface,
        shadowColor: "#000000",
        shadowOpacity: isDark ? 0.12 : 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 2, height: 3 },
        elevation: 2
      },
      choiceChipSelected: {
        backgroundColor: route.primary,
        borderColor: route.primaryStrong
      },
      choiceChipText: {
        color: theme.colors.textStrong,
        fontWeight: "600"
      },
      choiceChipTextSelected: {
        color: theme.colors.textOnPrimary
      },
      statusBanner: {
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        backgroundColor: isDark ? theme.colors.surfaceRaised : route.background
      },
      statusBannerDanger: {
        backgroundColor: `${theme.colors.danger}12`,
        borderColor: `${theme.colors.danger}33`
      },
      statusBannerSuccess: {
        backgroundColor: `${theme.colors.success}14`,
        borderColor: `${theme.colors.success}33`
      },
      statusBannerText: {
        color: theme.colors.textMuted,
        lineHeight: 20
      },
      statusBannerTextDanger: {
        color: theme.colors.danger
      },
      statusBannerTextSuccess: {
        color: theme.colors.success
      },
      emptyTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: theme.colors.textStrong,
        marginBottom: 6
      },
      emptyDescription: {
        color: theme.colors.textMuted,
        lineHeight: 21
      },
      actionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10
      },
      actionButton: {
        minHeight: 48,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary,
        borderWidth: 1,
        borderColor: theme.colors.primaryStrong,
        shadowColor: "#000000",
        shadowOpacity: isDark ? 0.24 : 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 4, height: 6 },
        elevation: 3
      },
      actionButtonSecondary: {
        backgroundColor: route.background,
        borderColor: route.primary
      },
      actionButtonDisabled: {
        opacity: 0.48
      },
      actionButtonText: {
        color: theme.colors.textOnPrimary,
        fontWeight: "700",
        fontSize: 16
      },
      actionButtonTextSecondary: {
        color: theme.colors.textStrong
      },
      actionButtonTextDisabled: {
        color: theme.colors.textMuted
      },
      textField: {
        width: "100%",
        minHeight: 46,
        paddingHorizontal: 12,
        paddingVertical: 11,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        backgroundColor: theme.colors.surface,
        color: theme.colors.textStrong,
        fontFamily: bodyFontFamily,
        shadowColor: "#000000",
        shadowOpacity: isDark ? 0.14 : 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 2, height: 3 },
        elevation: 1
      },
      themeToggle: {
        flexDirection: "row",
        alignSelf: "flex-start",
        borderRadius: 999,
        padding: 2,
        backgroundColor: route.background,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft
      },
      themeToggleButton: {
        minWidth: 62,
        minHeight: 32,
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999
      },
      themeToggleButtonActive: {
        backgroundColor: theme.colors.surface,
        shadowColor: "#000000",
        shadowOpacity: isDark ? 0.14 : 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 2, height: 3 },
        elevation: 2
      },
      themeToggleLabel: {
        color: theme.colors.textMuted,
        fontWeight: "700",
        fontSize: 13
      },
      themeToggleLabelActive: {
        color: theme.colors.textStrong
      }
    });
  }, [mode, route, theme]);
}

function useSurfaceEntrance() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const { theme } = useThemeMode();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.motion.baseMs,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: theme.motion.slowMs,
        useNativeDriver: true
      })
    ]).start();
  }, [opacity, theme.motion.baseMs, theme.motion.slowMs, translateY]);

  return {
    opacity,
    transform: [{ translateY }]
  };
}

export function Screen({
  children,
  routeTheme = "home"
}: {
  children: ReactNode;
  routeTheme?: BrandRouteThemeKey;
}) {
  const styles = useUiStyles(routeTheme);

  return <View style={styles.screen}>{children}</View>;
}

export function Surface({
  children,
  compact = false,
  tone = "default",
  routeTheme = "home"
}: {
  children: ReactNode;
  compact?: boolean;
  tone?: "default" | "glass" | "accent";
  routeTheme?: BrandRouteThemeKey;
}) {
  const styles = useUiStyles(routeTheme);
  const animatedStyle = useSurfaceEntrance();

  return (
    <Animated.View
      style={[
        styles.surface,
        compact && styles.surfaceCompact,
        tone === "glass" && styles.surfaceGlass,
        tone === "accent" && styles.surfaceAccent,
        animatedStyle
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function SectionTitle({
  title,
  eyebrow,
  subtitle,
  routeTheme = "home"
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  routeTheme?: BrandRouteThemeKey;
}) {
  const styles = useUiStyles(routeTheme);

  return (
    <View style={styles.sectionTitle}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  routeTheme = "home"
}: {
  label: string;
  value: string;
  hint: string;
  routeTheme?: BrandRouteThemeKey;
}) {
  const styles = useUiStyles(routeTheme);

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHint}>{hint}</Text>
    </View>
  );
}

export function Badge({
  label,
  tone = "soft",
  routeTheme = "home"
}: {
  label: string;
  tone?: "soft" | "accent" | "danger";
  routeTheme?: BrandRouteThemeKey;
}) {
  const styles = useUiStyles(routeTheme);

  return (
    <View
      style={[
        styles.badge,
        tone === "accent" && styles.badgeAccent,
        tone === "danger" && styles.badgeDanger
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          tone === "accent" && styles.badgeTextAccent,
          tone === "danger" && styles.badgeTextDanger
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function ChoiceChip({
  label,
  selected,
  onPress,
  routeTheme = "home"
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  routeTheme?: BrandRouteThemeKey;
}) {
  const styles = useUiStyles(routeTheme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceChip,
        selected && styles.choiceChipSelected,
        pressed && {
          transform: [{ scale: 0.98 }]
        }
      ]}
    >
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function StatusBanner({
  children,
  tone = "neutral",
  routeTheme = "home"
}: {
  children: ReactNode;
  tone?: BannerTone;
  routeTheme?: BrandRouteThemeKey;
}) {
  const styles = useUiStyles(routeTheme);

  return (
    <View
      style={[
        styles.statusBanner,
        tone === "danger" && styles.statusBannerDanger,
        tone === "success" && styles.statusBannerSuccess
      ]}
    >
      <Text
        style={[
          styles.statusBannerText,
          tone === "danger" && styles.statusBannerTextDanger,
          tone === "success" && styles.statusBannerTextSuccess
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  const styles = useUiStyles();

  return (
    <Surface compact>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </Surface>
  );
}

export function ActionRow({ children }: { children: ReactNode }) {
  const styles = useUiStyles();

  return <View style={styles.actionRow}>{children}</View>;
}

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  routeTheme = "home"
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  routeTheme?: BrandRouteThemeKey;
}) {
  const styles = useUiStyles(routeTheme);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === "secondary" && styles.actionButtonSecondary,
        disabled && styles.actionButtonDisabled,
        pressed && {
          transform: [{ scale: 0.985 }]
        }
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          variant === "secondary" && styles.actionButtonTextSecondary,
          disabled && styles.actionButtonTextDisabled
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function TextField(props: ComponentProps<typeof TextInput>) {
  const styles = useUiStyles();
  const { theme } = useThemeMode();

  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      {...props}
      style={[styles.textField, props.style]}
    />
  );
}

export function ThemeModeToggle() {
  const styles = useUiStyles();
  const { mode, setMode } = useThemeMode();

  return (
    <View style={styles.themeToggle}>
      {(["light", "dark"] as const).map((nextMode) => {
        const active = mode === nextMode;

        return (
          <Pressable
            accessibilityLabel={`${nextMode} mode`}
            accessibilityRole="button"
            key={nextMode}
            onPress={() => setMode(nextMode)}
            style={({ pressed }) => [
              styles.themeToggleButton,
              active && styles.themeToggleButtonActive,
              pressed && !active && { transform: [{ scale: 0.99 }] }
            ]}
          >
            <Text style={[styles.themeToggleLabel, active && styles.themeToggleLabelActive]}>
              {nextMode === "light" ? "Light" : "Dark"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ThemeModeQuickToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <ActionButton
      label={mode === "light" ? "Switch to dark" : "Switch to light"}
      onPress={() => setMode(getNextThemeMode(mode))}
      variant="secondary"
    />
  );
}
