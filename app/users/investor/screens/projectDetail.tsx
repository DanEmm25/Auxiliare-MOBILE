import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProjectDetail = () => {
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investAmount, setInvestAmount] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch(
          `http://192.168.1.46:8081/projects/${id}`,
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

    const fetchBalance = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch("http://192.168.1.46:8081/user-balance", {
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
      const response = await fetch("http://192.168.1.46:8081/invest", {
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
        setInvestAmount('');
        // Refresh user balance
        fetchBalance();
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
    <View style={styles.container}>
      <Text style={styles.title}>{project.title}</Text>
      <Text style={styles.description}>{project.description}</Text>
      <Text style={styles.category}>Category: {project.category}</Text>
      <Text style={styles.fundingGoal}>
        Funding Goal: ₱{project.funding_goal}
      </Text>
      <Text style={styles.dates}>
        Start Date: {new Date(project.start_date).toLocaleDateString()}
      </Text>
      <Text style={styles.dates}>
        End Date: {new Date(project.end_date).toLocaleDateString()}
      </Text>
      {/* Add other project details as needed */}
      <View style={styles.investmentSection}>
        <Text style={styles.balanceText}>Your Balance: ₱{userBalance}</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter investment amount"
          keyboardType="decimal-pad"
          value={investAmount}
          onChangeText={setInvestAmount}
        />
        <TouchableOpacity style={styles.investButton} onPress={handleInvest}>
          <Text style={styles.investButtonText}>Invest Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ...existing code...
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
  },
  description: {
    fontSize: 16,
    color: "#666666",
    marginTop: 12,
    lineHeight: 22,
  },
  category: {
    fontSize: 14,
    color: "#999999",
    marginTop: 8,
  },
  fundingGoal: {
    fontSize: 16,
    color: "#333333",
    marginTop: 8,
  },
  dates: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  investButton: {
    marginTop: 24,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  investButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  investmentSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  balanceText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
});

export default ProjectDetail;
