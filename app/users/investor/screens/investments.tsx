import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Investment {
  investment_id: number;
  project_id: number;
  investment_amount: number;
  investment_date: string;
  investment_status: string;
  project_title?: string; // Added from JOIN with projects
  expected_returns?: number;
  investment_duration?: number;
  risk_level?: "Low" | "Medium" | "High";
  returns_earned?: number;
}

const Investments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvestments = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        "http://192.168.1.18:8081/user-investments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setInvestments(data.investments);
      }
    } catch (error) {
      console.error("Error fetching investments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvestments();
  };

  const calculateTotalMetrics = () => {
    const total = investments.reduce(
      (acc, inv) => ({
        totalInvested: acc.totalInvested + inv.investment_amount,
        totalReturns: acc.totalReturns + (inv.returns_earned || 0),
        activeInvestments:
          acc.activeInvestments + (inv.investment_status === "active" ? 1 : 0),
      }),
      { totalInvested: 0, totalReturns: 0, activeInvestments: 0 }
    );
    return total;
  };

  const renderMetricsCard = () => {
    const metrics = calculateTotalMetrics();
    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            ₱{metrics.totalInvested.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>Total Invested</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            ₱{metrics.totalReturns.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>Total Returns</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.activeInvestments}</Text>
          <Text style={styles.metricLabel}>Active Investments</Text>
        </View>
      </View>
    );
  };

  const renderInvestment = ({ item }: { item: Investment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.projectTitle}>{item.project_title}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.investment_status === "active" ? "#E7F5E8" : "#FFF3E0",
            },
          ]}
        >
          <Text
            style={[
              styles.status,
              {
                color:
                  item.investment_status === "active" ? "#4CAF50" : "#FF9800",
              },
            ]}
          >
            {item.investment_status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Investment Amount</Text>
            <Text style={styles.infoValue}>
              ₱{item.investment_amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Expected Returns</Text>
            <Text style={styles.infoValue}>
              ₱{(item.expected_returns || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>
              {item.investment_duration || "N/A"} months
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Risk Level</Text>
            <Text
              style={[
                styles.riskLevel,
                {
                  color:
                    item.risk_level === "High"
                      ? "#FF5252"
                      : item.risk_level === "Medium"
                      ? "#FFC107"
                      : "#4CAF50",
                },
              ]}
            >
              {item.risk_level || "N/A"}
            </Text>
          </View>
        </View>

        <Text style={styles.date}>
          Invested on: {new Date(item.investment_date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Investments</Text>
      {renderMetricsCard()}
      <FlatList
        data={investments}
        renderItem={renderInvestment}
        keyExtractor={(item) => item.investment_id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No investments found</Text>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333333",
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#666666",
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  cardContent: {
    padding: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: "600",
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  statusContainer: {
    alignSelf: "flex-start",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#F8F8F8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#666666",
    fontSize: 16,
    marginTop: 24,
  },
});

export default Investments;
