import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Conversation {
  id: number;
  project_title: string;
  user1_name: string;
  user2_name: string;
  user1_role: string;
  user2_role: string;
  last_message: string;
  last_message_date: string;
}

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch("http://192.168.1.18:8081/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const initializeWebSocket = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const wsUrl = `ws://192.168.1.18:8081?token=${token}`;
      const newWs = new WebSocket(wsUrl);

      newWs.onopen = () => {
        console.log("WebSocket connected");
      };

      newWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "new_conversation") {
          // Update conversations list
          setConversations((prev) => [data.conversation, ...prev]);
        }
      };

      newWs.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      newWs.onclose = () => {
        console.log("WebSocket closed");
        setTimeout(initializeWebSocket, 3000);
      };

      setWs(newWs);
    } catch (error) {
      console.error("Error initializing WebSocket:", error);
    }
  };

  const renderConversation = async ({ item }: { item: Conversation }) => {
    const currentUser = await AsyncStorage.getItem("user");
    const userData = JSON.parse(currentUser);
    const otherUser =
      userData.id === item.user1_id ? item.user2_name : item.user1_name;
    const userRole =
      userData.id === item.user1_id ? item.user2_role : item.user1_role;
    const receiver_id =
      userData.id === item.user1_id ? item.user2_id : item.user1_id;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          router.push({
            pathname: "/users/screens/messages",
            params: {
              conversation_id: item.id,
              project_id: item.project_id, // Ensure project_id is included
              receiver_id: receiver_id,
            },
          })
        }
      >
        <View style={styles.conversationContent}>
          <Text style={styles.projectTitle}>{item.project_title}</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{otherUser}</Text>
            <Text style={styles.userRole}>{userRole}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || "No messages yet"}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.last_message_date).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  conversationContent: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666666",
  },
  timestamp: {
    fontSize: 12,
    color: "#999999",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  userRole: {
    fontSize: 12,
    color: "#666666",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
});
