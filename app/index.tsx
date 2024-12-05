import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#f8f9ff", "#eef1ff"]} style={styles.gradient}>
        {/* Header */}
        <Header />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Where Vision Meets Investment</Text>
          <Text style={styles.heroSubtitle}>
            Connect with investors, fund your vision, and grow your business.
          </Text>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Footer />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginBottom: 32,
    lineHeight: 24,
  },
  getStartedButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  getStartedButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
