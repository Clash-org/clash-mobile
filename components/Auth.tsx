import { Colors } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { languageAtom, userAtom } from "@/store";
import { Gender } from "@/typings";
import { truncate } from "@/utils/helpers";
import { router } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import CitySelect from "./CitySelect";
import ClubSelect from "./ClubSelect";
import Button from "./ui/Button";
import Checkbox from "./ui/Checkbox";
import { GenderSwitch } from "./ui/GenderSwitch";
import InputText from "./ui/InputText";

export default function Auth() {
  const { register, login } = useAuth();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState(Gender.MALE);
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [club, setClub] = useState("");
  const [cityId, setCityId] = useState<number>();
  const [clubId, setClubId] = useState<number>();
  const [password, setPassword] = useState("");
  const [isAgree, setIsAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const setUser = useSetAtom(userAtom);
  const lang = useAtomValue(languageAtom);

  const authHandler = async () => {
    setLoading(true);
    if (isLogin) {
      if (email && password) {
        try {
          const res = await login(email, password, lang);
          if (res) {
            setUser(res.user);
            router.push("/profile");
          }
        } catch (error: any) {
          Toast.show({ type: "error", text1: error.message });
          setLoading(false);
        }
      } else {
        Toast.show({ type: "error", text1: t("emailOrPasswordIncorrect") });
      }
    } else {
      if (username && email && password) {
        const res = await register(
          email,
          username,
          password,
          cityId || null,
          clubId || null,
          Boolean(gender),
          lang,
          city,
          club,
        );
        if (res) {
          setUser(res.user);
          router.push("/profile");
        }
      } else {
        Toast.show({ type: "error", text1: t("notFieldsFilled") });
      }
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <InputText
          required
          placeholder={t("email")}
          type="email"
          value={email}
          setValue={setEmail}
        />

        {!isLogin && (
          <InputText
            required
            placeholder={t("username")}
            value={username}
            setValue={setUsername}
          />
        )}

        {!isLogin && <GenderSwitch gender={gender} setGender={setGender} />}

        {!isLogin && (
          <CitySelect
            city={city}
            setCity={setCity}
            cityId={cityId}
            setCityId={setCityId}
          />
        )}

        {!isLogin && (
          <Text style={styles.hintText}>{t("enterIfNotFound")}</Text>
        )}

        {!isLogin && (
          <ClubSelect
            clubId={clubId}
            setClubId={setClubId}
            club={club}
            setClub={setClub}
          />
        )}

        {!isLogin && (
          <Text style={styles.hintText}>{t("enterIfNotFound")}</Text>
        )}

        <InputText
          required
          placeholder={t("password")}
          type="password"
          value={password}
          setValue={setPassword}
        />

        {!isLogin && (
          <View style={styles.checkboxContainer}>
            <Checkbox
              title={t("youAgree")}
              value={isAgree}
              setValue={setIsAgree}
              postfix={
                <TouchableOpacity onPress={() => router.push("/info")}>
                  <Text style={styles.privacyLink}>
                    {truncate(t("privacyPolicy"), 18)}
                  </Text>
                </TouchableOpacity>
              }
            />
          </View>
        )}

        <Button
          title={isLogin ? t("enter") : t("register")}
          onPress={authHandler}
          disabled={(!isLogin && !isAgree) || loading}
          loading={loading}
        />

        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {!isLogin ? t("enter") : t("register")}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 50,
    backgroundColor: Colors.bg,
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  form: {
    gap: 12,
    marginTop: 20,
  },
  hintText: {
    fontSize: 12,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: -4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  privacyLink: {
    color: Colors.accent,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    borderStyle: "dashed",
    fontSize: 14,
    paddingRight: 7,
  },
  switchButton: {
    alignSelf: "center",
    marginTop: 8,
  },
  switchText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: "500",
  },
});
