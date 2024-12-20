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
  const params = useLocalSearchParams();
  const { conversation_id, project_id, recipient_id, project_title } = params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    loadUser();
    initializeWebSocket();
    loadMessages();
    
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setUserId(userData.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadMessages = async () => {
    if (!conversation_id) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `http://192.168.1.18:8081/conversations/${conversation_id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        flatListRef.current?.scrollToEnd();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const initializeWebSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const wsUrl = `ws://192.168.1.18:8081?token=${token}`;
      const newWs = new WebSocket(wsUrl);

      newWs.onopen = () => {
        console.log('WebSocket connected');
      };

      newWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat' && data.message.conversation_id === conversation_id) {
          setMessages(prev => [...prev, data.message]);
          flatListRef.current?.scrollToEnd();
        }
      };

      setWs(newWs);
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation_id) return;

    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat',
          conversation_id: conversation_id,
          recipient_id: recipient_id,
          text: newMessage,
        }));
        setNewMessage('');
      } else {
        console.error('WebSocket is not connected');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  }, []);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === userId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage
            ? styles.ownMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text style={styles.timestampText}>
            {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {project_title || "Chat"}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage} // Ensure sendMessage is correctly connected
          disabled={!newMessage.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={newMessage.trim() ? "#007AFF" : "#CCC"}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  ownMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "100%",
  },
  ownMessageBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#1A1A1A",
  },
  timestampText: {
    fontSize: 12,
    color: "#666666",
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
});
