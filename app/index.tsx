import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePay, type Integration, type PayMethod } from "@/state/payStore";
import { createPayment } from "@/payments/nexi";
import { isNetsEasyAvailable } from "@/native/NetsEasy";
import { colors, radius, space } from "@/theme";

const METHODS: { key: PayMethod; label: string; sub: string }[] = [
  { key: "card", label: "Card", sub: "Visa / Mastercard - 3DS2 + BankID" },
  { key: "applepay", label: "Apple Pay", sub: "Face ID" },
  { key: "googlepay", label: "Google Pay", sub: "Android" },
];

const OPTIONS: { key: Integration; label: string; sub: string }[] = [
  { key: "checkout-js", label: "Checkout JS SDK", sub: "Hosted page in WebView (Option B)" },
  { key: "native-sdk", label: "Native Nets SDK", sub: "Native module bridge (Option A)" },
];

export default function PaySetup() {
  const insets = useSafeAreaInsets();
  const { amount, currency, method, integration, setMethod, setIntegration, setPayment, reset, log } = usePay();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      reset();
      const { paymentId, checkoutUrl } = await createPayment({ amount, currency, method });
      setPayment(paymentId);
      log(`payment created: ${paymentId}`);
      log(`integration: ${integration}`);
      if (integration === "checkout-js") {
        router.push({ pathname: "/checkout", params: { url: checkoutUrl } });
      } else {
        router.push({ pathname: "/native-sdk", params: { paymentId } });
      }
    } catch {
      setError("Cannot reach the payment backend. Is the sandbox server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + space(6) }]}
    >
      <View style={styles.amountCard}>
        <Text style={styles.muted}>Amount to pay</Text>
        <Text style={styles.amount}>
          {amount.toLocaleString("sv-SE")} <Text style={styles.cur}>{currency}</Text>
        </Text>
        <Text style={styles.muted}>Nets/DIBS Checkout - final step of the transfer</Text>
      </View>

      <Text style={styles.label}>Payment method</Text>
      {METHODS.map((m) => {
        const on = m.key === method;
        return (
          <Pressable key={m.key} onPress={() => setMethod(m.key)} style={[styles.row, on && styles.rowOn]}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{m.label}</Text>
              <Text style={styles.rowSub}>{m.sub}</Text>
            </View>
            <View style={[styles.radio, on && styles.radioOn]} />
          </Pressable>
        );
      })}

      <Text style={styles.label}>Integration option</Text>
      {OPTIONS.map((o) => {
        const on = o.key === integration;
        return (
          <Pressable key={o.key} onPress={() => setIntegration(o.key)} style={[styles.row, on && styles.rowOn]}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{o.label}</Text>
              <Text style={styles.rowSub}>{o.sub}</Text>
            </View>
            <View style={[styles.radio, on && styles.radioOn]} />
          </Pressable>
        );
      })}
      {integration === "native-sdk" && (
        <Text style={styles.hint}>
          Native module {isNetsEasyAvailable ? "linked" : "not linked in Expo Go"} - the path
          shows the bridge contract and the SDK hand-off.
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={[styles.cta, busy && styles.ctaOff]} disabled={busy} onPress={pay}>
        {busy ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.ctaTxt}>Pay now</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space(5), gap: space(2) },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space(5),
    gap: space(1),
    borderWidth: 1,
    borderColor: colors.border,
  },
  muted: { color: colors.textMuted, fontSize: 13 },
  amount: { color: colors.text, fontSize: 38, fontWeight: "700", marginVertical: space(1) },
  cur: { color: colors.textMuted, fontSize: 20, fontWeight: "700" },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: "600", marginTop: space(4), marginBottom: space(1) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space(4),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space(2),
  },
  rowOn: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  rowText: { flex: 1, paddingRight: space(3) },
  rowLabel: { color: colors.text, fontSize: 16, fontWeight: "600" },
  rowSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  hint: { color: colors.warning, fontSize: 12, lineHeight: 17, marginTop: -space(1), marginBottom: space(1) },
  error: { color: colors.danger, fontSize: 13, marginTop: space(2) },
  cta: { backgroundColor: colors.primary, borderRadius: radius.md, padding: space(4), alignItems: "center", marginTop: space(5) },
  ctaOff: { opacity: 0.6 },
  ctaTxt: { color: colors.primaryText, fontSize: 17, fontWeight: "700" },
});
