import axios from "axios";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UserIcon,
  MailIcon,
  UserCircleIcon,
  UsersIcon,
  CheckIcon,
} from "lucide-react-native";
import { useRouter } from "expo-router";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Update API URL configuration
  const API_URL = __DEV__
    ? Platform.select({
        android: "http://192.168.1.50:8081", // Replace with your computer's IP address
        ios: "http://192.168.1.50:8081", // Replace with your computer's IP address
        default: "http://192.168.1.50:8081",
      })
    : "http://your-production-url.com";

  console.log("API_URL:", API_URL); // Add this line to log the API_URL

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (
        !username ||
        !email ||
        !password ||
        !firstName ||
        !lastName ||
        !userType
      ) {
        alert("All fields are required");
        return;
      }

      if (!isChecked) {
        alert("You must agree to the Terms of Service and Privacy Policy");
        return;
      }

      // Log the data being sent
      const registrationData = {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        user_type: userType,
      };
      console.log("Sending registration data:", registrationData);

      console.log("Connecting to:", `${API_URL}/register`); // Ensure this is /register

      const response = await axios.post(
        `${API_URL}/register`, // Ensure this is /register
        registrationData,
        {
          timeout: 20000, // Increased timeout to 20 seconds
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Server response:", response.data);

      if (response.data.success) {
        alert("Registration successful!");
        router.push("/auth/login");
      }
    } catch (error: any) {
      console.error("Full error object:", error);

      if (error.response) {
        // Server responded with error
        console.error("Server error response:", error.response.data);
        alert(error.response.data.message || "Registration failed!");
      } else if (error.request) {
        // Request made but no response
        console.error("No response received:", error.request);
        alert("No response from server. Please try again.");
      } else {
        // Error in request setup
        console.error("Request setup error:", error.message);
        alert("Error setting up request: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Your Account</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <UserIcon style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <MailIcon style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <LockIcon style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.iconButton}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              Must be at least 8 characters long, include a number and a capital
              letter.
            </Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <LockIcon style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                secureTextEntry
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrapper}>
              <UserCircleIcon style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrapper}>
              <UserCircleIcon style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>User Type</Text>
            <View style={styles.inputWrapper}>
              <UsersIcon style={styles.icon} />
              <Picker
                selectedValue={userType}
                onValueChange={(itemValue) => setUserType(itemValue)}
                style={[styles.input, { marginLeft: -10 }]}
              >
                <Picker.Item
                  label="Select User Type"
                  value=""
                  enabled={false}
                />
                <Picker.Item label="Entrepreneur" value="Entrepreneur" />
                <Picker.Item label="Investor" value="Investor" />
              </Picker>
            </View>
          </View>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, isChecked && styles.checkboxChecked]}
              onPress={() => setIsChecked(!isChecked)}
            >
              {isChecked && <CheckIcon size={16} color="#fff" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>
              I agree to the <Text style={styles.link}>Terms of Service</Text>{" "}
              and <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Registering..." : "Register"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text
              style={styles.link}
              onPress={() => router.push("/auth/login")}
            >
              Log in here
            </Text>
          </Text>
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderColor: "transparent",
  },
  icon: {
    marginRight: 10,
  },
  iconButton: {
    padding: 10,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#000",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff", // Default background
  },
  checkboxChecked: {
    backgroundColor: "#000", // Black background when checked
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#666",
  },
  link: {
    color: "#1E90FF",
  },
  button: {
    backgroundColor: "#000", // Changed from "#1E90FF" to black
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
  borderedInput: {
    borderWidth: 1,
    borderColor: "#000",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
