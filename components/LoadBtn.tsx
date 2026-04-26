import Button from "@/components/ui/Button";
import { Colors } from "@/constants";
import { CircleArrowDown } from "lucide-react-native";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type LoadBtnProps = {
  totalCount: number;
  showCount?: number;
  page: number;
  loadMore: () => void;
  loading: boolean;
};

export default function LoadBtn({
  totalCount,
  page,
  loadMore,
  loading,
  showCount = 10,
}: LoadBtnProps) {
  if (page * showCount >= totalCount) {
    return null;
  }

  return (
    <View style={styles.loadMoreWrapper}>
      <Button
        title=""
        onPress={loadMore}
        disabled={loading}
        style={styles.loadMoreButton}
        stroke
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.accent} />
        ) : (
          <CircleArrowDown size={28} color={Colors.fg} />
        )}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  loadMoreWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  loadMoreButton: {
    minWidth: 200,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
});
