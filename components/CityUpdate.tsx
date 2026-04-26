import CitySelect from "@/components/CitySelect";
import Button from "@/components/ui/Button";
import InputText from "@/components/ui/InputText";
import { LangType } from "@/typings";
import { updateCity } from "@/utils/api";
import { TFunction } from "i18next";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

interface CityUpdateProps {
  lang: LangType;
  t: TFunction<"translation", undefined>;
}

export default function CityUpdate({ t, lang }: CityUpdateProps) {
  const [newCity, setNewCity] = useState("");
  const [cityId, setCityId] = useState<number>();

  const updateCityName = async () => {
    if (newCity && cityId) {
      const res = await updateCity(newCity, cityId, lang);
      if (res) {
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("dataUpdated"),
        });
        setNewCity("");
      }
    }
  };

  return (
    <View style={styles.container}>
      <CitySelect cityId={cityId} setCityId={setCityId} />
      <InputText
        value={newCity}
        setValue={setNewCity}
        placeholder={t("newValue")}
      />
      <Button
        title={t("updateData")}
        onPress={updateCityName}
        disabled={!newCity || !cityId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 8,
  },
});
