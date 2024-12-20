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
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import EntrepreneurLayout from "../layout";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

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
        ₱{current.toLocaleString()} of ₱{goal.toLocaleString()} (
        {progress.toFixed(1)}%)
      </Text>
    </View>
  );
};

const categories = [
  "Education",
  "Healthcare",
  "Technology",
  "Environment",
  "Finance",
];

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
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
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
        `http://192.168.1.18:8081/user-projects/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Transform the projects data to include current_funding and total_investors
        const projectsWithInvestments = await Promise.all(
          response.data.projects.map(async (project) => {
            const investmentsResponse = await axios.get(
              `http://192.168.1.18:8081/projects/${project.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            return {
              ...project,
              current_funding:
                investmentsResponse.data.project.current_funding || 0,
              total_investors:
                investmentsResponse.data.project.total_investors || 0,
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
        `http://192.168.1.18:8081/delete-project/${projectId}`,
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
        `http://192.168.1.18:8081/update-project/${selectedProject.id}`,
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
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Projects</Text>
            <Text style={styles.headerSubtitle}>
              Manage your crowdfunding campaigns
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push("/users/entrepreneur/screens/projects")}
            activeOpacity={0.7}
          >
            <Text style={styles.createButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No projects yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start by creating your first project
            </Text>
          </View>
        ) : (
          <View style={styles.projectsGrid}>
            {projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={styles.projectCard}
                activeOpacity={0.8}
                onPress={() => handleEdit(project)}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryText}>
                        {project.category}
                      </Text>
                    </View>
                  </View>
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
                      {new Date(project.end_date) >= new Date()
                        ? "ACTIVE"
                        : "ENDED"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.projectDescription} numberOfLines={2}>
                  {project.description}
                </Text>

                <View style={styles.fundingSection}>
                  <Text style={styles.sectionTitle}>Funding Progress</Text>
                  <ProgressBar
                    current={project.current_funding}
                    goal={project.funding_goal}
                  />
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
                      {Math.max(
                        0,
                        Math.ceil(
                          (new Date(project.end_date) - new Date()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )}
                    </Text>
                    <Text style={styles.metricLabel}>Days Left</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(project);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
          <View
            style={[
              styles.modalContainer,
              Platform.OS === "ios" && styles.modalContainerIOS,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Project</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.modalLabel}>Title</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editedProject.title}
                    onChangeText={(text) =>
                      setEditedProject({ ...editedProject, title: text })
                    }
                    placeholder="Project Title"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modalLabel}>Description</Text>
                  <TextInput
                    style={[styles.modalInput, styles.textArea]}
                    value={editedProject.description}
                    onChangeText={(text) =>
                      setEditedProject({ ...editedProject, description: text })
                    }
                    placeholder="Project Description"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modalLabel}>Funding Goal (₱)</Text>
                  <TextInput
                    style={[styles.modalInput, styles.numberInput]}
                    value={editedProject.funding_goal}
                    onChangeText={(text) =>
                      setEditedProject({ ...editedProject, funding_goal: text })
                    }
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modalLabel}>Category</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={editedProject.category}
                      onValueChange={(value) =>
                        setEditedProject({ ...editedProject, category: value })
                      }
                      style={styles.picker}
                      itemStyle={styles.pickerItem} // Add this for iOS
                    >
                      {categories.map((category) => (
                        <Picker.Item
                          key={category}
                          label={category}
                          value={category}
                          color="#1A1A1A"
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modalLabel}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {new Date(editedProject.start_date).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={new Date(editedProject.start_date)}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, date) => {
                        setShowStartDatePicker(false);
                        if (date) {
                          setEditedProject({
                            ...editedProject,
                            start_date: date.toISOString().split("T")[0],
                          });
                        }
                      }}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modalLabel}>End Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {new Date(editedProject.end_date).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={new Date(editedProject.end_date)}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, date) => {
                        setShowEndDatePicker(false);
                        if (date) {
                          setEditedProject({
                            ...editedProject,
                            end_date: date.toISOString().split("T")[0],
                          });
                        }
                      }}
                      minimumDate={new Date(editedProject.start_date)}
                    />
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEdit}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
    alignItems: "flex-start",
    padding: Platform.OS === "ios" ? 20 : 16,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: Platform.OS === "ios" ? 34 : 28,
    fontWeight: Platform.OS === "ios" ? "600" : "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Platform.OS === "ios" ? 17 : 16,
    color: "#666666",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    width: Platform.OS === "ios" ? 36 : 40,
    height: Platform.OS === "ios" ? 36 : 40,
    borderRadius: Platform.OS === "ios" ? 18 : 20,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 24 : 28,
    fontWeight: "400",
    lineHeight: Platform.OS === "ios" ? 28 : 32,
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
    borderRadius: Platform.OS === "ios" ? 20 : 16,
    padding: Platform.OS === "ios" ? 24 : 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
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
    borderTopWidth: Platform.OS === "ios" ? StyleSheet.hairlineWidth : 1,
    borderTopColor: Platform.OS === "ios" ? "#C6C6C8" : "#EEEEEE",
  },
  editButton: {
    backgroundColor: Platform.OS === "ios" ? "#E5E5EA" : "#F0F0F0",
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderRadius: Platform.OS === "ios" ? 16 : 8,
    marginRight: 12,
    minWidth: 80,
    alignItems: "center",
  },
  editButtonText: {
    color: "#1A1A1A",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: Platform.OS === "ios" ? "#FFE5E5" : "#FFEBEE",
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderRadius: Platform.OS === "ios" ? 16 : 8,
    minWidth: 80,
    alignItems: "center",
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
  modalContainerIOS: {
    borderRadius: 14,
    padding: 24,
    maxHeight: "80%",
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
    height: Platform.OS === "ios" ? 28 : 24,
    backgroundColor: Platform.OS === "ios" ? "#E5E5EA" : "#F2F2F7",
    borderRadius: Platform.OS === "ios" ? 14 : 12,
    marginVertical: Platform.OS === "ios" ? 12 : 8,
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
  fundingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  projectMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalCloseText: {
    fontSize: 20,
    color: "#666666",
    padding: 8,
  },
  modalScroll: {
    maxHeight: Platform.OS === "ios" ? "70%" : "80%",
  },
  modalContent: {
    paddingVertical: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    marginTop: 4,
    ...Platform.select({
      ios: {
        paddingVertical: 8,
      },
      android: {
        paddingHorizontal: 4,
      },
    }),
  },
  picker: {
    height: Platform.OS === "ios" ? 180 : 50,
    width: "100%",
    backgroundColor: "transparent",
  },
  pickerItem: {
    fontSize: 16,
    height: 120,
  },
  dateButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: Platform.OS === "ios" ? 16 : 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButtonText: {
    color: "#666666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  numberInput: {
    textAlign: "right",
  },
});
