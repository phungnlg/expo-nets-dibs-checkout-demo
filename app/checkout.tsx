import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useRef } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePay } from "@/state/payStore";
import { isBankIdUrl, isReturnUrl, parseReturnStatus } from "@/payments/nexi";
import { colors, space } from "@/theme";

// Option B - Checkout JS SDK in a WebView. The screen hosts the Nets/DIBS
// Checkout page and routes the two URLs the WebView cannot handle itself:
// the BankID app-switch and the final return URL.
export default function Checkout() {
  const insets = useSafeAreaInsets();
  const { url } = useLocalSearchParams<{ url: string }>();
  const { log, setStatus } = usePay();
  const handled = useRef(false);

  function onShouldStart(req: WebViewNavigation): boolean {
    const target = req.url;

    if (isBankIdUrl(target)) {
      log("intercepted BankID app-switch -> Linking.openURL");
      Linking.openURL(target).catch(() =>
        Alert.alert(
          "BankID",
          "BankID app-switch fired (bankid://). On a device with BankID this opens the app; continue in the sandbox to simulate the signed return."
        )
      );
      return false;
    }

    if (isReturnUrl(target)) {
      if (handled.current) return false;
      handled.current = true;
      const status = parseReturnStatus(target);
      log(`intercepted return URL -> status=${status}`);
      setStatus(status);
      router.replace({ pathname: "/result", params: { status } });
      return false;
    }

    return true;
  }

  if (!url) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>Missing checkout URL.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { paddingBottom: insets.bottom }]}>
      <WebView
        source={{ uri: url }}
        originWhitelist={["https://*", "http://*", "bankid://*", "nets3ds://*"]}
        onShouldStartLoadWithRequest={onShouldStart}
        onNavigationStateChange={(nav) => onShouldStart(nav)}
        // The Nexi Checkout iframe sets a session cookie; without these it stalls
        // on the SDK skeleton in WKWebView (iOS ITP) and Android.
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        style={styles.fill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#F1F4F9" },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: space(5),
  },
  err: { color: colors.danger, fontSize: 14 },
});
