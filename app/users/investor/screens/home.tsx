import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
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

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch("http://192.168.1.18:8081/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setProjects(data.projects);
        } else {
          console.error("Error fetching projects:", data.message);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const renderProject = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push(`/users/investor/screens/projectDetail?id=${item.id}`)
      }
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                new Date(item.end_date) >= new Date() ? "#E8F5E9" : "#FFEBEE",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  new Date(item.end_date) >= new Date() ? "#2E7D32" : "#C62828",
              },
            ]}
          >
            {new Date(item.end_date) >= new Date() ? "ACTIVE" : "ENDED"}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.fundingInfo}>
        <ProgressBar current={item.current_funding} goal={item.funding_goal} />
        <View style={styles.statsRow}>
          <Text style={styles.investors}>
            {item.total_investors} investor
            {item.total_investors !== 1 ? "s" : ""}
          </Text>
          <Text style={styles.daysLeft}>
            {Math.max(
              0,
              Math.ceil(
                (new Date(item.end_date) - new Date()) / (1000 * 60 * 60 * 24)
              )
            )}{" "}
            days left
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Investment Opportunities</Text>
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        style={styles.navigateButton}
        onPress={() => router.push("/users/investor/screens/portfolio")}
      >
        <Text style={styles.navigateButtonText}>View Portfolio</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 20,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    color: "#4A4A4A",
    lineHeight: 24,
    marginBottom: 16,
  },
  fundingInfo: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  investors: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  daysLeft: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#4A4A4A",
    fontWeight: "500",
    marginTop: 8,
  },
  navigateButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  navigateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Home;
