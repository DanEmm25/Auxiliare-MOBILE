import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProgressBar = ({ current, goal }) => {
  const progress = Math.min((current / goal) * 100, 100);
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
      <Text style={styles.progressText}>
        ₱{current.toLocaleString()} of ₱{goal.toLocaleString()} (
        {progress.toFixed(1)}%)
      </Text>
    </View>
  );
};

const ProjectDetail = () => {
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investAmount, setInvestAmount] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const router = useRouter();

  const fetchBalance = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch("http://192.168.0.120:8081/user-balance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch(
          `http://192.168.0.120:8081/projects/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          setProject(data.project);
        } else {
          console.error("Error fetching project:", data.message);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
    fetchBalance();
  }, [id]);

  const handleInvest = async () => {
    if (!investAmount || parseFloat(investAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (parseFloat(investAmount) > userBalance) {
      Alert.alert("Error", "Insufficient balance");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch("http://192.168.0.120:8081/invest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: id,
          investment_amount: parseFloat(investAmount),
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert(
          "Investment Successful",
          "Your investment has been processed successfully. View it in the Investments tab.",
          [
            {
              text: "View Investments",
              onPress: () => router.push("/users/investor/screens/investments"),
            },
            { text: "Stay Here", style: "cancel" },
          ]
        );
        setInvestAmount("");
        await fetchBalance();
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      console.error("Investment error:", error);
      Alert.alert("Error", "Failed to process investment");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Text>Project not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{project.title}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                new Date(project.end_date) >= new Date()
                  ? "#E8F5E9"
                  : "#FFEBEE",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  new Date(project.end_date) >= new Date()
                    ? "#2E7D32"
                    : "#C62828",
              },
            ]}
          >
            {new Date(project.end_date) >= new Date() ? "ACTIVE" : "ENDED"}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.description}>{project.description}</Text>
        <View style={styles.categoryChip}>
          <Text style={styles.categoryText}>{project.category}</Text>
        </View>
      </View>

      <View style={styles.fundingCard}>
        <Text style={styles.sectionTitle}>Funding Progress</Text>
        <ProgressBar
          current={project.current_funding}
          goal={project.funding_goal}
        />
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{project.total_investors}</Text>
            <Text style={styles.statLabel}>Investors</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.max(
                0,
                Math.ceil(
                  (new Date(project.end_date) - new Date()) /
                    (1000 * 60 * 60 * 24)
                )
              )}
            </Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {((project.current_funding / project.funding_goal) * 100).toFixed(
                1
              )}
              %
            </Text>
            <Text style={styles.statLabel}>Funded</Text>
          </View>
        </View>
      </View>

      <View style={styles.investCard}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Your Balance:</Text>
          <Text style={styles.balanceValue}>₱{userBalance.toFixed(2)}</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter investment amount"
          keyboardType="decimal-pad"
          value={investAmount}
          onChangeText={setInvestAmount}
        />
        <TouchableOpacity
          style={[
            styles.investButton,
            new Date(project.end_date) < new Date() && styles.disabledButton,
          ]}
          onPress={handleInvest}
          disabled={new Date(project.end_date) < new Date()}
        >
          <Text style={styles.investButtonText}>
            {new Date(project.end_date) >= new Date()
              ? "Invest Now"
              : "Project Ended"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fundingCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  investCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#4A4A4A",
    lineHeight: 24,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 14,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: "#666666",
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4CAF50",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  investButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  investButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressContainer: {
    height: 24,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden",
  },
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
  },
  progressText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 12,
    color: "#333333",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProjectDetail;
