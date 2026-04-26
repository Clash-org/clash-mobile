import Button from "@/components/ui/Button";
import ModalWindow from "@/components/ui/ModalWindow";
import Section from "@/components/ui/Section";
import WeaponNominationsSelect from "@/components/WeaponNominationsSelect";
import { Colors } from "@/constants";
import { useNominations } from "@/hooks/useNominations";
import { LangType } from "@/typings";
import { createWeapons, deleteWeapons } from "@/utils/api";
import { TFunction } from "i18next";
import { CirclePlus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

interface WeaponsCreateProps {
  lang: LangType;
  t: TFunction<"translation", undefined>;
}

export default function WeaponsCreate({ lang, t }: WeaponsCreateProps) {
  const { nominations } = useNominations(lang);
  const [weaponId, setWeaponId] = useState<number>();
  const [nominationId, setNominationId] = useState<number>();
  const [weapon, setWeapon] = useState("");
  const [nomination, setNomination] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const createWeapon = async () => {
    const res = await createWeapons(weapon, nomination, weaponId);
    if (res.success) {
      Toast.show({ type: "success", text1: "Успех", text2: "Создано" });
      setWeapon("");
      setNomination("");
    }
  };

  const deleteWeapon = async () => {
    if (weaponId) {
      const res = await deleteWeapons(weaponId, nominationId);
      if (res.success) {
        Toast.show({ type: "success", text1: "Успех", text2: "Удалено" });
        setShowDelete(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <WeaponNominationsSelect
        nominations={nominations}
        weaponId={weaponId}
        setWeaponId={setWeaponId}
        nominationId={nominationId}
        setNominationId={setNominationId}
        weapon={weapon}
        setWeapon={setWeapon}
        nomination={nomination}
        setNomination={setNomination}
      />
      <Text style={styles.hint}>{t("enterIfNotFound")}</Text>
      <Button onPress={createWeapon}>
        <CirclePlus size={20} color={Colors.fg} />
      </Button>
      <Button onPress={() => setShowDelete(true)} stroke>
        <Trash2 size={20} color={Colors.fg} />
      </Button>

      <ModalWindow isOpen={showDelete} onClose={() => setShowDelete(false)}>
        <Section title={t("realyDelete")}>
          <Button onPress={deleteWeapon}>
            <Trash2 size={20} color={Colors.fg} />
          </Button>
        </Section>
      </ModalWindow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  hint: {
    color: Colors.placeholder,
    textAlign: "center",
    fontSize: 12,
  },
});
