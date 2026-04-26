import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Section from "@/components/ui/Section";
import { Colors, Fonts } from "@/constants";
import { useApi } from "@/hooks/useApi";
import { blockchainAtom } from "@/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ethers } from "ethers";
import * as Clipboard from "expo-clipboard";
import { useAtom } from "jotai";
import {
    Check,
    Copy,
    Eye,
    EyeOff,
    Key,
    RefreshCw,
    Wallet,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

export function BlockchainWallet() {
  const { t } = useTranslation();
  const { rpc } = useApi();
  const [blockchainData, setBlockchainData] = useAtom(blockchainAtom);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [copied, setCopied] = useState<"address" | "privateKey" | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isImportPrivatekey, setIsImportPrivatekey] = useState(false);
  const [isSavePrivatekey, setIsSavePrivatekey] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [isPrivateKeyInSettings, setIsPrivateKeyInSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Загрузка баланса и информации о сети
  useEffect(() => {
    if (blockchainData.wallet && blockchainData.privateKey) {
      fetchBalance();
      fetchNetwork();
    }
  }, [blockchainData.wallet, blockchainData.privateKey]);

  useEffect(() => {
    checkPrivateKeyInStorage();
  }, []);

  const checkPrivateKeyInStorage = async () => {
    try {
      const key = await AsyncStorage.getItem("privateKey");
      setIsPrivateKeyInSettings(!!key);
    } catch (error) {
      console.error("Error checking private key:", error);
    }
  };

  const fetchBalance = async () => {
    if (!blockchainData.wallet) return;

    setRefreshing(true);
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const balanceWei = await provider.getBalance(blockchainData.wallet);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(parseFloat(balanceEth).toFixed(4));
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance(null);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("failedToFetchBalance"),
      });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchNetwork = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const network = await provider.getNetwork();
      setNetwork(`${network.name || "Unknown"} (${Number(network.chainId)})`);
    } catch (error) {
      console.error("Failed to fetch network:", error);
      setNetwork(null);
    }
  };

  const copyToClipboard = async (
    text: string,
    type: "address" | "privateKey",
  ) => {
    await Clipboard.setStringAsync(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    Toast.show({
      type: "success",
      text1: t("success"),
      text2: t("copied"),
    });
  };

  const importPrivateKey = async () => {
    if (!privateKey.trim()) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("enterPrivateKey"),
      });
      return;
    }

    setLoading(true);
    try {
      const wallet = new ethers.Wallet(privateKey.trim());
      setBlockchainData({
        wallet: wallet.address,
        privateKey: privateKey.trim(),
      });

      if (isSavePrivatekey) {
        await AsyncStorage.setItem("privateKey", privateKey.trim());
        setIsPrivateKeyInSettings(true);
      }

      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("walletImported"),
      });

      setIsImportPrivatekey(false);
      setPrivateKey("");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("invalidPrivateKey"),
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    Alert.alert(t("confirm"), t("disconnectWalletConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("disconnect"),
        style: "destructive",
        onPress: async () => {
          setBlockchainData({
            wallet: "",
            privateKey: "",
          });
          setBalance(null);
          setNetwork(null);
          Toast.show({
            type: "success",
            text1: t("success"),
            text2: t("walletDisconnected"),
          });
        },
      },
    ]);
  };

  const deletePrivateKey = async () => {
    Alert.alert(t("confirm"), t("deletePrivateKeyConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("privateKey");
          setIsPrivateKeyInSettings(false);
          Toast.show({
            type: "success",
            text1: t("success"),
            text2: t("settingsSaved"),
          });
        },
      },
    ]);
  };

  const maskAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const maskPrivateKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 12) return "••••••••";
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  };

  return (
    <Section title={t("cryptoWallet")}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Статус подключения */}
        <View style={styles.statusRow}>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                blockchainData.wallet
                  ? styles.statusDotConnected
                  : styles.statusDotDisconnected,
              ]}
            />
            <Text style={styles.statusText}>
              {blockchainData.wallet ? t("connected") : t("notConnected")}
            </Text>
          </View>
          {network && (
            <View style={styles.networkInfo}>
              <Text style={styles.networkLabel}>{t("network")}:</Text>
              <Text style={styles.networkValue}>{network}</Text>
            </View>
          )}
        </View>

        {/* Адрес кошелька */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Wallet size={16} color={Colors.placeholder} />
            <Text style={styles.label}>{t("walletAddress")}</Text>
          </View>
          <View style={styles.inputWithButton}>
            <View style={styles.walletInputWrapper}>
              <Text style={styles.walletInput}>
                {blockchainData.wallet
                  ? showWallet
                    ? blockchainData.wallet
                    : maskAddress(blockchainData.wallet)
                  : t("notConnected")}
              </Text>
            </View>
            {blockchainData.wallet && (
              <>
                <TouchableOpacity
                  onPress={() => setShowWallet(!showWallet)}
                  style={styles.iconButton}
                >
                  {showWallet ? (
                    <Eye size={18} color={Colors.placeholder} />
                  ) : (
                    <EyeOff size={18} color={Colors.placeholder} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    copyToClipboard(blockchainData.wallet, "address")
                  }
                  style={styles.iconButton}
                >
                  {copied === "address" ? (
                    <Check size={18} color={Colors.accent} />
                  ) : (
                    <Copy size={18} color={Colors.placeholder} />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
          {blockchainData.wallet && (
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>{t("balance")}:</Text>
              <Text style={styles.balanceValue}>
                {balance !== null ? `${balance} ETH` : t("loading")}
              </Text>
              <TouchableOpacity
                onPress={fetchBalance}
                style={styles.refreshButton}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={Colors.accent} />
                ) : (
                  <RefreshCw size={14} color={Colors.placeholder} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Приватный ключ */}
        {blockchainData.privateKey && (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Key size={16} color={Colors.placeholder} />
              <Text style={styles.label}>{t("privateKey")}</Text>
            </View>
            <View style={styles.inputWithButton}>
              <View style={styles.walletInputWrapper}>
                <Text style={styles.walletInput}>
                  {showPrivateKey
                    ? blockchainData.privateKey
                    : maskPrivateKey(blockchainData.privateKey)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPrivateKey(!showPrivateKey)}
                style={styles.iconButton}
              >
                {showPrivateKey ? (
                  <Eye size={18} color={Colors.placeholder} />
                ) : (
                  <EyeOff size={18} color={Colors.placeholder} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  copyToClipboard(blockchainData.privateKey, "privateKey")
                }
                style={styles.iconButton}
              >
                {copied === "privateKey" ? (
                  <Check size={18} color={Colors.accent} />
                ) : (
                  <Copy size={18} color={Colors.placeholder} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Чекбокс сохранения ключа */}
        {!blockchainData.privateKey && (
          <Checkbox
            title={t("savePrivateKey")}
            value={isSavePrivatekey}
            setValue={setIsSavePrivatekey}
          />
        )}

        {/* Кнопка удаления ключа из настроек */}
        {isPrivateKeyInSettings && (
          <Button
            title={t("deletePrivateKey")}
            onPress={deletePrivateKey}
            stroke
            style={styles.deleteButton}
          />
        )}

        {/* Поле ввода приватного ключа */}
        {isImportPrivatekey && (
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.textInput}
              placeholder={t("privateKey")}
              placeholderTextColor={Colors.placeholder}
              value={privateKey}
              onChangeText={setPrivateKey}
              secureTextEntry={!showPrivateKey}
              autoCapitalize="none"
            />
          </View>
        )}

        {/* Кнопки действий */}
        <View style={styles.actions}>
          {!blockchainData.privateKey && (
            <Button
              title={isImportPrivatekey ? t("import") : t("importPrivateKey")}
              onPress={
                isImportPrivatekey
                  ? importPrivateKey
                  : () => setIsImportPrivatekey(true)
              }
              loading={loading}
              style={styles.actionButton}
            />
          )}

          {blockchainData.wallet && (
            <Button
              title={t("disconnect")}
              onPress={disconnectWallet}
              stroke
              style={styles.actionButton}
            />
          )}

          {isImportPrivatekey && !blockchainData.privateKey && (
            <Button
              title={t("cancel")}
              onPress={() => {
                setIsImportPrivatekey(false);
                setPrivateKey("");
              }}
              stroke
              style={styles.actionButton}
            />
          )}
        </View>
      </ScrollView>
    </Section>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotConnected: {
    backgroundColor: "#22c55e",
  },
  statusDotDisconnected: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.fg,
  },
  networkInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  networkLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.placeholder,
  },
  networkValue: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.accent,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.placeholder,
  },
  inputWithButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletInputWrapper: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  walletInput: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.fg,
  },
  iconButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.placeholder,
  },
  balanceValue: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.fg,
  },
  refreshButton: {
    padding: 2,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: Fonts.regular,
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#333333",
    color: Colors.fg,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
  },
  deleteButton: {
    marginBottom: 16,
  },
});
