import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import EntrepreneurLayout from "../layout";
import { useRouter } from "expo-router";

interface Project {
  id: number;
  title: string;
  description: string;
  funding_goal: number;
  category: string;
  start_date: string;
  end_date: string;
  created_at: string;
  current_funding?: number;
  total_investors?: number;
}

const ProgressBar = ({ current, goal }) => {
  const progress = Math.min((current / goal) * 100, 100);
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
      <Text style={styles.progressText}>
        ₱{current.toLocaleString()} of ₱{goal.toLocaleString()} ({progress.toFixed(1)}%)
      </Text>
    </View>
  );
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editedProject, setEditedProject] = useState({
    title: "",
    description: "",
    funding_goal: "",
    category: "",
    start_date: "",
    end_date: "",
  });
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");

      if (!token || !userStr) {
        setError("Authentication required");
        return;
      }

      const user = JSON.parse(userStr);
      const response = await axios.get(
        `http://192.168.1.46:8081/user-projects/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Transform the projects data to include current_funding and total_investors
        const projectsWithInvestments = await Promise.all(
          response.data.projects.map(async (project) => {
            const investmentsResponse = await axios.get(
              `http://192.168.1.46:8081/projects/${project.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            return {
              ...project,
              current_funding: investmentsResponse.data.project.current_funding || 0,
              total_investors: investmentsResponse.data.project.total_investors || 0,
            };
          })
        );
        setProjects(projectsWithInvestments);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setEditedProject({
      title: project.title,
      description: project.description,
      funding_goal: project.funding_goal.toString(),
      category: project.category,
      start_date: project.start_date,
      end_date: project.end_date,
    });
    setModalVisible(true);
  };

  const handleDelete = async (projectId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        alert("Authentication token missing");
        return;
      }

      const response = await axios.delete(
        `http://192.168.1.46:8081/delete-project/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Project deleted successfully!");
        fetchProjects();
      } else {
        alert("Failed to delete project: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Error deleting project:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while deleting the project.";
      alert(errorMessage);
    }
  };

  const saveEdit = async () => {
    if (!selectedProject) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        alert("Authentication token missing");
        return;
      }

      const projectDataToSend = {
        title: editedProject.title,
        description: editedProject.description,
        funding_goal: parseFloat(editedProject.funding_goal),
        category: editedProject.category,
        start_date: editedProject.start_date,
        end_date: editedProject.end_date,
      };

      const response = await axios.put(
        `http://192.168.1.46:8081/update-project/${selectedProject.id}`,
        projectDataToSend,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert("Project updated successfully!");
        setModalVisible(false);
        fetchProjects();
      } else {
        alert("Failed to update project: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Error updating project:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while updating the project.";
      alert(errorMessage);
    }
  };

  if (loading && !refreshing) {
    return (
      <EntrepreneurLayout>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
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
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Projects</Text>
            <Text style={styles.headerSubtitle}>Manage your crowdfunding campaigns</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push("/users/entrepreneur/screens/projects")}
          >
            <Text style={styles.createButtonText}>+ New Project</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No projects yet</Text>
            <Text style={styles.emptyStateSubtext}>Start by creating your first project</Text>
          </View>
        ) : (
          <View style={styles.projectsGrid}>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryText}>{project.category}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: new Date(project.end_date) >= new Date() ? '#E8F5E9' : '#FFEBEE' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: new Date(project.end_date) >= new Date() ? '#2E7D32' : '#C62828' }
                    ]}>
                      {new Date(project.end_date) >= new Date() ? 'ACTIVE' : 'ENDED'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.projectDescription} numberOfLines={2}>
                  {project.description}
                </Text>

                <View style={styles.fundingSection}>
                  <Text style={styles.sectionTitle}>Funding Progress</Text>
                  <ProgressBar current={project.current_funding} goal={project.funding_goal} />
                </View>

                <View style={styles.projectMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>
                      {formatCurrency(project.funding_goal)}
                    </Text>
                    <Text style={styles.metricLabel}>Goal</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>
                      {project.total_investors}
                    </Text>
                    <Text style={styles.metricLabel}>Investors</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>
                      {Math.max(0, Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24)))}
                    </Text>
                    <Text style={styles.metricLabel}>Days Left</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(project)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(project.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Project</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              value={editedProject.title}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, title: text })
              }
            />
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={4}
              value={editedProject.description}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, description: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Funding Goal"
              keyboardType="numeric"
              value={editedProject.funding_goal}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, funding_goal: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Category"
              value={editedProject.category}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, category: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Start Date (YYYY-MM-DD)"
              value={editedProject.start_date}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, start_date: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="End Date (YYYY-MM-DD)"
              value={editedProject.end_date}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, end_date: text })
              }
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </EntrepreneurLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666666",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#666666",
  },
  projectsGrid: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
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
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  projectDescription: {
    fontSize: 16,
    color: "#4A4A4A",
    lineHeight: 24,
    marginBottom: 16,
  },
  projectMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  metricItem: {
    alignItems: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: "#666666",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  editButton: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  editButtonText: {
    color: "#1A1A1A",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#C62828",
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  noProjectsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    flex: 0.45,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#A9A9A9",
    padding: 10,
    borderRadius: 5,
    flex: 0.45,
    alignItems: "center",
  },
  progressContainer: {
    height: 24,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    color: '#333333',
    fontWeight: '600',
  },
  fundingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  projectMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666666',
  },
});
