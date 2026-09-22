import { Text, View, StyleSheet } from "react-native";
import SensorProximidade from "@/components/SensorProximidade";

export default function Index() {
  return (
    <View style={styles.container}>
      <SensorProximidade />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
