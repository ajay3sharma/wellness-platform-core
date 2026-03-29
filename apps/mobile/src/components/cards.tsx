import { StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "../metadata";

export function ContentCard({
  title,
  meta,
  description
}: {
  title: string;
  meta: string;
  description: string;
}) {
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
  subtitle
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerOrb} />
      <Text style={styles.bannerTitle}>{title}</Text>
      <Text style={styles.bannerSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(18, 32, 54, 0.08)",
    gap: 6
  },
  meta: {
    fontSize: 12,
    color: mobileTheme.colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  title: {
    fontSize: 16,
    color: "#122036",
    fontWeight: "700"
  },
  description: {
    fontSize: 13,
    color: "#5B6576",
    lineHeight: 18
  },
  banner: {
    borderRadius: 28,
    padding: 18,
    overflow: "hidden",
    backgroundColor: "#122036",
    gap: 6
  },
  bannerOrb: {
    position: "absolute",
    right: -28,
    top: -28,
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.accent,
    opacity: 0.22
  },
  bannerTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: "#FFFFFF",
    fontWeight: "700",
    maxWidth: 260
  },
  bannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.8)",
    maxWidth: 280
  }
});

