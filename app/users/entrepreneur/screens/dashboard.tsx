import React from "react";
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

// Mock data - replace with actual API calls
const dashboardData = {
  userName: "Marc",
  metrics: {
    totalProjects: 12,
    activeProjects: 5,
    fundedProjects: 3,
    totalFunding: 150000,
    upcomingMilestones: 5,
  },
  projects: [
    // Mock data
    { id: 1, name: "Project 1", status: "Active" },
    { id: 2, name: "Project 2", status: "Active" },
    { id: 3, name: "Project 3", status: "Active" },
    { id: 4, name: "Project 4", status: "Active" },
    { id: 5, name: "Project 5", status: "Active" },
  ],
  milestones: [
    // Mock data
    { id: 1, name: "Milestone 1", dueDate: "2024-01-01" },
    { id: 2, name: "Milestone 2", dueDate: "2024-02-01" },
    { id: 3, name: "Milestone 3", dueDate: "2024-03-01" },
    { id: 4, name: "Milestone 4", dueDate: "2024-04-01" },
    { id: 5, name: "Milestone 5", dueDate: "2024-05-01" },
  ],
  pitchSessions: [
    // Mock data
    { id: 1, name: "Pitch Session 1", date: "2024-01-01" },
    { id: 2, name: "Pitch Session 2", date: "2024-02-01" },
    { id: 3, name: "Pitch Session 3", date: "2024-03-01" },
    { id: 4, name: "Pitch Session 4", date: "2024-04-01" },
    { id: 5, name: "Pitch Session 5", date: "2024-05-01" },
  ],
};

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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Fetch dashboard data here
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <EntrepreneurLayout>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {dashboardData.userName}!
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Projects"
            value={dashboardData.metrics.totalProjects}
            icon="folder"
          />
          <MetricCard
            title="Active Projects"
            value={dashboardData.metrics.activeProjects}
            icon="rocket"
          />
          <MetricCard
            title="Funded Projects"
            value={dashboardData.metrics.fundedProjects}
            icon="cash"
          />
          <MetricCard
            title="Total Funding"
            value={`₱${dashboardData.metrics.totalFunding.toLocaleString()}`}
            icon="trending-up"
          />

          <MetricCard
            title="Upcoming Milestones"
            value={dashboardData.metrics.upcomingMilestones}
            icon="calendar"
          />
        </View>

        {/* Projects Section */}
        <SectionHeader title="Recent Projects" actionText="View All" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dashboardData.projects.map((project) => (
            <View key={project.id} style={styles.projectCard}>
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.projectStatus}>{project.status}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Milestones Section */}
        <SectionHeader title="Upcoming Milestones" actionText="View All" />
        <View style={styles.milestonesContainer}>
          {dashboardData.milestones.map((milestone) => (
            <View key={milestone.id} style={styles.milestoneItem}>
              <Text style={styles.milestoneName}>{milestone.name}</Text>
              <Text style={styles.milestoneDueDate}>{milestone.dueDate}</Text>
            </View>
          ))}
        </View>

        {/* Pitch Sessions Section */}
        <SectionHeader title="Scheduled Pitches" actionText="Schedule New" />
        <View style={styles.pitchSessionsContainer}>
          {dashboardData.pitchSessions.map((session) => (
            <View key={session.id} style={styles.pitchSessionItem}>
              <Text style={styles.pitchSessionName}>{session.name}</Text>
              <Text style={styles.pitchSessionDate}>{session.date}</Text>
            </View>
          ))}
        </View>
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
});
