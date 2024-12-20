import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  investment_amount: number;
  funding_goal: number;
  current_funding: number;
  total_investors: number;
  end_date: string;
}

const PortfolioCard = ({ item }: { item: PortfolioItem }) => {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Text style={styles.projectTitle}>{item.title}</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Your Investment:</Text>
          <Text style={styles.value}>
            ₱{item.investment_amount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Project Goal:</Text>
          <Text style={styles.value}>
            ₱{item.funding_goal.toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Current Funding:</Text>
          <Text style={styles.value}>
            ₱{item.current_funding.toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Total Investors:</Text>
          <Text style={styles.value}>{item.total_investors}</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  (item.current_funding / item.funding_goal) * 100,
                  100
                )}%`,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() =>
            router.push({
              pathname: "/users/screens/messages",
              params: {
                project_id: item.id,
                recipient_id: item.user_id,
                project_title: item.title,
              },
            })
          }
        >
          <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Portfolio = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalInvested, setTotalInvested] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch("http://192.168.1.18:8081/portfolio", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success && data.portfolio) {
          setPortfolioData(data.portfolio);
          // Calculate total invested amount
          const total = data.portfolio.reduce(
            (sum: number, item: PortfolioItem) => sum + item.investment_amount,
            0
          );
          setTotalInvested(total);
        }
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const initializeWebSocket = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const wsUrl = `ws://192.168.1.18:8081?token=${token}`;
      const newWs = new WebSocket(wsUrl);

      newWs.onopen = () => {
        console.log("WebSocket connected");
      };

      newWs.onmessage = (event) => {
        console.log("Received message:", event.data);
        const data = JSON.parse(event.data);
        if (data.type === "investment_update") {
          // Update portfolio
          setPortfolioData((prev) => [data.investment, ...prev]);
        }
      };

      newWs.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      newWs.onclose = (e) => {
        console.log("WebSocket closed:", e.reason);
        setTimeout(initializeWebSocket, 3000);
      };

      setWs(newWs);
    } catch (error) {
      console.error("Error initializing WebSocket:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Investment Portfolio</Text>
        <Text style={styles.totalInvested}>
          Total Invested: ₱{totalInvested.toLocaleString()}
        </Text>
      </View>

      {portfolioData.length > 0 ? (
        <FlatList
          data={portfolioData}
          renderItem={({ item }) => <PortfolioCard item={item} />}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            You haven't made any investments yet. Start investing to build your
            portfolio!
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 16,
    backgroundColor: "#F8F9FA",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  totalInvested: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1A1A1A",
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#666666",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 4,
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  cardActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  messageButtonText: {
    marginLeft: 8,
    color: "#007AFF",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default Portfolio;
