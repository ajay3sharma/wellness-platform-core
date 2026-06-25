import { useEffect, useMemo, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { getRouteTheme } from "@platform/ui";
import type { BrandRouteThemeKey } from "@platform/types";
import { useThemeMode } from "../theme/theme-context";

const displayFontFamily = Platform.select({
  ios: "System",
  android: "sans-serif-medium",
  default: undefined
});

function useCardStyles(routeTheme: BrandRouteThemeKey = "home") {
  const { theme, mode } = useThemeMode();
  const route = getRouteTheme(theme.routeThemes, routeTheme);

  return useMemo(() => {
    const isDark = mode === "dark";

    return StyleSheet.create({
      card: {
        borderRadius: 24,
        padding: 16,
        backgroundColor: isDark ? theme.colors.surface : route.background,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        gap: 7,
        shadowColor: "#000000",
        shadowOpacity: isDark ? 0.2 : 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 4, height: 6 },
        elevation: 3
      },
      meta: {
        alignSelf: "flex-start",
        fontSize: 12,
        color: route.primaryStrong,
        fontWeight: "800",
        letterSpacing: 0.5,
        textTransform: "uppercase"
      },
      title: {
        fontSize: 17,
        lineHeight: 22,
        color: theme.colors.textStrong,
        fontWeight: "700",
        fontFamily: displayFontFamily
      },
      description: {
        fontSize: 14,
        lineHeight: 21,
        color: theme.colors.textMuted
      },
      banner: {
        gap: 8,
        padding: 20,
        borderRadius: 30,
        backgroundColor: isDark ? theme.colors.surfaceRaised : route.background,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        shadowColor: "#000000",
        shadowOpacity: isDark ? 0.24 : 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 5, height: 8 },
        elevation: 4
      },
      bannerGlowLarge: {
        display: "none"
      },
      bannerGlowSmall: {
        display: "none"
      },
      bannerEyebrow: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: 0.8,
        textTransform: "uppercase"
      },
      bannerTitle: {
        fontSize: 30,
        lineHeight: 37,
        color: theme.colors.textStrong,
        fontWeight: "300",
        fontFamily: displayFontFamily,
        maxWidth: 310
      },
      bannerSubtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: theme.colors.textMuted,
        maxWidth: 320
      }
    });
  }, [mode, route, theme]);
}

function useBannerEntrance() {
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

export function ContentCard({
  title,
  meta,
  description,
  routeTheme = "home"
}: {
  title: string;
  meta: string;
  description: string;
  routeTheme?: BrandRouteThemeKey;
}) {
  const styles = useCardStyles(routeTheme);

  return (
    <View style={styles.card}>
      <Text style={styles.meta}>{meta}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

export function AccentBanner({
  title,
  subtitle,
  routeTheme = "home"
}: {
  title: string;
  subtitle: string;
  routeTheme?: BrandRouteThemeKey;
}) {
  const styles = useCardStyles(routeTheme);
  const animatedStyle = useBannerEntrance();

  return (
    <Animated.View style={[styles.banner, animatedStyle]}>
      <Text style={styles.bannerEyebrow}>Today</Text>
      <Text style={styles.bannerTitle}>{title}</Text>
      <Text style={styles.bannerSubtitle}>{subtitle}</Text>
    </Animated.View>
  );
}
