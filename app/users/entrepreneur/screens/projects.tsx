import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import EntrepreneurLayout from "../layout";
import axios from "axios";

const categories = [
  "Education",
  "Healthcare",
  "Technology",
  "Environment",
  "Finance",
];

export default function Projects() {
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

  const handleSubmit = async () => {
    try {
      const userid = 1;
      const projectDataToSend = {
        user_id: userid, // Use user ID from context
        title: projectData.title,
        description: projectData.description,
        funding_goal: parseFloat(projectData.fundingGoal),
        category: projectData.category,
        start_date: projectData.startDate.toISOString().split("T")[0],
        end_date: projectData.endDate.toISOString().split("T")[0],
      };

      console.log("Sending project data:", projectDataToSend);

      const response = await axios.post(
        "http://192.168.1.45:8081/create-project",
        projectDataToSend,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Server response:", response.data);

      if (response.data.success) {
        alert("Project created successfully!");
      } else {
        alert("Failed to create project: " + response.data.message);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("An error occurred while creating the project.");
    }
  };

  return (
    <EntrepreneurLayout>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create New Project</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Title</Text>
            <TextInput
              style={styles.input}
              value={projectData.title}
              onChangeText={(text) =>
                setProjectData({ ...projectData, title: text })
              }
              placeholder="Enter project title"
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
              placeholder="Describe your project"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Funding Goal (₱)</Text>
            <TextInput
              style={styles.input}
              value={projectData.fundingGoal}
              onChangeText={(text) =>
                setProjectData({ ...projectData, fundingGoal: text })
              }
              placeholder="Enter amount"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDate(true)}
            >
              <Text>{projectData.startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showStartDate && (
              <DateTimePicker
                value={projectData.startDate}
                mode="date"
                onChange={(event, date) => {
                  setShowStartDate(false);
                  if (date) setProjectData({ ...projectData, startDate: date });
                }}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDate(true)}
            >
              <Text>{projectData.endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showEndDate && (
              <DateTimePicker
                value={projectData.endDate}
                mode="date"
                onChange={(event, date) => {
                  setShowEndDate(false);
                  if (date) setProjectData({ ...projectData, endDate: date });
                }}
              />
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Create Project</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </EntrepreneurLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  input: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  picker: {
    height: 50,
  },
  dateButton: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
