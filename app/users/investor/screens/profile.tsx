import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import InvestorLayout from "../layout";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    user_type: "",
  });
  const [originalData, setOriginalData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    user_type: "",
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        "http://192.168.1.18:8081/user-profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setUserData(response.data.user);
        setOriginalData(response.data.user);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    }
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.put(
        "http://192.168.1.18:8081/update-profile",
        userData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Profile updated successfully");
        setIsEditing(false);
        setOriginalData(userData);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile"
      );
    }
  };

  const handleCancel = () => {
    setUserData(originalData);
    setIsEditing(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        {!isEditing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={100} color="#007AFF" />
        </View>
        <Text
          style={styles.nameText}
        >{`${userData.first_name} ${userData.last_name}`}</Text>
        <Text style={styles.roleText}>{userData.user_type}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.roleText}>{userData.user_type}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={userData.username}
              onChangeText={(text) =>
                setUserData({ ...userData, username: text })
              }
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={userData.email}
              onChangeText={(text) => setUserData({ ...userData, email: text })}
              editable={isEditing}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={userData.first_name}
              onChangeText={(text) =>
                setUserData({ ...userData, first_name: text })
              }
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={userData.last_name}
              onChangeText={(text) =>
                setUserData({ ...userData, last_name: text })
              }
              editable={isEditing}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor: "#FFFFFF",
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  editButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  profileSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  roleText: {
    fontSize: 16,
    color: "#666",
    backgroundColor: "#F8F9FA",
    padding: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  form: {
    padding: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
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
  disabledInput: {
    backgroundColor: "#F8F9FA",
    color: "#666",
  },
  cancelButton: {
    backgroundColor: "#DC3545",
  },
  saveButton: {
    backgroundColor: "#28A745",
  },
  cancelButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
