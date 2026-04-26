import { useCities } from "@/hooks/useCities";
import { languageAtom } from "@/store";
import { useAtomValue } from "jotai";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import Select from "./ui/Select";

type CitySelectProps = {
  city?: string;
  setCity?: Dispatch<SetStateAction<string>>;
  cityId: number | undefined;
  setCityId: Dispatch<SetStateAction<number | undefined>>;
  required?: boolean;
};

export default function CitySelect({
  city,
  cityId,
  setCity,
  setCityId,
  required,
}: CitySelectProps) {
  const { t } = useTranslation();
  const lang = useAtomValue(languageAtom);
  const { cities } = useCities(lang);

  return (
    <Select
      required={required}
      placeholder={t("city")}
      value={cityId}
      setValue={setCityId}
      inputValue={city}
      setInputValue={setCity}
      options={cities.map((city) => ({ label: city.title, value: city.id }))}
    />
  );
}
