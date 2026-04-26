import ErrorPage from "@/components/ErrorPage";
import ImageUploader from "@/components/ImageUploader";
import { ShareButton } from "@/components/ShareButton";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import DatePicker from "@/components/ui/DatePicker";
import InputNumber from "@/components/ui/InputNumber";
import InputText from "@/components/ui/InputText";
import LinksList from "@/components/ui/LinksList";
import Markdown from "@/components/ui/Markdown";
import ModalWindow from "@/components/ui/ModalWindow";
import Section from "@/components/ui/Section";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import Tabs from "@/components/ui/Tabs";
import { Colors, Fonts } from "@/constants";
import { useApi } from "@/hooks/useApi";
import { useCities } from "@/hooks/useCities";
import { useNominations } from "@/hooks/useNominations";
import { useParticipants } from "@/hooks/useParticipants";
import { useParticipantsInfo } from "@/hooks/useParticipantsInfo";
import { useOrganizerTournaments } from "@/hooks/useTournaments";
import { useUsers } from "@/hooks/useUsers";
import { useWeapons } from "@/hooks/useWeapons";
import { blockchainAtom, languageAtom, userAtom } from "@/store";
import {
  CURRENCY_CODES,
  ParticipantStatus,
  ParticipantStatusType,
  TournamentFormData,
  TournamentStatus,
  TournamentType,
} from "@/typings";
import {
  createTournament,
  deleteTournament,
  updateParticipantStatus,
  updateTournament,
  updateTournamentStatus,
} from "@/utils/api";
import { getNewImageName, translateStatus } from "@/utils/helpers";
import * as Linking from "expo-linking";
import { useAtomValue } from "jotai";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle,
  CirclePlus,
  Eye,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function CreateTournament() {
  const { t } = useTranslation();
  const lang = useAtomValue(languageAtom);
  const user = useAtomValue(userAtom);
  const blockchain = useAtomValue(blockchainAtom);
  const { tournaments } = useOrganizerTournaments(user?.id, lang);
  const { nominations } = useNominations(lang);
  const { weapons } = useWeapons(nominations);
  const { cities } = useCities(lang);
  const { users } = useUsers(1, 1000, lang);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentTournament, setCurrentTournament] = useState<TournamentType>();
  const { info: participantsInfo } = useParticipantsInfo(
    currentTournament?.id,
    lang,
  );
  const { participants } = useParticipants(
    currentTournament?.id,
    currentTournament?.nominationsIds || [],
  );
  const [socialLink, setSocialLink] = useState("");
  const [socialLinkText, setSocialLinkText] = useState("");
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const tabs = ["tournaments", "participants"] as const;
  const tabsTitles = tabs.map((tab) => t(tab));
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>("tournaments");
  const [cover, setCover] = useState<FormData | null>(null);
  const { api } = useApi();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"start" | "end">(
    "start",
  );

  const defaultTournamentData: TournamentFormData = {
    title: "",
    description: "",
    date: new Date(),
    dateEnd: new Date(),
    cityId: 0,
    image: "",
    prices: {},
    weaponsIds: [],
    nominationsIds: [],
    participantsCount: {},
    socialMedias: [],
    socialMediasText: [],
    isAdditions: {},
    moderatorsIds: [],
    isInternal: false,
    currency: "RUB",
    status: "pending",
  };

  const [formData, setFormData] = useState<TournamentFormData>(
    defaultTournamentData,
  );

  useEffect(() => {
    if (currentTournament) {
      handleInputChange("cityId", currentTournament.cityId);
      handleInputChange("date", new Date(currentTournament.date));
      handleInputChange(
        "dateEnd",
        currentTournament.dateEnd
          ? new Date(currentTournament.dateEnd)
          : new Date(currentTournament.date),
      );
      handleInputChange("description", currentTournament.description);
      handleInputChange("isAdditions", currentTournament.isAdditions);
      handleInputChange("nominationsIds", currentTournament.nominationsIds);
      handleInputChange(
        "participantsCount",
        currentTournament.participantsCount,
      );
      handleInputChange("prices", currentTournament.prices);
      handleInputChange("socialMedias", currentTournament.socialMedias);
      handleInputChange("socialMediasText", currentTournament.socialMediasText);
      handleInputChange("title", currentTournament.title);
      handleInputChange("image", currentTournament.image);
      handleInputChange("status", currentTournament.status);
      handleInputChange("isInternal", currentTournament.isInternal);
      handleInputChange(
        "moderatorsIds",
        currentTournament.moderators.map((m) => m.id),
      );
      handleInputChange(
        "weaponsIds",
        nominations
          .filter((nom) => currentTournament.nominationsIds.includes(nom.id))
          .map((nom) => nom.weapon.id),
      );
    }
  }, [currentTournament]);

  useEffect(() => {
    const allWeaponsIds = [...new Set(nominations.map((n) => n.weapon.id))];
    const deleteWeaponsIds = allWeaponsIds.filter(
      (id) => !formData.weaponsIds.includes(id),
    );
    const deleteNominationsIds = nominations
      .filter((n) => !deleteWeaponsIds.includes(n.weapon.id))
      .map((n) => n.id);
    const newNominationsIds = formData.nominationsIds.filter((nom) =>
      deleteNominationsIds.includes(nom),
    );
    handleInputChange("nominationsIds", newNominationsIds);
  }, [formData.weaponsIds]);

  const handleInputChange = (field: keyof TournamentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdditions = (field: string, val: boolean) => {
    handleInputChange("isAdditions", { ...formData.isAdditions, [field]: val });
  };

  const handleAddSocialLink = () => {
    if (socialLink && !formData.socialMedias.includes(socialLink)) {
      setFormData((prev) => ({
        ...prev,
        socialMedias: [...prev.socialMedias, socialLink],
      }));
      setSocialLink("");
    }
    if (socialLinkText) {
      setFormData((prev) => ({
        ...prev,
        socialMediasText: [...prev.socialMediasText!, socialLinkText],
      }));
      setSocialLinkText("");
    }
  };

  const handleRemoveSocialLink = (links: string[]) => {
    setFormData((prev) => ({
      ...prev,
      socialMedias: links,
    }));
  };

  const handleRemoveSocialLinkText = (texts: string[]) => {
    setFormData((prev) => ({
      ...prev,
      socialMediasText: texts,
    }));
  };

  const handleUpdateParticipantStatus = async (
    tournamentId: number,
    nominationId: string,
    userId: string,
    status: ParticipantStatusType,
  ) => {
    setLoading(true);
    try {
      const res = await updateParticipantStatus(
        tournamentId,
        Number(nominationId),
        userId,
        status,
      );
      if (res) {
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("dataUpdated"),
        });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: t("error"), text2: t("updateError") });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (currentTournament) {
        const newName = await getNewImageName(formData.image, cover);
        const res = await updateTournament(
          { ...formData, image: newName },
          currentTournament.id,
        );
        if (res) {
          Toast.show({
            type: "success",
            text1: t("success"),
            text2: t("dataUpdated"),
          });
          setCurrentTournament(res);
        }
      } else {
        const newName = await getNewImageName(formData.image, cover);
        const data = await createTournament(
          { ...formData, image: newName },
          blockchain.wallet,
        );
        if (data) {
          Toast.show({
            type: "success",
            text1: t("success"),
            text2: t("created"),
          });
          setFormData(defaultTournamentData);
          setCover(null);
          setCurrentStep(1);
        }
      }
    } catch (error) {
      Toast.show({ type: "error", text1: t("error"), text2: t("submitError") });
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.title &&
          formData.description &&
          formData.cityId &&
          formData.date
        );
      case 2:
        return (
          formData.weaponsIds.length > 0 && formData.nominationsIds.length > 0
        );
      default:
        return true;
    }
  };

  const cityOptions = cities.map((city) => ({
    label: city.title,
    value: city.id.toString(),
  }));

  const weaponOptions = weapons.map((weapon) => ({
    label: weapon.title,
    value: weapon.id.toString(),
  }));

  if (!user) return <ErrorPage />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>{t("createTournament")}</Text>

      {tournaments && tournaments.length > 0 && (
        <>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            titles={tabsTitles}
          />
          <Section title={t("tournaments")}>
            <Select
              placeholder={t("yourTournamets")}
              setValue={(val) => setCurrentTournament(JSON.parse(val))}
              value={JSON.stringify(currentTournament)}
              options={tournaments.map((t) => ({
                label: t.title,
                value: JSON.stringify(t),
              }))}
            />
            {currentTournament && (
              <Button
                title={t("createNewTournament")}
                onPress={() => {
                  setCurrentTournament(undefined);
                  setFormData(defaultTournamentData);
                }}
                style={styles.button}
              />
            )}
            {currentTournament && (
              <>
                <ShareButton type="tournament" id={currentTournament.id} />
                <Select
                  placeholder={t("status")}
                  options={Object.values(TournamentStatus).map((s) => ({
                    label: translateStatus(s, lang),
                    value: s,
                  }))}
                  value={formData.status}
                  setValue={(val) => handleInputChange("status", val)}
                />
                <Button
                  title={t("updateStatus")}
                  onPress={async () => {
                    setLoading(true);
                    try {
                      const res = await updateTournamentStatus(
                        formData.status,
                        currentTournament.id,
                      );
                      if (res) {
                        setCurrentTournament(res);
                        Toast.show({
                          type: "success",
                          text1: t("success"),
                          text2: t("dataUpdated"),
                        });
                      }
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={styles.button}
                />
                <Button
                  title={t("delete")}
                  onPress={() => setShowDelete(true)}
                  stroke
                  style={styles.button}
                />
              </>
            )}
          </Section>
        </>
      )}

      {activeTab === "tournaments" && (
        <>
          {/* Progress Steps */}
          <View style={styles.progress}>
            <View style={styles.steps}>
              <TouchableOpacity
                style={[styles.step, currentStep >= 1 && styles.activeStep]}
                onPress={() => setCurrentStep(1)}
              >
                <View
                  style={[
                    styles.stepNumber,
                    currentStep >= 1 && styles.activeStepNumber,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumberText,
                      currentStep >= 1 && styles.activeStepNumberText,
                    ]}
                  >
                    1
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep >= 1 && styles.activeStepLabel,
                  ]}
                >
                  {t("basicInfo")}
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.stepLine,
                  currentStep >= 2 && styles.activeStepLine,
                ]}
              />

              <TouchableOpacity
                style={[styles.step, currentStep >= 2 && styles.activeStep]}
                onPress={() => setCurrentStep(2)}
                disabled={!isStepValid(1)}
              >
                <View
                  style={[
                    styles.stepNumber,
                    currentStep >= 2 && styles.activeStepNumber,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumberText,
                      currentStep >= 2 && styles.activeStepNumberText,
                    ]}
                  >
                    2
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep >= 2 && styles.activeStepLabel,
                  ]}
                >
                  {t("weaponsAndNominations")}
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.stepLine,
                  currentStep === 3 && styles.activeStepLine,
                ]}
              />

              <TouchableOpacity
                style={[styles.step, currentStep >= 3 && styles.activeStep]}
                onPress={() => setCurrentStep(3)}
                disabled={!isStepValid(2)}
              >
                <View
                  style={[
                    styles.stepNumber,
                    currentStep >= 3 && styles.activeStepNumber,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumberText,
                      currentStep >= 3 && styles.activeStepNumberText,
                    ]}
                  >
                    3
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep >= 3 && styles.activeStepLabel,
                  ]}
                >
                  {t("additionalInfo")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Content */}
          <Section>
            {currentStep === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t("basicInfo")}</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t("tournamentTitle")} *</Text>
                  <InputText
                    value={formData.title}
                    setValue={(val) => handleInputChange("title", val.trim())}
                    placeholder={t("enterTournamentTitle")}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t("description")} *</Text>
                  <InputText
                    value={formData.description}
                    setValue={(val) => handleInputChange("description", val)}
                    placeholder={t("enterDescription") + " (Markdown)"}
                    multiline
                  />
                  <Button
                    title={t("preview")}
                    onPress={() => setShowMarkdown(true)}
                    stroke
                  >
                    <Eye size={20} color={Colors.fg} />
                  </Button>
                </View>

                <View style={styles.row}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("city")} *</Text>
                    <Select
                      options={cityOptions}
                      value={formData.cityId.toString()}
                      setValue={(val) =>
                        handleInputChange("cityId", parseInt(val))
                      }
                      placeholder={t("city")}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("date")} *</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        setDatePickerMode("start");
                        setShowDatePicker(true);
                      }}
                    >
                      <Text style={styles.dateText}>
                        {formData.date.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DatePicker
                        value={formData.date}
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            handleInputChange("date", selectedDate);
                            if (
                              datePickerMode === "start" &&
                              !formData.dateEnd
                            ) {
                              handleInputChange("dateEnd", selectedDate);
                            }
                          }
                        }}
                      />
                    )}
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        setDatePickerMode("end");
                        setShowDatePicker(true);
                      }}
                    >
                      <Text style={styles.dateText}>
                        {t("endDate")}:{" "}
                        {formData.dateEnd?.toLocaleDateString() ||
                          formData.date.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t("moderator")}</Text>
                  <Select
                    placeholder={t("username")}
                    options={users
                      .filter((u) => u.id !== user.id)
                      .map((u) => ({ label: u.username, value: u.id }))}
                    value={formData.moderatorsIds}
                    setValue={(val) => handleInputChange("moderatorsIds", val)}
                    multiple
                  />
                </View>

                <View style={styles.formGroup}>
                  <Switch
                    title={t("internal")}
                    value={formData.isInternal}
                    setValue={(val) => handleInputChange("isInternal", val)}
                  />
                  <Switch
                    title={t("childlikeTournament")}
                    value={formData.isAdditions["isChildlike"]}
                    setValue={(val) => handleAdditions("isChildlike", val)}
                  />
                  <Switch
                    title={t("city")}
                    value={formData.isAdditions["isCity"]}
                    setValue={(val) => handleAdditions("isCity", val)}
                  />
                  <Switch
                    title={t("fullName")}
                    value={formData.isAdditions["isFullName"]}
                    setValue={(val) => handleAdditions("isFullName", val)}
                  />
                  <Switch
                    title={t("phone")}
                    value={formData.isAdditions["isPhone"]}
                    setValue={(val) => handleAdditions("isPhone", val)}
                  />
                  <Switch
                    title={t("otherContacts")}
                    value={formData.isAdditions["isOtherContacts"]}
                    setValue={(val) => handleAdditions("isOtherContacts", val)}
                  />
                  <Switch
                    title={t("weaponsRental")}
                    value={formData.isAdditions["isWeaponsRental"]}
                    setValue={(val) => handleAdditions("isWeaponsRental", val)}
                  />
                  <Switch
                    title={t("ruleAndPolicy")}
                    value={formData.isAdditions["isRuleAndPolicy"]}
                    setValue={(val) => handleAdditions("isRuleAndPolicy", val)}
                  />
                </View>
              </View>
            )}

            {currentStep === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  {t("weaponsAndNominations")}
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t("weapons")} *</Text>
                  <Select
                    options={weaponOptions}
                    value={formData.weaponsIds.map((id) => id.toString())}
                    setValue={(val) =>
                      handleInputChange(
                        "weaponsIds",
                        Array.isArray(val)
                          ? val.map((v) => parseInt(v))
                          : [parseInt(val)],
                      )
                    }
                    placeholder={t("selectWeapon")}
                    multiple
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t("nominations")} *</Text>
                  <View style={styles.nominationsGrid}>
                    {nominations
                      .filter((nom) =>
                        formData.weaponsIds.includes(nom.weapon.id),
                      )
                      .map((nomination) => (
                        <Checkbox
                          key={nomination.id}
                          title={nomination.title}
                          value={nomination.id}
                          values={formData.nominationsIds}
                          setValue={(val: number[]) =>
                            handleInputChange("nominationsIds", val)
                          }
                        />
                      ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    {t("expectedParticipants")} *
                  </Text>
                  {formData.nominationsIds.map((nomId, idx) => (
                    <View key={idx} style={styles.row}>
                      <Text style={styles.nominationTitle}>
                        {nominations.find((nom) => nom.id === nomId)?.title}
                      </Text>
                      <InputNumber
                        value={formData.participantsCount[nomId] || 0}
                        setValue={(count) => {
                          setFormData((state) => ({
                            ...state,
                            participantsCount: {
                              ...state.participantsCount,
                              [nomId]: count,
                            },
                          }));
                        }}
                      />
                    </View>
                  ))}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t("price")} *</Text>
                  <Select
                    options={CURRENCY_CODES.map((code) => ({
                      label: code,
                      value: code,
                    }))}
                    value={formData.currency}
                    setValue={(val) => handleInputChange("currency", val)}
                  />
                  {formData.nominationsIds.map((nomId, idx) => (
                    <View key={idx} style={styles.row}>
                      <Text style={styles.nominationTitle}>
                        {nominations.find((nom) => nom.id === nomId)?.title}
                      </Text>
                      <InputNumber
                        max={100000}
                        value={formData.prices[nomId] || 0}
                        setValue={(count) => {
                          setFormData((state) => ({
                            ...state,
                            prices: { ...state.prices, [nomId]: count },
                          }));
                        }}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {currentStep === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t("additionalInfo")}</Text>

                <ImageUploader
                  value={formData.image ? api.covers + formData.image : null}
                  setFileName={(name) => handleInputChange("image", name)}
                  setValue={setCover}
                />

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t("socialLinks")}</Text>
                  <View style={styles.socialInput}>
                    <InputText
                      value={socialLink}
                      setValue={setSocialLink}
                      placeholder="https://vk.com/..."
                      style={styles.socialInputField}
                    />
                    <InputText
                      value={socialLinkText}
                      setValue={setSocialLinkText}
                      placeholder={t("linkText")}
                      style={styles.socialInputField}
                    />
                    <Button
                      title={t("add")}
                      onPress={handleAddSocialLink}
                      disabled={!socialLink}
                    >
                      <Plus size={20} color={Colors.fg} />
                    </Button>
                  </View>

                  <LinksList
                    links={formData.socialMedias}
                    texts={formData.socialMediasText}
                    setLinks={(links) => {
                      handleRemoveSocialLink(links);
                    }}
                    setTexts={(texts) => {
                      handleRemoveSocialLinkText(texts);
                    }}
                  />
                </View>
              </View>
            )}

            {/* Navigation */}
            <View style={styles.navigation}>
              {currentStep > 1 && (
                <Button
                  title={t("back")}
                  onPress={() => setCurrentStep((prev) => prev - 1)}
                  stroke
                >
                  <ArrowLeft size={20} color={Colors.fg} />
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  title={t("next")}
                  onPress={() => setCurrentStep((prev) => prev + 1)}
                  disabled={!isStepValid(currentStep)}
                >
                  <ArrowRight size={20} color={Colors.fg} />
                </Button>
              ) : (
                <Button
                  title={
                    currentTournament ? t("updateData") : t("createTournament")
                  }
                  onPress={handleSubmit}
                  loading={loading}
                >
                  <CirclePlus size={20} color={Colors.fg} />
                </Button>
              )}
            </View>
          </Section>

          {/* Modals */}
          <ModalWindow
            isOpen={showMarkdown}
            onClose={() => setShowMarkdown(false)}
          >
            <Section title={t("description")}>
              <Markdown text={formData.description} />
            </Section>
          </ModalWindow>

          <ModalWindow isOpen={showDelete} onClose={() => setShowDelete(false)}>
            <Section title={t("realyDelete")}>
              <Button
                title={t("delete")}
                onPress={async () => {
                  setLoading(true);
                  try {
                    await deleteTournament(currentTournament!.id);
                    setCurrentTournament(undefined);
                    Toast.show({
                      type: "success",
                      text1: t("success"),
                      text2: t("deleted"),
                    });
                    setShowDelete(false);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Trash2 size={20} color="#fff" />
              </Button>
            </Section>
          </ModalWindow>
        </>
      )}

      {activeTab === "participants" && participants && currentTournament && (
        <>
          {Object.keys(participants)
            .filter((nomId) => participants[nomId]?.length)
            .map((nomId) => (
              <Section
                key={nomId}
                title={
                  currentTournament.nominations.find(
                    (nom) => nom.id === Number(nomId),
                  )?.title
                }
              >
                {participants[nomId].map((p) => (
                  <View key={p.id} style={styles.participantRow}>
                    <Text style={styles.participantName}>{p.username}</Text>
                    <View style={styles.participantControls}>
                      <TouchableOpacity
                        onPress={() =>
                          handleUpdateParticipantStatus(
                            currentTournament.id,
                            nomId,
                            p.id,
                            ParticipantStatus.CONFIRMED,
                          )
                        }
                      >
                        <CheckCircle
                          size={24}
                          color={
                            p.status === ParticipantStatus.CONFIRMED
                              ? Colors.accent
                              : Colors.placeholder
                          }
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          handleUpdateParticipantStatus(
                            currentTournament.id,
                            nomId,
                            p.id,
                            ParticipantStatus.CANCELLED,
                          )
                        }
                      >
                        <Ban
                          size={24}
                          color={
                            p.status === ParticipantStatus.CANCELLED
                              ? Colors.accent
                              : Colors.placeholder
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </Section>
            ))}

          {participantsInfo.map((info) => (
            <Section key={info.id} title={info.user.username}>
              {info.info["trainerName"] && (
                <Text>
                  <Text style={styles.participantField}>
                    {t("trainerName")}:
                  </Text>{" "}
                  {info.info["trainerName"]}
                </Text>
              )}
              {info.info["age"] && (
                <Text>
                  <Text style={styles.participantField}>{t("age")}:</Text>{" "}
                  {info.info["age"]}
                </Text>
              )}
              {info.info["cityId"] && (
                <Text>
                  <Text style={styles.participantField}>{t("city")}:</Text>{" "}
                  {
                    cities.find((city) => city.id === info.info["cityId"])
                      ?.title
                  }
                </Text>
              )}
              {info.info["fullName"] && (
                <Text>
                  <Text style={styles.participantField}>{t("fullName")}:</Text>{" "}
                  {info.info["fullName"]}
                </Text>
              )}
              {info.info["phone"] && (
                <Text>
                  <Text style={styles.participantField}>{t("phone")}:</Text>{" "}
                  {info.info["phone"]}
                </Text>
              )}
              {info.info["otherContacts"] && (
                <Text>
                  <Text style={styles.participantField}>
                    {t("otherContacts")}:
                  </Text>
                  <Text
                    style={styles.link}
                    onPress={() => Linking.openURL(info.info["otherContacts"])}
                  >
                    {info.info["otherContacts"]}
                  </Text>
                </Text>
              )}
              {info.info["weaponsRental"] && (
                <Text>
                  <Text style={styles.participantField}>
                    {t("weaponsRental")}:
                  </Text>{" "}
                  {Object.keys(info.info["weaponsRental"])
                    .filter((key) => info.info["weaponsRental"][key])
                    .join(", ")}
                </Text>
              )}
            </Section>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    fontFamily: Fonts.regular,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: Colors.fg,
    textAlign: "center",
    marginTop: 50,
    marginBottom: 30,
  },
  button: {
    marginVertical: 8,
  },
  progress: {
    marginBottom: 20,
    backgroundColor: Colors.accentTransparent,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  step: {
    alignItems: "center",
    gap: 8,
  },
  activeStep: {},
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bg,
    borderWidth: 2,
    borderColor: Colors.placeholder,
    alignItems: "center",
    justifyContent: "center",
  },
  activeStepNumber: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  stepNumberText: {
    color: Colors.placeholder,
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  activeStepNumberText: {
    color: Colors.fg,
  },
  stepLabel: {
    fontSize: 12,
    color: Colors.placeholder,
  },
  activeStepLabel: {
    color: Colors.accent,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.placeholder,
    opacity: 0.3,
    marginHorizontal: 8,
  },
  activeStepLine: {
    backgroundColor: Colors.accent,
    opacity: 1,
  },
  stepContent: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.fg,
    marginBottom: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.fg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  nominationTitle: {
    flex: 1,
    color: Colors.fg,
  },
  nominationsGrid: {
    gap: 12,
    backgroundColor: Colors.accentTransparent,
    padding: 16,
    borderRadius: 8,
  },
  socialInput: {
    flexDirection: "row",
    gap: 8,
  },
  socialInputField: {
    flex: 1,
  },
  dateButton: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  dateText: {
    color: Colors.fg,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    gap: 16,
  },
  participantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
  },
  participantName: {
    color: Colors.fg,
    fontSize: 16,
  },
  participantControls: {
    flexDirection: "row",
    gap: 16,
  },
  participantField: {
    color: Colors.accent,
    fontFamily: Fonts.bold,
  },
  link: {
    color: Colors.accent,
    textDecorationLine: "underline",
  },
});
