import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import EntrepreneurLayout from '../layout';
import { useRouter } from 'expo-router';

interface Project {
  project_id: number;
  title: string;
  description: string;
  funding_goal: number;
  category: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (!token || !userStr) {
        setError('Authentication required');
        return;
      }

      const user = JSON.parse(userStr);
      const response = await axios.get(
        `http://192.168.1.46:8081/user-projects/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setProjects(response.data.projects);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (loading && !refreshing) {
    return (
      <EntrepreneurLayout>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </EntrepreneurLayout>
    );
  }

  return (
    <EntrepreneurLayout>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Projects</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/users/entrepreneur/screens/projects')}
          >
            <Text style={styles.createButtonText}>Create Project</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.noProjectsText}>No projects found</Text>
          </View>
        ) : (
          <View style={styles.projectsGrid}>
            {projects.map((project) => (
              <View key={project.project_id} style={styles.projectCard}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <Text style={styles.projectDescription} numberOfLines={2}>
                  {project.description}
                </Text>
                <View style={styles.projectDetails}>
                  <Text style={styles.detailText}>
                    Goal: {formatCurrency(project.funding_goal)}
                  </Text>
                  <Text style={styles.detailText}>
                    Category: {project.category}
                  </Text>
                  <Text style={styles.detailText}>
                    Start: {formatDate(project.start_date)}
                  </Text>
                  <Text style={styles.detailText}>
                    End: {formatDate(project.end_date)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </EntrepreneurLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  noProjectsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  projectsGrid: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  projectDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
});
