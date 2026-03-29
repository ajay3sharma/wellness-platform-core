import type { ConfigContext, ExpoConfig } from "expo/config";
import { getBrandPack, getBrandMetadata } from "@platform/brand";
import { platformConfig, runtimeEnv } from "@platform/config";
import { createSurfaceTheme } from "@platform/ui";

export default ({ config }: ConfigContext): ExpoConfig => {
  const brand = getBrandPack();
  const metadata = getBrandMetadata("mobile");
  const theme = createSurfaceTheme(brand, "mobile");

  return {
    ...config,
    name: metadata.appName,
    slug: brand.key,
    scheme: runtimeEnv.mobileScheme,
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    platforms: ["ios", "android", "web"],
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: true
    },
    ios: {
      bundleIdentifier: `com.${brand.key}.mobile`,
      supportsTablet: false
    },
    android: {
      package: `com.${brand.key}.mobile`
    },
    web: {
      bundler: "metro"
    },
    extra: {
      brand: brand.key,
      productName: metadata.appName,
      appMetadata: metadata,
      apiUrl: platformConfig.services.mobile.apiUrl,
      theme: theme.colors
    }
  };
};
