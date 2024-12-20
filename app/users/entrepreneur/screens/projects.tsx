import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Dimensions,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import EntrepreneurLayout from "../layout";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const categories = [
  "Education",
  "Healthcare",
  "Technology",
  "Environment",
  "Finance",
];

export default function Projects() {
  const [mode, setMode] = useState("list"); // 'list' or 'create'
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    fundingGoal: "",
    category: "Education",
    startDate: new Date(),
    endDate: new Date(),
  });
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState({
    start: false,
    end: false,
  });
  const [tempDate, setTempDate] = useState({
    start: new Date(),
    end: new Date(),
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");
      const user = JSON.parse(userStr);

      const response = await axios.get(
        `http://192.168.1.18:8081/user-projects/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProjects(response.data.projects);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch projects");
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  }, []);

  const validateForm = () => {
    if (!projectData.title.trim()) {
      Alert.alert("Error", "Please enter a project title");
      return false;
    }
    if (!projectData.description.trim()) {
      Alert.alert("Error", "Please enter a project description");
      return false;
    }
    if (!projectData.fundingGoal || parseFloat(projectData.fundingGoal) <= 0) {
      Alert.alert("Error", "Please enter a valid funding goal");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");

      console.log("Stored token:", token);
      console.log("Stored user:", userStr);

      if (!token || !userStr) {
        alert(
          "Authentication token or user data missing. Please log in again."
        );
        return;
      }

      const user = JSON.parse(userStr);
      console.log("Parsed user data:", user);

      const projectDataToSend = {
        title: projectData.title,
        description: projectData.description,
        funding_goal: parseFloat(projectData.fundingGoal),
        category: projectData.category,
        start_date: projectData.startDate.toISOString().split("T")[0],
        end_date: projectData.endDate.toISOString().split("T")[0],
      };

      console.log("Sending project data:", projectDataToSend);
      console.log("Using authorization token:", token);

      const response = await axios.post(
        "http://192.168.1.18:8081/create-project",
        projectDataToSend,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Server response:", response.data);

      if (response.data.success) {
        alert("Project created successfully!");
        // Optionally clear the form
        setProjectData({
          title: "",
          description: "",
          fundingGoal: "",
          category: "Education",
          startDate: new Date(),
          endDate: new Date(),
        });
        await fetchProjects();
        setMode("list");
      } else {
        alert("Failed to create project: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Error creating project:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while creating the project.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDateConfirm = (type: "start" | "end") => {
    setProjectData((prev) => ({
      ...prev,
      [type === "start" ? "startDate" : "endDate"]: tempDate[type],
    }));
    setDatePickerVisible((prev) => ({ ...prev, [type]: false }));
  };

  const renderProjectCard = (project) => (
    <View key={project.id} style={styles.projectCard}>
      <View style={styles.projectHeader}>
        <Text style={styles.projectTitle} numberOfLines={1}>
          {project.title}
        </Text>
        <Text style={styles.projectCategory}>{project.category}</Text>
      </View>

      <Text style={styles.projectDescription} numberOfLines={2}>
        {project.description}
      </Text>

      <View style={styles.projectStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Goal</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            ₱{Number(project.funding_goal).toLocaleString()}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            ₱{Number(project.current_funding || 0).toLocaleString()}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Investors</Text>
          <Text style={styles.statValue}>{project.total_investors || 0}</Text>
        </View>
      </View>

      <View style={styles.projectDates}>
        <Text style={styles.dateText}>
          {new Date(project.start_date).toLocaleDateString()} -
          {new Date(project.end_date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <EntrepreneurLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Projects</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setMode(mode === "list" ? "create" : "list")}
          >
            <Text style={styles.createButtonText}>
              {mode === "list" ? "+" : "←"}
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "list" ? (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            style={styles.projectsList}
            contentContainerStyle={styles.projectsListContent}
          >
            {projects.map(renderProjectCard)}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.formContainer}
            contentContainerStyle={styles.formContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Create New Project</Text>
              <Text style={styles.headerSubtitle}>
                Launch your next big idea
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Project Title</Text>
                <TextInput
                  style={styles.input}
                  value={projectData.title}
                  onChangeText={(text) =>
                    setProjectData({ ...projectData, title: text })
                  }
                  placeholder="Enter a compelling title for your project"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={projectData.description}
                  onChangeText={(text) =>
                    setProjectData({ ...projectData, description: text })
                  }
                  placeholder="Describe your project in detail"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Funding Goal (₱)</Text>
                  <TextInput
                    style={[styles.input, styles.numberInput]}
                    value={projectData.fundingGoal}
                    onChangeText={(text) =>
                      setProjectData({
                        ...projectData,
                        fundingGoal: text.replace(/[^0-9]/g, ""),
                      })
                    }
                    placeholder="0"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Category</Text>
                  {Platform.OS === "ios" ? (
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => {
                        // Add modal picker for iOS
                        Alert.alert(
                          "Select Category",
                          "",
                          categories.map((category) => ({
                            text: category,
                            onPress: () =>
                              setProjectData({ ...projectData, category }),
                          }))
                        );
                      }}
                    >
                      <Text style={styles.pickerButtonText}>
                        {projectData.category}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={projectData.category}
                        onValueChange={(value) =>
                          setProjectData({ ...projectData, category: value })
                        }
                        style={styles.picker}
                      >
                        {categories.map((category) => (
                          <Picker.Item
                            key={category}
                            label={category}
                            value={category}
                          />
                        ))}
                      </Picker>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setTempDate((prev) => ({
                        ...prev,
                        start: projectData.startDate,
                      }));
                      setDatePickerVisible((prev) => ({
                        ...prev,
                        start: true,
                      }));
                    }}
                  >
                    <Text style={styles.dateButtonText}>
                      {projectData.startDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>End Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setTempDate((prev) => ({
                        ...prev,
                        end: projectData.endDate,
                      }));
                      setDatePickerVisible((prev) => ({ ...prev, end: true }));
                    }}
                  >
                    <Text style={styles.dateButtonText}>
                      {projectData.endDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                </View>

                {Platform.OS === "ios" && (
                  <>
                    <Modal
                      transparent
                      visible={datePickerVisible.start}
                      animationType="slide"
                    >
                      <View style={styles.datePickerModal}>
                        <View style={styles.datePickerContainer}>
                          <View style={styles.datePickerHeader}>
                            <TouchableOpacity
                              onPress={() =>
                                setDatePickerVisible((prev) => ({
                                  ...prev,
                                  start: false,
                                }))
                              }
                            >
                              <Text style={styles.datePickerCancelText}>
                                Cancel
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDateConfirm("start")}
                            >
                              <Text style={styles.datePickerDoneText}>
                                Done
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <DateTimePicker
                            value={tempDate.start}
                            mode="date"
                            display="spinner"
                            onChange={(event, date) => {
                              if (date)
                                setTempDate((prev) => ({
                                  ...prev,
                                  start: date,
                                }));
                            }}
                            minimumDate={new Date()}
                            style={styles.datePickerIOS}
                          />
                        </View>
                      </View>
                    </Modal>

                    <Modal
                      transparent
                      visible={datePickerVisible.end}
                      animationType="slide"
                    >
                      <View style={styles.datePickerModal}>
                        <View style={styles.datePickerContainer}>
                          <View style={styles.datePickerHeader}>
                            <TouchableOpacity
                              onPress={() =>
                                setDatePickerVisible((prev) => ({
                                  ...prev,
                                  end: false,
                                }))
                              }
                            >
                              <Text style={styles.datePickerCancelText}>
                                Cancel
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDateConfirm("end")}
                            >
                              <Text style={styles.datePickerDoneText}>
                                Done
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <DateTimePicker
                            value={tempDate.end}
                            mode="date"
                            display="spinner"
                            onChange={(event, date) => {
                              if (date)
                                setTempDate((prev) => ({ ...prev, end: date }));
                            }}
                            minimumDate={tempDate.start}
                            style={styles.datePickerIOS}
                          />
                        </View>
                      </View>
                    </Modal>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Launch Project</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}
      </View>
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666666",
  },
  card: {
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
  row: {
    flexDirection: "row",
    marginHorizontal: -8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1A1A1A",
  },
  input: {
    backgroundColor: "#FFFFFF",
    padding: Platform.OS === "ios" ? 16 : 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontSize: Platform.OS === "ios" ? 16 : 14,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  numberInput: {
    textAlign: "right",
    paddingRight: Platform.OS === "ios" ? 16 : 12,
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  dateButton: {
    backgroundColor: "#FFFFFF",
    padding: Platform.OS === "ios" ? 16 : 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateButtonText: {
    fontSize: Platform.OS === "ios" ? 16 : 14,
    color: "#1A1A1A",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  projectCategory: {
    fontSize: 12,
    color: "#4CAF50",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  projectDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
  },
  projectStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEEEEE",
    paddingVertical: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  projectDates: {
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  projectsListContent: {
    paddingBottom: 20,
  },

  formContentContainer: {
    paddingBottom: 40,
  },

  pickerButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  pickerButtonText: {
    fontSize: 16,
    color: "#1A1A1A",
  },

  datePickerModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  datePickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },

  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  datePickerCancelText: {
    color: "#FF3B30",
    fontSize: 17,
    fontWeight: "600",
  },

  datePickerDoneText: {
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "600",
  },

  datePickerIOS: {
    height: 216,
    width: "100%",
  },
});
