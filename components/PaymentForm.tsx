import Button from "@/components/ui/Button";
import InputNumber from "@/components/ui/InputNumber";
import ModalWindow from "@/components/ui/ModalWindow";
import { Colors, Fonts, NATIVE_CURRENCIES } from "@/constants";
import { useApi } from "@/hooks/useApi";
import { useServerRegistry } from "@/hooks/useServerRegistry";
import { languageAtom } from "@/store";
import { formatDate, parseContractError } from "@/utils/helpers";
import { useAtomValue } from "jotai";
import { Wallet } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

export default function PaymentForm() {
  const { t } = useTranslation();
  const { baseUrl } = useApi();
  const lang = useAtomValue(languageAtom);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [durationMonths, setDurationMonths] = useState(1);
  const [token, setToken] = useState(NATIVE_CURRENCIES[137]);

  const {
    useServerByHost,
    getUserLastPayment,
    getServerStatus,
    getExpiresDate,
    payWithNative,
    requestRefund,
    getToken,
  } = useServerRegistry();

  const { data: server, isLoading: serverLoading } = useServerByHost(baseUrl);
  const { isActive, status } = getServerStatus(server);
  const { data: payment, mutate: paymentMutate } = getUserLastPayment();
  const [expiresDate, setExpiresDate] = useState<Date | undefined>(
    payment?.expiresAt
      ? new Date(Number(payment?.expiresAt) * 1000)
      : undefined,
  );
  const [refundAmount, setRefundAmount] = useState<string>();

  const handleConfirmPay = async () => {
    if (server) {
      setIsSubmitting(true);
      try {
        const paymentId = await payWithNative(
          Number(server.id),
          durationMonths,
        );
        Toast.show({
          type: "success",
          text1: t("paymentSuccess"),
        });
        setShowConfirm(false);
        setExpiresDate(await getExpiresDate(paymentId));
        paymentMutate();
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: parseContractError(error),
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRefund = async () => {
    if (payment) {
      setIsSubmitting(true);
      try {
        const amount = await requestRefund(Number(payment.id));
        setRefundAmount(amount);
        setExpiresDate(undefined);
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("refundRequested"),
        });
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: parseContractError(error),
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getStatusInfo = () => {
    switch (Number(status)) {
      case 0:
        return { label: t("active"), color: "#22c55e" };
      case 1:
        return { label: t("inactive"), color: "#ef4444" };
      default:
        return { label: t("suspended"), color: "#f59e0b" };
    }
  };

  const statusInfo = getStatusInfo();

  useEffect(() => {
    getToken()
      .then((res) => setToken(res))
      .catch(() => setToken(NATIVE_CURRENCIES[137]));
  }, []);

  const showRefundModal = () => {
    Alert.alert(t("refundMoney"), t("refundConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("confirm"), onPress: handleRefund },
    ]);
  };

  if (serverLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("payServer")}</Text>

      {/* Server Info */}
      <View style={styles.serverInfo}>
        {server ? (
          <>
            <Text style={styles.serverTitle}>
              {t("server")} #{server.id}
            </Text>
            <View style={styles.serverDetails}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>URL:</Text>
                <Text style={styles.infoValue}>{server.host}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("owner")}:</Text>
                <Text style={styles.infoValue}>{server.owner}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("status")}:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusInfo.color + "20" },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: statusInfo.color }]}
                  >
                    {statusInfo.label}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("price")}:</Text>
                <Text style={styles.infoValue}>
                  {server.pricePerMonth} {token.symbol}
                </Text>
              </View>
              {expiresDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("serviceExpires")}:</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(expiresDate, lang, true)}
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <Text style={styles.errorText}>{t("serverNotFound")}</Text>
        )}
      </View>

      {/* Duration Months Input */}
      <View style={styles.field}>
        <Text style={styles.label}>{t("durationMonths")}</Text>
        <InputNumber
          value={durationMonths}
          setValue={setDurationMonths}
          min={1}
          placeholder={t("durationMonths")}
        />
      </View>

      {/* Pay Button */}
      <Button
        title={t("payServer")}
        onPress={() => setShowConfirm(true)}
        disabled={!isActive || serverLoading || isSubmitting}
        style={styles.fullButton}
      />

      {/* Refund Button */}
      {!!expiresDate && (
        <Button
          title={t("refundMoney")}
          onPress={showRefundModal}
          disabled={serverLoading || isSubmitting}
          outline
          style={[styles.fullButton, styles.refundButton]}
        />
      )}

      {/* Confirmation Modal */}
      <ModalWindow isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
        <View style={styles.confirmContent}>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>{t("serverId")}:</Text>
            <Text style={styles.confirmValue}>#{server?.id}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>{t("network")}:</Text>
            <Text style={styles.confirmValue}>{token.network}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>{t("price")}:</Text>
            <Text style={styles.confirmAmount}>
              {server?.pricePerMonth} {token.symbol}
            </Text>
          </View>
          <View style={styles.confirmActions}>
            <Button
              title={t("confirm")}
              onPress={handleConfirmPay}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              <Wallet size={20} color={Colors.fg} />
            </Button>
          </View>
        </View>
      </ModalWindow>

      {/* Refund Amount Modal */}
      <ModalWindow
        isOpen={!!refundAmount}
        onClose={() => setRefundAmount(undefined)}
      >
        <View style={styles.confirmContent}>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>{t("refundAmount")}:</Text>
            <Text style={styles.confirmValue}>{refundAmount}</Text>
          </View>
        </View>
      </ModalWindow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 16,
  },
  loadingContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.fg,
    marginBottom: 16,
    textAlign: "center",
  },
  serverInfo: {
    backgroundColor: Colors.bg,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  serverTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    marginBottom: 12,
  },
  serverDetails: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.placeholder,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.fg,
    flex: 1,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
    fontSize: 14,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.fg,
    marginBottom: 8,
  },
  fullButton: {
    width: "100%",
  },
  refundButton: {
    marginTop: 12,
  },
  confirmContent: {
    padding: 16,
    gap: 12,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  confirmLabel: {
    fontSize: 14,
    color: Colors.placeholder,
  },
  confirmValue: {
    fontSize: 14,
    color: Colors.fg,
    fontWeight: "500",
  },
  confirmAmount: {
    fontSize: 18,
    color: Colors.accent,
    fontFamily: Fonts.bold,
  },
  confirmActions: {
    marginTop: 16,
  },
});
