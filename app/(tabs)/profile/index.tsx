import ProfilePage from "@/components/ProfilePage";
import { userAtom } from "@/store";
import { useAtomValue } from "jotai";

export default function Profile() {
  const meUser = useAtomValue(userAtom);

  return <ProfilePage user={meUser} />;
}
