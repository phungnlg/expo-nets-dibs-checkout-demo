import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePay } from "@/state/payStore";
import { getStatus } from "@/payments/nexi";
import { colors, radius, space } from "@/theme";

export default function Result() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ status: string }>();
  const { paymentId, amount, currency, integration, trace, reset } = usePay();
  const [confirmed, setConfirmed] = useState<string>(params.status ?? "pending");

  useEffect(() => {
    let alive = true;
    if (!paymentId) return;
    getStatus(paymentId).then((s) => alive && setConfirmed(s)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [paymentId]);

  const paid = confirmed === "paid";

  function done() {
    reset();
    router.dismissAll();
    router.replace("/");
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + space(6) }]}
    >
      <View style={[styles.icon, { backgroundColor: paid ? colors.success : colors.danger }]}>
        <Text style={styles.iconTxt}>{paid ? "✓" : "✕"}</Text>
      </View>
      <Text style={styles.title}>{paid ? "Payment approved" : "Payment failed"}</Text>
      <Text style={styles.sub}>
        {paid
          ? `${amount.toLocaleString("sv-SE")} ${currency} charged via Nets/DIBS Checkout.`
          : "The payment was not completed."}
      </Text>

      <View style={styles.card}>
        <Row k="Payment id" v={paymentId ?? "-"} />
        <Row k="Integration" v={integration === "checkout-js" ? "Checkout JS (WebView)" : "Native Nets SDK"} />
        <Row k="Backend status" v={confirmed} />
      </View>

      <Text style={styles.traceTitle}>3DS / BankID trace</Text>
      <View style={styles.card}>
        {trace.length === 0 ? (
          <Text style={styles.traceLine}>no events</Text>
        ) : (
          trace.map((t, i) => (
            <Text key={i} style={styles.traceLine}>
              {i + 1}. {t}
            </Text>
          ))
        )}
      </View>

      <Pressable style={styles.cta} onPress={done}>
        <Text style={styles.ctaTxt}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowK}>{k}</Text>
      <Text style={styles.rowV}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space(5), alignItems: "center", gap: space(3) },
  icon: { width: 72, height: 72, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", marginTop: space(4) },
  iconTxt: { color: "#fff", fontSize: 38, fontWeight: "800" },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" },
  sub: { color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 21 },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space(4),
    gap: space(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowK: { color: colors.textMuted, fontSize: 14 },
  rowV: { color: colors.text, fontSize: 14, fontWeight: "600", maxWidth: "62%", textAlign: "right" },
  traceTitle: { alignSelf: "flex-start", color: colors.textMuted, fontSize: 13, fontWeight: "600", marginTop: space(2) },
  traceLine: { color: colors.text, fontSize: 13, fontFamily: "Courier", lineHeight: 20 },
  cta: { width: "100%", backgroundColor: colors.primary, borderRadius: radius.md, padding: space(4), alignItems: "center", marginTop: space(4) },
  ctaTxt: { color: colors.primaryText, fontSize: 17, fontWeight: "700" },
});
