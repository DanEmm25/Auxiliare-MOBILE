import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import EntrepreneurLayout from "../layout";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

interface DashboardData {
  metrics: {
    totalProjects: number;
    activeProjects: number;
    fundedProjects: number;
    totalFunding: number;
  };
  recentProjects: Array<{
    id: number;
    title: string;
    category: string;
    funding_goal: number;
    start_date: string;
    end_date: string;
  }>;
}

const MetricCard = ({ title, value, icon }) => (
  <View style={styles.metricCard}>
    <Ionicons name={icon} size={24} color="#007AFF" />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
  </View>
);

const SectionHeader = ({ title, actionText }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity>
      <Text style={styles.sectionAction}>{actionText}</Text>
    </TouchableOpacity>
  </View>
);

export default function EntrepreneurDashboard() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");
      
      if (!token || !userStr) {
        console.error("No token or user data found");
        return;
      }

      const user = JSON.parse(userStr);
      setUserName(user.username);

      const response = await axios.get(
        `http://192.168.1.46:8081/dashboard-data/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  }, []);

  if (loading) {
    return (
      <EntrepreneurLayout>
        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      </EntrepreneurLayout>
    );
  }

  return (
    <EntrepreneurLayout>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back, {userName}!</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Projects"
            value={dashboardData?.metrics.totalProjects || 0}
            icon="folder"
          />
          <MetricCard
            title="Active Projects"
            value={dashboardData?.metrics.activeProjects || 0}
            icon="rocket"
          />
          <MetricCard
            title="Funded Projects"
            value={dashboardData?.metrics.fundedProjects || 0}
            icon="cash"
          />
          <MetricCard
            title="Total Funding"
            value={`₱${(dashboardData?.metrics.totalFunding || 0).toLocaleString()}`}
            icon="trending-up"
          />
        </View>

        <SectionHeader title="Recent Projects" actionText="View All" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dashboardData?.recentProjects.map((project) => (
            <View key={project.id} style={styles.projectCard}>
              <Text style={styles.projectName}>{project.title}</Text>
              <Text style={styles.projectCategory}>{project.category}</Text>
              <Text style={styles.projectFunding}>
                Goal: ₱{project.funding_goal.toLocaleString()}
              </Text>
              <Text style={styles.projectDates}>
                {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </EntrepreneurLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth:
      Platform.OS === "web" ? 200 : (Dimensions.get("window").width - 48) / 2,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  sectionAction: {
    fontSize: 14,
    color: "#007AFF",
  },
  milestonesContainer: {
    padding: 20,
  },
  pitchSessionsContainer: {
    padding: 20,
  },
  projectCard: {
    width: 200,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  projectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  projectStatus: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  milestoneItem: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  milestoneDueDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  pitchSessionItem: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pitchSessionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  pitchSessionDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  projectCategory: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  projectFunding: {
    fontSize: 14,
    color: "#007AFF",
    marginTop: 4,
    fontWeight: "600",
  },
  projectDates: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});
