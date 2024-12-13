import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Investment {
  investment_id: number;
  project_id: number;
  investment_amount: number;
  investment_date: string;
  investment_status: string;
  project_title?: string; // Added from JOIN with projects
}

const Investments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvestments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://192.168.1.46:8081/user-investments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setInvestments(data.investments);
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
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

  const renderInvestment = ({ item }: { item: Investment }) => (
    <View style={styles.card}>
      <Text style={styles.projectTitle}>{item.project_title}</Text>
      <Text style={styles.amount}>Amount: ₱{item.investment_amount}</Text>
      <Text style={styles.date}>
        Date: {new Date(item.investment_date).toLocaleDateString()}
      </Text>
      <View style={styles.statusContainer}>
        <Text style={[
          styles.status,
          { color: item.investment_status === 'active' ? '#4CAF50' : '#FF9800' }
        ]}>
          {item.investment_status.toUpperCase()}
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  card: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  amount: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    marginTop: 24,
  },
});

export default Investments;
