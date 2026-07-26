import { Colors, Fonts } from "@/constants";
import { teamCountAtom, triathlonWeaponsAtom } from "@/store";
import { useAtom } from "jotai";
import { Plus, Trash2 } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "./ui/Button";
import InputText from "./ui/InputText";

export function TriathlonWeaponsSettings() {
  const { t } = useTranslation();
  const [weapons, setWeapons] = useAtom(triathlonWeaponsAtom);

  const [teamCount, setTeamCount] = useAtom(teamCountAtom);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("selectWeapon")}</Text>

      {weapons.map((weapon, idx) => (
        <View key={idx} style={styles.inputRow}>
          <Text style={styles.label}>{t("weapons") + " " + (idx + 1)}</Text>
          <TextInput
            style={styles.input}
            value={weapon}
            onChangeText={(text) =>
              setWeapons((state) => {
                const buf = [...state];
                buf[idx] = text;
                return buf;
              })
            }
            placeholder={t("enterWeaponName")}
            placeholderTextColor={Colors.placeholder}
          />
          <Trash2
            color={Colors.fg}
            size={20}
            onPress={() =>
              setWeapons((state) => state.filter((_, i) => i !== idx))
            }
          />
        </View>
      ))}

      <View style={styles.inputRow}>
        <Button
          style={{ width: "100%" }}
          onPress={() => setWeapons((state) => [...state, ""])}
          stroke
        >
          <Plus color={Colors.fg} size={22} />
        </Button>
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.label}>{t("teamCount")}</Text>
        <InputText
          style={styles.input}
          value={String(teamCount)}
          type="number"
          setValue={(text) => setTeamCount(Number(text))}
          placeholder={t("expectedParticipants")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
  title: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    gap: 8,
  },
  label: {
    color: Colors.fg,
    fontSize: 14,
    width: 70,
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 6,
    padding: 8,
    color: Colors.fg,
    fontSize: 14,
  },
});
