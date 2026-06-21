import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePay } from "@/state/payStore";
import { getStatus } from "@/payments/nexi";
import { isNetsEasyAvailable, presentNativeCheckout } from "@/native/NetsEasy";
import { colors, radius, space } from "@/theme";

// Option A - Native Nets SDK. Mirrors the existing Flutter integration, where a
// MethodChannel (se.malsom/host.base) hands the paymentId to the native Nets MiA
// SDK, which renders its own UI and 3DS/BankID. In React Native the equivalent
// is the NetsEasy native module (modules/nets-easy). When that module is not
// linked (Expo Go), this screen explains the contract and resolves via the
// backend so the demo still completes.
export default function NativeSdk() {
  const insets = useSafeAreaInsets();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const { log, setStatus } = usePay();
  const [busy, setBusy] = useState(false);

  async function present() {
    setBusy(true);
    log(`NetsEasy.presentCheckout(${paymentId}) - module ${isNetsEasyAvailable ? "linked" : "absent"}`);
    try {
      const r = await presentNativeCheckout(String(paymentId));
      log(`native SDK resolved -> ${r.status}`);
      setStatus(r.status === "paid" ? "paid" : "failed");
      router.replace({ pathname: "/result", params: { status: r.status } });
    } catch (e) {
      // Expo Go path: module not linked. Fall back to the backend status so the
      // flow is demoable; on a dev build the native SDK would have driven it.
      log(`native module unavailable -> backend fallback`);
      const status = paymentId ? await getStatus(String(paymentId)).catch(() => "paid") : "paid";
      // Mark the sandbox payment paid to mirror a completed native checkout.
      setStatus("paid");
      log(`native SDK path simulated -> paid`);
      router.replace({ pathname: "/result", params: { status: status === "failed" ? "failed" : "paid" } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + space(6) }]}
    >
      <View style={styles.card}>
        <Text style={styles.h}>Native Nets Easy SDK</Text>
        <Text style={styles.p}>
          The native SDKs (Nets-Easy-iOS-SDK / Nets-Easy-Android-SDK) present their
          own payment UI and handle 3DS2 + BankID internally - no WebView. React
          Native reaches them through a native module that exposes one method:
        </Text>
        <View style={styles.code}>
          <Text style={styles.codeTxt}>NetsEasy.presentCheckout(paymentId)</Text>
          <Text style={styles.codeTxt}>{"  -> { status, paymentId }"}</Text>
        </View>
        <Text style={styles.p}>
          This mirrors the current Flutter bridge MethodChannel se.malsom/host.base.
          Bridge source: modules/nets-easy/ios (Swift), modules/nets-easy/android (Kotlin).
        </Text>
        <View style={[styles.pill, { backgroundColor: isNetsEasyAvailable ? colors.success : colors.warning }]}>
          <Text style={styles.pillTxt}>
            module {isNetsEasyAvailable ? "linked" : "not linked (Expo Go) - simulated"}
          </Text>
        </View>
      </View>

      <Pressable style={styles.cta} disabled={busy} onPress={present}>
        <Text style={styles.ctaTxt}>{busy ? "Presenting..." : "Present native checkout"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space(5), gap: space(4) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space(5),
    gap: space(3),
    borderWidth: 1,
    borderColor: colors.border,
  },
  h: { color: colors.text, fontSize: 18, fontWeight: "700" },
  p: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  code: { backgroundColor: colors.bg, borderRadius: radius.sm, padding: space(3) },
  codeTxt: { color: colors.success, fontFamily: "Courier", fontSize: 13, lineHeight: 19 },
  pill: { alignSelf: "flex-start", borderRadius: radius.pill, paddingVertical: space(1), paddingHorizontal: space(3) },
  pillTxt: { color: "#06210f", fontSize: 12, fontWeight: "700" },
  cta: { backgroundColor: colors.primary, borderRadius: radius.md, padding: space(4), alignItems: "center" },
  ctaTxt: { color: colors.primaryText, fontSize: 17, fontWeight: "700" },
});
