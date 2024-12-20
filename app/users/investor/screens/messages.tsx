import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";

interface Message {
  id: number;
  sender_id: number;
  message: string;
  created_at: string;
  sender_name: string;
}

interface ConversationMeta {
  project_title: string;
  user1_name: string;
  user2_name: string;
}

export default function Messages() {
  const route = useRouter().query;
  const { conversation_id, project_id, recipient_id } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const wsUrl = `ws://192.168.1.18:8081?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log("WebSocket connected");
        };

        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (
            data.type === "chat" &&
            data.message.conversation_id === conversation_id
          ) {
            setMessages((prev) => [...prev, data.message]);
            flatListRef.current?.scrollToEnd();
          }
        };

        ws.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.current.onclose = () => {
          console.log("WebSocket closed");
          // Optionally attempt to reconnect
        };
      } catch (error) {
        console.error("Error initializing WebSocket:", error);
      }
    };

    initializeWebSocket();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [conversation_id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation_id) return;

    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");
      const user = JSON.parse(userStr || "{}");

      const response = await fetch(
        `http://192.168.1.18:8081/conversations/${conversation_id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: newMessage,
            receiver_id: recipient_id,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              type: "chat",
              conversation_id: conversation_id,
              receiver_id: recipient_id,
              project_id: project_id,
              text: newMessage,
            })
          );
        }

        const newMessageObj = {
          message_id: data.message.message_id,
          conversation_id: conversation_id,
          sender_id: user.id,
          receiver_id: recipient_id,
          project_id: project_id,
          message_content: newMessage,
          sent_at: data.message.sent_at,
          is_read: data.message.is_read,
          sender_name: user.username,
        };

        setMessages((prev) => [...prev, newMessageObj]);
        setNewMessage("");
        flatListRef.current?.scrollToEnd();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.message_id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
              alignSelf: item.sender_id === user.id ? "flex-end" : "flex-start",
              backgroundColor:
                item.sender_id === user.id ? "#DCF8C6" : "#FFFFFF",
              borderRadius: 5,
              margin: 5,
            }}
          >
            <Text>
              {item.sender_name}: {item.message_content}
            </Text>
            <Text style={{ fontSize: 10, color: "#999" }}>
              {new Date(item.sent_at).toLocaleTimeString()}
            </Text>
          </View>
        )}
      />
      <View style={{ flexDirection: "row", padding: 10 }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#CCC",
            borderRadius: 20,
            paddingHorizontal: 15,
          }}
          placeholder="Type a message"
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={{
            marginLeft: 10,
            backgroundColor: "#007AFF",
            borderRadius: 20,
            padding: 10,
          }}
        >
          <Ionicons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
