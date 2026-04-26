import PaymentForm from "@/components/PaymentForm";
import Button from "@/components/ui/Button";
import InputText from "@/components/ui/InputText";
import LinksList from "@/components/ui/LinksList";
import { Colors, Fonts } from "@/constants";
import { useApi } from "@/hooks/useApi";
import { useContract } from "@/hooks/useContract";
import { ApiConfig, setGlobalApiConfig } from "@/providers/ApiProvider";
import { ServerStatus, ServerType } from "@/typings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bookmark, Save } from "lucide-react-native";
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

export default function Servers() {
  const { t } = useTranslation();
  const { useContractQuery, contract } = useContract("server");
  const { data: totalServers, isLoading } =
    useContractQuery<bigint>("totalServers");
  const totalCount = Number(totalServers);
  const { setBaseUrl, baseUrl, rpc } = useApi();
  const [serverURL, setServerURL] = useState(baseUrl);
  const [servers, setServers] = useState<string[]>([]);
  const [globalServers, setGlobalServers] = useState<ServerType[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChangeBaseURL = async (url: string) => {
    if (!url.trim()) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(url + "health");
      if (res.ok) {
        await AsyncStorage.setItem("server", url);
        setBaseUrl(url);
        setGlobalApiConfig(new ApiConfig(url, rpc));
        Toast.show({
          type: "success",
          text1: t("settingsSaved"),
        });
      } else {
        Toast.show({
          type: "error",
          text1: await res.json(),
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("p2pConnectionError").slice(2),
      });
    } finally {
      setLoading(false);
    }
  };

  const saveURL = async () => {
    if (!serverURL.trim()) {
      return;
    }

    setLoading(true);
    try {
      const data = servers ? [...servers, serverURL] : [serverURL];
      await AsyncStorage.setItem("servers", JSON.stringify(data));
      setServers(data);
      setServerURL("");
      Toast.show({
        type: "success",
        text1: t("settingsSaved"),
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    if (!isLoading && totalCount > 0) {
      loadGlobalServers();
    }
  }, [isLoading, totalCount]);

  const loadServers = async () => {
    try {
      const savedServers: string[] = JSON.parse(
        (await AsyncStorage.getItem("servers")) || "null",
      );
      if (savedServers) {
        setServers(savedServers);
      }
    } catch {}
  };

  const loadGlobalServers = async () => {
    try {
      const serversArr: ServerType[] = [];
      for (let i = 1; i <= totalCount; i++) {
        const server = await contract.getServer(i);
        serversArr.push(server);
      }
      setGlobalServers(serversArr);
    } catch {}
  };

  const formatServerDisplay = (server: ServerType) => {
    const isActive = Number(server.status) === ServerStatus.ACTIVE;
    return `${isActive ? "✅" : "❌"} ${server.host}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t("server")}</Text>

      <InputText
        placeholder={t("server")}
        value={serverURL}
        setValue={setServerURL}
      />

      <Button
        title={t("saveToBookmarks")}
        onPress={saveURL}
        stroke
        style={styles.button}
        loading={loading}
      >
        <Bookmark size={20} color={Colors.fg} />
      </Button>

      <Button
        title={t("applyServer")}
        onPress={() => handleChangeBaseURL(serverURL)}
        style={styles.button}
        loading={loading}
      >
        <Save size={20} color={Colors.fg} />
      </Button>

      {servers && servers.length > 0 && (
        <LinksList
          onClick={(link) => {
            setServerURL(link);
            handleChangeBaseURL(link);
          }}
          links={servers}
          setLinks={async (links) => {
            setServers(links);
            await AsyncStorage.setItem("servers", JSON.stringify(links));
          }}
        />
      )}

      {globalServers && globalServers.length > 0 && (
        <LinksList
          onClick={(link) => {
            const cleanLink = link.replace(/^[✅❌]\s/, "");
            setServerURL(cleanLink);
            handleChangeBaseURL(cleanLink);
          }}
          links={globalServers.map(formatServerDisplay)}
        />
      )}

      <PaymentForm />
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
});
