import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editedProject, setEditedProject] = useState({
    title: '',
    description: '',
    funding_goal: '',
    category: '',
    start_date: '',
    end_date: '',
  });
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

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setEditedProject({
      title: project.title,
      description: project.description,
      funding_goal: project.funding_goal.toString(),
      category: project.category,
      start_date: project.start_date,
      end_date: project.end_date,
    });
    setModalVisible(true);
  };

  const handleDelete = async (projectId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing');
        return;
      }

      const response = await axios.delete(
        `http://192.168.1.46:8081/delete-project/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('Project deleted successfully!');
        fetchProjects();
      } else {
        alert('Failed to delete project: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred while deleting the project.';
      alert(errorMessage);
    }
  };

  const saveEdit = async () => {
    if (!selectedProject) return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing');
        return;
      }

      const projectDataToSend = {
        title: editedProject.title,
        description: editedProject.description,
        funding_goal: parseFloat(editedProject.funding_goal),
        category: editedProject.category,
        start_date: editedProject.start_date,
        end_date: editedProject.end_date,
      };

      const response = await axios.put(
        `http://192.168.1.46:8081/update-project/${selectedProject.project_id}`,
        projectDataToSend,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert('Project updated successfully!');
        setModalVisible(false);
        fetchProjects();
      } else {
        alert('Failed to update project: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error updating project:', error);
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred while updating the project.';
      alert(errorMessage);
    }
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
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(project)}
                  >
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(project.project_id)}
                  >
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Project</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              value={editedProject.title}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, title: text })
              }
            />
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={4}
              value={editedProject.description}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, description: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Funding Goal"
              keyboardType="numeric"
              value={editedProject.funding_goal}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, funding_goal: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Category"
              value={editedProject.category}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, category: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Start Date (YYYY-MM-DD)"
              value={editedProject.start_date}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, start_date: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="End Date (YYYY-MM-DD)"
              value={editedProject.end_date}
              onChangeText={(text) =>
                setEditedProject({ ...editedProject, end_date: text })
              }
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveEdit}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#FFA500',
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#FF4500',
    padding: 8,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    flex: 0.45,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 5,
    flex: 0.45,
    alignItems: 'center',
  },
});
