import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProjectDetail = () => {
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
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
  }, [id]);

  const handleInvest = () => {
    // Implement investment logic here
    console.log("Invest button pressed");
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
      <Text style={styles.fundingGoal}>Funding Goal: ${project.funding_goal}</Text>
      <Text style={styles.dates}>
        Start Date: {new Date(project.start_date).toLocaleDateString()}
      </Text>
      <Text style={styles.dates}>
        End Date: {new Date(project.end_date).toLocaleDateString()}
      </Text>
      {/* Add other project details as needed */}
      <TouchableOpacity style={styles.investButton} onPress={handleInvest}>
        <Text style={styles.investButtonText}>Invest Now</Text>
      </TouchableOpacity>
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
});

export default ProjectDetail;
