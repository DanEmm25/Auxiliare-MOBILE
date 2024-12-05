import React from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EntrepreneurLayout from '../layout';
import { LinearGradient } from 'expo-linear-gradient';

// Mock data
const projectsData = {
  projects: [
    {
      id: 1,
      name: 'Project Alpha',
      thumbnail: 'https://picsum.photos/200',
      status: 'Active',
      current_funding: 50000,
      funding_goal: 100000,
    },
    // ... more projects
  ],
  milestones: [
    {
      id: 1,
      name: 'Initial Planning',
      status: 'Completed',
      target_amount: 10000,
      deadline: '2024-02-01',
    },
    // ... more milestones
  ],
  pitchSessions: [
    {
      id: 1,
      title: 'Investor Pitch',
      date: '2024-02-15',
      time: '14:00',
      status: 'Scheduled',
      meetingLink: 'https://meet.example.com',
    },
    // ... more sessions
  ],
};

const ProjectCard = ({ project }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.projectCard,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.projectCardContent}
      >
        <Image source={{ uri: project.thumbnail }} style={styles.projectThumbnail} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.thumbnailOverlay}
        >
          <Text style={styles.projectTitle}>{project.name}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{project.status}</Text>
          </View>
        </LinearGradient>

        <View style={styles.projectInfo}>
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  { width: `${(project.current_funding / project.funding_goal) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.fundingText}>
              ₱{project.current_funding.toLocaleString()} / ₱{project.funding_goal.toLocaleString()}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="eye-outline" size={20} color="#007AFF" />
              <Text style={styles.actionText}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const MilestoneItem = ({ milestone }) => (
  <View style={[
    styles.milestoneItem,
    { borderLeftColor: milestone.status === 'Completed' ? '#34C759' : '#FF3B30' }
  ]}>
    <Text style={styles.milestoneName}>{milestone.name}</Text>
    <Text style={styles.milestoneDetails}>
      Target: ₱{milestone.target_amount.toLocaleString()}
    </Text>
    <Text style={styles.milestoneDeadline}>Due: {milestone.deadline}</Text>
  </View>
);

const PitchSessionItem = ({ session }) => (
  <View style={styles.pitchSessionItem}>
    <View style={styles.sessionInfo}>
      <Text style={styles.sessionTitle}>{session.title}</Text>
      <Text style={styles.sessionDateTime}>{session.date} at {session.time}</Text>
      <Text style={styles.sessionStatus}>{session.status}</Text>
    </View>
    {session.status === 'Scheduled' && (
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Join</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function Projects() {
  return (
    <EntrepreneurLayout>
      <FlatList
        style={styles.container}
        ListHeaderComponent={() => (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Projects</Text>
              <TouchableOpacity style={styles.newProjectButton}>
                <Text style={styles.newProjectButtonText}>New Project</Text>
              </TouchableOpacity>
            </View>
            
            {/* Projects Grid */}
            <FlatList
              data={projectsData.projects}
              renderItem={({ item }) => <ProjectCard project={item} />}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              horizontal={false}
              style={styles.projectsGrid}
            />
            
            {/* Milestones Timeline */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Milestones Timeline</Text>
              {projectsData.milestones.map(milestone => (
                <MilestoneItem key={milestone.id} milestone={milestone} />
              ))}
            </View>
            
            {/* Pitch Sessions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Pitches</Text>
                <TouchableOpacity style={styles.scheduleButton}>
                  <Text style={styles.scheduleButtonText}>Schedule New</Text>
                </TouchableOpacity>
              </View>
              {projectsData.pitchSessions.map(session => (
                <PitchSessionItem key={session.id} session={session} />
              ))}
            </View>
          </>
        )}
      />
    </EntrepreneurLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  projectsGrid: {
    padding: 10,
  },
  projectCard: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  projectCardContent: {
    flex: 1,
  },
  projectThumbnail: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  projectInfo: {
    padding: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  fundingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  milestoneItem: {
    backgroundColor: '#FFF',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pitchSessionItem: {
    backgroundColor: '#FFF',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  // ... remaining styles
});
