import ProfilePage from "@/components/ProfilePage";
import { useUser } from "@/hooks/useUsers";
import { useLocalSearchParams } from "expo-router";

export default function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { user } = useUser(id);

  return <ProfilePage user={user} />;
}
