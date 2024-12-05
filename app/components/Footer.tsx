
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export const Footer = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.copyright}>
        © 2024 Auxiliare. All rights reserved.
      </Text>
      <View style={styles.footerLinks}>
        <TouchableOpacity>
          <Text style={styles.footerLink}>About Us</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 20,
  },
  copyright: {
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  footerLink: {
    color: "#666",
  },
});