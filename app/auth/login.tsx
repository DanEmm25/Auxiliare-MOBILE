import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UserIcon,
  XIcon,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: token+password
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    console.log("Login attempt with:", { identifier, password });

    try {
      if (!identifier.trim() || !password.trim()) {
        alert("Please enter your email/username and password.");
        return;
      }

      const requestData = {
        identifier: identifier.trim(),
        password: password.trim(),
      };

      console.log("Sending request with:", requestData);

      const response = await fetch("http://192.168.1.18:8081/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        await AsyncStorage.setItem("user", JSON.stringify(data.userData));
        await AsyncStorage.setItem("token", data.token); // Store JWT token
        // Navigate based on user type
        if (data.userType === "Entrepreneur") {
          router.push("/users/entrepreneur/screens/dashboard");
        } else if (data.userType === "Investor") {
          router.push("/users/investor/screens/home");
        }
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      alert(error.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async () => {
    if (!resetEmail.trim()) {
      alert("Please enter your email address");
      return;
    }

    setResetLoading(true);
    try {
      console.log("Requesting password reset for:", resetEmail);

      const response = await fetch(
        "http://192.168.1.18:8081/request-password-reset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: resetEmail.trim() }),
        }
      );

      const data = await response.json();
      console.log("Reset response:", data);

      if (data.success) {
        alert(`Reset token: ${data.resetToken}`);
        setResetStep(2);
      } else {
        alert(data.message || "Failed to request password reset");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      alert("Error requesting password reset. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim() || !newPassword.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch("http://192.168.1.18:8081/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail,
          resetToken,
          newPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Password reset successful");
        setIsResetModalVisible(false);
        setResetStep(1);
        setResetEmail("");
        setResetToken("");
        setNewPassword("");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error resetting password");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Log In</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email or Username</Text>
            <View style={styles.inputWrapper}>
              <UserIcon style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email or username"
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <LockIcon style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
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
          </View>
          <TouchableOpacity onPress={() => setIsResetModalVisible(true)}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Logging in..." : "Log In"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            Don't have an account?{" "}
            <Text
              style={styles.link}
              onPress={() => router.push("/auth/register")}
            >
              Register here
            </Text>
          </Text>
        </View>
        <Footer />
      </ScrollView>
      <Modal visible={isResetModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setIsResetModalVisible(false);
                setResetStep(1);
                setResetEmail("");
                setResetToken("");
                setNewPassword("");
              }}
            >
              <XIcon color="#000" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {resetStep === 1 ? "Reset Password" : "Enter Reset Details"}
            </Text>

            {resetStep === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      keyboardType="email-address"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.button, resetLoading && styles.buttonDisabled]}
                  onPress={handleRequestReset}
                  disabled={resetLoading}
                >
                  <Text style={styles.buttonText}>
                    {resetLoading ? "Requesting..." : "Request Reset"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Reset Token</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter reset token"
                      value={resetToken}
                      onChangeText={setResetToken}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.button, resetLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={resetLoading}
                >
                  <Text style={styles.buttonText}>
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  forgotPassword: {
    fontSize: 14,
    color: "#1E90FF",
    textAlign: "right",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  footerText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
  link: {
    color: "#1E90FF",
    textDecorationLine: "none",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 10,
    zIndex: 1,
  },
});
