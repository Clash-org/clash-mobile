import { Colors, Fonts } from "@/constants";
import { NominationType } from "@/typings";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Select from "./ui/Select";

type Props = {
  nominations: NominationType[];
  weaponId: number | undefined;
  setWeaponId: (value: number | undefined) => void;
  nominationId: number | undefined;
  setNominationId: (value: number | undefined) => void;
  nomination?: string;
  weapon?: string;
  setNomination?: (value: string) => void;
  setWeapon?: (value: string) => void;
  disabled?: boolean;
};

export default function WeaponNominationsSelect({
  nominations,
  weaponId,
  setWeaponId,
  nominationId,
  setNominationId,
  nomination,
  weapon,
  setNomination,
  setWeapon,
  disabled = false,
}: Props) {
  const { t } = useTranslation();

  // Удаление дубликатов оружия
  const deleteDuplicates = <T extends { label: string; value: number }>(
    arrObj: T[],
  ): T[] => {
    return arrObj.filter(
      (obj, idx, arr) => idx === arr.findIndex((t) => t.value === obj.value),
    );
  };

  // Опции для выбора оружия
  const weaponOptions = useMemo(() => {
    return deleteDuplicates(
      nominations.map((nom) => ({
        label: nom.weapon.title,
        value: nom.weapon.id,
      })),
    );
  }, [nominations]);

  // Опции для выбора номинации (фильтруются по выбранному оружию)
  const nominationOptions = useMemo(() => {
    if (!weaponId) return [];

    return deleteDuplicates(
      nominations
        .filter((nom) => nom.weapon.id === weaponId)
        .map((nom) => ({
          label: nom.title,
          value: nom.id,
        })),
    );
  }, [nominations, weaponId]);

  // Обработчик выбора оружия
  const handleWeaponChange = (value: number | undefined) => {
    setWeaponId(value);
    // Сбрасываем выбранную номинацию при смене оружия
    if (value !== weaponId) {
      setNominationId(undefined);
      if (setNomination) setNomination("");
    }
  };

  return (
    <View style={styles.container}>
      {/* Выбор оружия */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t("weapons")}</Text>
        <Select
          options={weaponOptions}
          value={weaponId}
          setValue={handleWeaponChange}
          placeholder={t("selectWeapon")}
          inputValue={weapon}
          setInputValue={setWeapon}
          disabled={disabled}
        />
      </View>

      {/* Выбор номинации */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t("nominations")}</Text>
        <Select
          options={nominationOptions}
          value={nominationId}
          setValue={setNominationId}
          placeholder={t("selectNominations")}
          inputValue={nomination}
          setInputValue={setNomination}
          disabled={disabled || !weaponId}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
});
