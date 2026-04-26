// app/(sidebar)/admin/Blockchain.tsx
import Button from "@/components/ui/Button";
import InputNumber from "@/components/ui/InputNumber";
import InputText from "@/components/ui/InputText";
import Select from "@/components/ui/Select";
import { Colors, Fonts, NATIVE_CURRENCIES } from "@/constants";
import { useServerRegistry } from "@/hooks/useServerRegistry";
import { blockchainAtom } from "@/store";
import { parseContractError } from "@/utils/helpers";
import { TFunction } from "i18next";
import { useAtomValue } from "jotai";
import { Power, PowerOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

interface BlockchainProps {
  t: TFunction<"translation", undefined>;
}

export default function Blockchain({ t }: BlockchainProps) {
  const { wallet } = useAtomValue(blockchainAtom);
  const {
    activateServer,
    deactivateServer,
    useServersIdsByOwner,
    useServer,
    getServerStatus,
    getToken,
    setServerPrice,
    setServerHost,
    releaseDaily,
  } = useServerRegistry();

  const { data: serversIds, isLoading: idsLoading } =
    useServersIdsByOwner(wallet);
  const [currentServerId, setCurrentServerId] = useState<number>();
  const { data: server, isLoading: serverLoading } = useServer(
    currentServerId || Number(serversIds?.[0]),
  );
  const [pricePerMonth, setPricePerMonth] = useState(
    Number(server?.pricePerMonth),
  );
  const [host, setHost] = useState(String(server?.host));
  const { isActive } = getServerStatus(server);
  const [totalAmount, setTotalAmount] = useState<string>();
  const [token, setToken] = useState(NATIVE_CURRENCIES[137]);

  const toggleServer = async () => {
    if (currentServerId) {
      try {
        isActive
          ? await deactivateServer(currentServerId)
          : await activateServer(currentServerId);
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: isActive ? t("serverOff") : t("serverOn"),
        });
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: error.message,
        });
      }
    }
  };

  const updateServerPrice = async () => {
    if (currentServerId && pricePerMonth) {
      try {
        await setServerPrice(currentServerId, pricePerMonth);
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("dataUpdated"),
        });
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: error.message,
        });
      }
    }
  };

  const updateServerHost = async () => {
    if (currentServerId && host) {
      try {
        await setServerHost(currentServerId, host);
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("dataUpdated"),
        });
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: error.message,
        });
      }
    }
  };

  const releaseFunds = async () => {
    if (server) {
      try {
        const amount = await releaseDaily(Number(server.id));
        setTotalAmount(amount);
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("checkWallet"),
        });
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: parseContractError(error),
        });
      }
    }
  };

  useEffect(() => {
    getToken()
      .then((res) => setToken(res))
      .catch(() => setToken(NATIVE_CURRENCIES[137]));
  }, []);

  // Обновляем локальные значения при изменении сервера
  useEffect(() => {
    if (server) {
      setPricePerMonth(Number(server.pricePerMonth));
      setHost(String(server.host));
    }
  }, [server]);

  if (idsLoading || serverLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!serversIds?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t("noServers")}</Text>
      </View>
    );
  }

  const serverOptions = serversIds.map((id) => ({
    label: String(id),
    value: String(id),
  }));

  return (
    <View style={styles.container}>
      <Select
        options={serverOptions}
        value={currentServerId?.toString()}
        setValue={(val) => setCurrentServerId(parseInt(val))}
        placeholder={t("serverId")}
      />

      {currentServerId && (
        <>
          <Button onPress={toggleServer} stroke={!isActive}>
            {isActive ? (
              <PowerOff size={24} color={Colors.accent} />
            ) : (
              <Power size={24} color={Colors.accent} />
            )}
            <Text style={{ color: Colors.fg, marginLeft: 8 }}>
              {isActive ? t("turnOff") : t("turnOn")}
            </Text>
          </Button>

          <Text style={styles.label}>
            {t("pricePerMonth")}: {token.symbol}
          </Text>
          <InputNumber
            min={1}
            value={pricePerMonth}
            setValue={setPricePerMonth}
          />
          <Button onPress={updateServerPrice} stroke>
            <Text style={{ color: Colors.fg }}>{t("updateData")}</Text>
          </Button>

          <Text style={styles.label}>URL</Text>
          <InputText
            value={host}
            setValue={setHost}
            placeholder="https://..."
          />
          <Button onPress={updateServerHost} stroke>
            <Text style={{ color: Colors.fg }}>{t("updateData")}</Text>
          </Button>

          <Button onPress={releaseFunds}>
            <Text style={{ color: Colors.fg }}>{t("getMoney")}</Text>
          </Button>

          {!!totalAmount && (
            <Text style={styles.totalAmount}>
              {t("totalAmount")}: {totalAmount}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.placeholder,
    fontSize: 16,
    textAlign: "center",
  },
  label: {
    color: Colors.fg,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  totalAmount: {
    color: Colors.accent,
    fontSize: 16,
    fontFamily: Fonts.bold,
    textAlign: "center",
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.accentTransparent,
    borderRadius: 8,
  },
});
