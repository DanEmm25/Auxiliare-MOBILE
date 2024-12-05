import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react-native";
import { useRouter } from "expo-router";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (userType === "Entrepreneur") {
      router.push("/users/entrepreneur/screens/dashboard");
    } else if (userType === "Investor") {
      router.push("/users/investor/dashboard");
    } else if (userType === "Admin") {
      router.push("/users/admin/dashboard");
    } else {
      alert("Please select a valid user type.");
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Log In</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <UserIcon style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
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
                <Picker.Item label="Admin" value="Admin" />
                <Picker.Item label="Entrepreneur" value="Entrepreneur" />
                <Picker.Item label="Investor" value="Investor" />
              </Picker>
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
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.iconButton}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            Don't have an account?{" "}
            <Text
              style={styles.link}
              onPressIn={() => router.push("/auth/register")}
            >
              Register here
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
  footerText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
  link: {
    color: "#1E90FF",
    textDecorationLine: "underline",
  },
});
