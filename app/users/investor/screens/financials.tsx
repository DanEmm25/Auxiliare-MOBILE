import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Financial = () => {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [investmentSummary, setInvestmentSummary] = useState({
    totalInvestments: 0,
    totalInvested: 0,
    activeInvestments: 0,
  });

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch balance
      const balanceResponse = await fetch('http://192.168.1.46:8081/user-balance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const balanceData = await balanceResponse.json();
      
      // Fetch investment summary
      const summaryResponse = await fetch('http://192.168.1.46:8081/user-investment-summary', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const summaryData = await summaryResponse.json();

      if (balanceData.success) {
        setBalance(balanceData.balance);
      }
      if (summaryData.success) {
        setInvestmentSummary(summaryData.summary);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch financial data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://192.168.1.46:8081/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Deposit successful');
        fetchData();
        setAmount('');
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error making deposit:', error);
      Alert.alert('Error', 'Failed to process deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>₱{balance.toFixed(2)}</Text>
      </View>

      <View style={styles.depositSection}>
        <Text style={styles.sectionTitle}>Make a Deposit</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity 
          style={styles.depositButton}
          onPress={handleDeposit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.depositButtonText}>Deposit</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Financial Summary</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Available for Investment:</Text>
          <Text style={styles.infoValue}>₱{balance.toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Invested:</Text>
          <Text style={styles.infoValue}>₱{investmentSummary.totalInvested.toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Number of Investments:</Text>
          <Text style={styles.infoValue}>{investmentSummary.totalInvestments}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Active Investments:</Text>
          <Text style={styles.infoValue}>{investmentSummary.activeInvestments}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Portfolio Value:</Text>
          <Text style={styles.infoValue}>
            ₱{(balance + investmentSummary.totalInvested).toFixed(2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  depositSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  depositButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  depositButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Financial;
