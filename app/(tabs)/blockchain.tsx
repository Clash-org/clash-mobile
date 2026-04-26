import { BlockchainWallet } from "@/components/BlockchainWallet";
import CryptoRestrictions from "@/components/CryptoRestrictions";
import Button from "@/components/ui/Button";
import InputText from "@/components/ui/InputText";
import LinksList from "@/components/ui/LinksList";
import Section from "@/components/ui/Section";
import { Colors, Fonts } from "@/constants";
import { useApi } from "@/hooks/useApi";
import { useContracts } from "@/hooks/useContracts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bookmark, CirclePlus, Save } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function Blockchain() {
  const { rpc, setRpc, baseUrl } = useApi();
  const [rpcURL, setRpcURL] = useState(rpc);
  const [rpcs, setRpcs] = useState<string[]>([]);
  const [contractAddresses, setContractAddresses] = useState(["", "", ""]);
  const [notes, setNotes] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const {
    tournament,
    user,
    server,
    switchTournamentAddress,
    switchServerAddress,
    switchUserAddress,
    updateServerAddress,
    updateTournamentAddress,
    updateUserAddress,
    addServerAddress,
    addTournamentAddress,
    addUserAddress,
    saveConfig,
  } = useContracts();

  const currentContracts = [server, tournament, user];
  const contractHandlers = [
    { update: updateServerAddress, add: addServerAddress },
    { update: updateTournamentAddress, add: addTournamentAddress },
    { update: updateUserAddress, add: addUserAddress },
  ];
  const otherAddresses = [
    server.addresses,
    tournament.addresses,
    user.addresses,
  ];

  const handleChangeRpc = async (url: string) => {
    if (!url.trim()) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("enterRpcUrl"),
      });
      return;
    }

    setLoading(true);
    try {
      await AsyncStorage.setItem("rpc", url);
      setRpc(url);
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("settingsSaved"),
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("saveError"),
      });
    } finally {
      setLoading(false);
    }
  };

  const saveURL = async () => {
    if (!rpcURL.trim()) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("enterRpcUrl"),
      });
      return;
    }

    setLoading(true);
    try {
      const data = rpcs ? [...rpcs, rpcURL] : [rpcURL];
      await AsyncStorage.setItem("rpcs", JSON.stringify(data));
      setRpcs(data);
      setRpcURL("");
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("settingsSaved"),
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("saveError"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      await saveConfig();
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("settingsSaved"),
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("saveError"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = async (index: number) => {
    const address = contractAddresses[index];
    const note = notes[index];

    if (!address.trim()) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("enterContractAddress"),
      });
      return;
    }

    setLoading(true);
    try {
      await contractHandlers[index].add(
        address,
        note || `Contract ${index + 1}`,
      );
      setContractAddresses((prev) => {
        const buf = [...prev];
        buf[index] = "";
        return buf;
      });
      setNotes((prev) => {
        const buf = [...prev];
        buf[index] = "";
        return buf;
      });
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("contractAdded"),
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("addError"),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRpcs();
  }, []);

  const loadRpcs = async () => {
    try {
      const savedRpcs = await AsyncStorage.getItem("rpcs");
      if (savedRpcs) {
        setRpcs(JSON.parse(savedRpcs));
      }
    } catch (error) {
      console.error("Error loading RPCs:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t("blockchain")}</Text>

      <CryptoRestrictions />

      {/* RPC Section */}
      <Section title="RPC">
        <InputText
          placeholder="RPC URL"
          value={rpcURL}
          onChangeText={setRpcURL}
        />
        <Button
          title={t("saveToBookmarks")}
          onPress={saveURL}
          stroke
          style={styles.button}
        >
          <Bookmark size={20} color={Colors.fg} />
        </Button>
        <Button
          title={t("applyRpc")}
          onPress={() => handleChangeRpc(rpcURL)}
          style={styles.button}
        >
          <Save size={20} color={Colors.fg} />
        </Button>
        {rpcs && rpcs.length > 0 && (
          <LinksList
            onPress={(link) => {
              setRpcURL(link);
              handleChangeRpc(link);
            }}
            links={rpcs}
            onDelete={async (index) => {
              const newRpcs = rpcs.filter((_, i) => i !== index);
              setRpcs(newRpcs);
              await AsyncStorage.setItem("rpcs", JSON.stringify(newRpcs));
            }}
          />
        )}
      </Section>

      {/* Smart Contracts Section */}
      <Section title={t("smartContracts")}>
        {currentContracts.map((contract, i) => (
          <View key={i} style={styles.contractGroup}>
            <Text style={styles.accentText}>{contract.note}</Text>
            <InputText
              value={contract.address}
              onChangeText={(val) =>
                contractHandlers[i].update(
                  contract.currentIndex,
                  val,
                  contract.note,
                )
              }
              placeholder={t("contractAddress")}
            />
            <InputText
              value={contract.note}
              onChangeText={(val) =>
                contractHandlers[i].update(
                  contract.currentIndex,
                  contract.address,
                  val,
                )
              }
              placeholder={t("description")}
            />
          </View>
        ))}

        <Button
          title={t("saveContracts")}
          onPress={handleSaveConfig}
          style={styles.button}
        >
          <Save size={20} color={Colors.fg} />
        </Button>

        {/* Add new contracts */}
        {contractHandlers.map((_, i) => (
          <View key={`add-${i}`} style={styles.addContractGroup}>
            <Text style={styles.sectionLabel}>
              {currentContracts[i].addresses[0]?.note || t("addContract")}
            </Text>
            <InputText
              placeholder={t("smartContractAddress")}
              value={contractAddresses[i]}
              onChangeText={(val) =>
                setContractAddresses((prev) => {
                  const buf = [...prev];
                  buf[i] = val;
                  return buf;
                })
              }
            />
            <InputText
              placeholder={t("description")}
              value={notes[i]}
              onChangeText={(val) =>
                setNotes((prev) => {
                  const buf = [...prev];
                  buf[i] = val;
                  return buf;
                })
              }
            />
            <Button
              title={t("addContract")}
              onPress={() => handleAddContract(i)}
              stroke
              style={styles.addButton}
            >
              <CirclePlus size={20} color={Colors.accent} />
            </Button>
          </View>
        ))}

        {/* Contract lists */}
        {otherAddresses[0].length > 0 && (
          <LinksList
            links={otherAddresses[0].map(
              (addr) => `${addr.note}: ${addr.address}`,
            )}
            onPress={(_, idx) => switchServerAddress(idx)}
            title={t("serverContracts")}
          />
        )}

        {otherAddresses[1].length > 0 && (
          <LinksList
            links={otherAddresses[1].map(
              (addr) => `${addr.note}: ${addr.address}`,
            )}
            onPress={(_, idx) => switchTournamentAddress(idx)}
            title={t("tournamentContracts")}
          />
        )}

        {otherAddresses[2].length > 0 && (
          <LinksList
            links={otherAddresses[2].map(
              (addr) => `${addr.note}: ${addr.address}`,
            )}
            onPress={(_, idx) => switchUserAddress(idx)}
            title={t("userContracts")}
          />
        )}
      </Section>

      <BlockchainWallet />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.fg,
    marginTop: 50,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    marginVertical: 8,
  },
  addButton: {
    marginVertical: 8,
  },
  contractGroup: {
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  addContractGroup: {
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  accentText: {
    color: Colors.accent,
    fontSize: 16,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  sectionLabel: {
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginTop: 8,
    marginBottom: 4,
  },
});
