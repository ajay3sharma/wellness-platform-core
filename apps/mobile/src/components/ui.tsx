import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ComponentProps, ReactNode } from "react";
import { mobileTheme } from "../metadata";

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Surface({
  children,
  compact = false
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return <View style={[styles.surface, compact && styles.surfaceCompact]}>{children}</View>;
}

export function SectionTitle({
  title,
  eyebrow,
  subtitle
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
}) {
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
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHint}>{hint}</Text>
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === "secondary" && styles.actionButtonSecondary,
        disabled && styles.actionButtonDisabled,
        pressed && styles.actionButtonPressed
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
  return (
    <TextInput
      placeholderTextColor={mobileTheme.colors.secondary}
      {...props}
      style={[styles.textField, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    backgroundColor: mobileTheme.colors.surface
  },
  surface: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#F9F7F1",
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.08)",
    shadowColor: "#1F2937",
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4
  },
  surfaceCompact: {
    padding: 14
  },
  sectionTitle: {
    gap: 4,
    marginBottom: 12
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 11,
    color: mobileTheme.colors.primary,
    fontWeight: "700"
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: "#122036",
    fontWeight: "700"
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: "#56657A"
  },
  metricCard: {
    flex: 1,
    minWidth: "30%",
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(18, 32, 54, 0.06)"
  },
  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#122036",
    marginBottom: 6
  },
  metricHint: {
    fontSize: 12,
    color: "#6B7280"
  },
  actionButton: {
    borderRadius: 18,
    backgroundColor: mobileTheme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center"
  },
  actionButtonSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(18, 32, 54, 0.12)"
  },
  actionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }]
  },
  actionButtonDisabled: {
    opacity: 0.55
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700"
  },
  actionButtonTextSecondary: {
    color: "#122036"
  },
  actionButtonTextDisabled: {
    color: "#465363"
  },
  textField: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(18, 32, 54, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#122036"
  }
});
