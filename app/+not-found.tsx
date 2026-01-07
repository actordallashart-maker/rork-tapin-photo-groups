import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go back home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
  },
  linkText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
