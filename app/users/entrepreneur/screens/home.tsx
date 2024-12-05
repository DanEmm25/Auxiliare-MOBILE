import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EntrepreneurLayout from "../layout";

// Mock data for posts
const mockPosts = [
  {
    id: 1,
    author: {
      name: "John Doe",
      avatar: "https://picsum.photos/200",
    },
    content:
      "Excited to share our latest milestone! Our project has reached 50% of its funding goal.",
    timestamp: "2024-01-20T10:00:00Z",
    likes: 42,
    comments: 8,
    linkedProject: {
      title: "EcoTech Solutions",
      thumbnail: "https://picsum.photos/100",
      status: "Active",
      currentFunding: 50000,
      fundingGoal: 100000,
    },
    media: "https://picsum.photos/400/300",
  },
  // Add more mock posts...
];

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("latest");

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Fetch new posts here
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const handlePost = () => {
    // Handle post creation
    setPostContent("");
  };

  return (
    <EntrepreneurLayout>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Post Creation Area */}
        <View style={styles.postCreationCard}>
          <TextInput
            style={styles.postInput}
            placeholder="Share updates about your project..."
            multiline
            value={postContent}
            onChangeText={setPostContent}
          />
          <View style={styles.postActions}>
            <View style={styles.mediaActions}>
              <TouchableOpacity style={styles.mediaButton}>
                <Ionicons name="image" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaButton}>
                <Ionicons name="link" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.postButton,
                !postContent && styles.postButtonDisabled,
              ]}
              disabled={!postContent}
              onPress={handlePost}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {["Latest", "Popular", "Following", "All"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter.toLowerCase() &&
                  styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.toLowerCase())}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.toLowerCase() &&
                    styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Posts Feed */}
        {mockPosts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image
                source={{ uri: post.author.avatar }}
                style={styles.avatar}
              />
              <View style={styles.postHeaderText}>
                <Text style={styles.authorName}>{post.author.name}</Text>
                <Text style={styles.timestamp}>
                  {new Date(post.timestamp).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.media && (
              <Image source={{ uri: post.media }} style={styles.postMedia} />
            )}

            {post.linkedProject && (
              <View style={styles.linkedProject}>
                <Image
                  source={{ uri: post.linkedProject.thumbnail }}
                  style={styles.projectThumbnail}
                />
                <View style={styles.projectInfo}>
                  <Text style={styles.projectTitle}>
                    {post.linkedProject.title}
                  </Text>
                  <View style={styles.projectStats}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${
                              (post.linkedProject.currentFunding /
                                post.linkedProject.fundingGoal) *
                              100
                            }%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.fundingText}>
                      {Math.round(
                        (post.linkedProject.currentFunding /
                          post.linkedProject.fundingGoal) *
                          100
                      )}
                      % Funded
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={24} color="#666" />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={24} color="#666" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </EntrepreneurLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  postCreationCard: {
    backgroundColor: "#FFF",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  postInput: {
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 16,
  },
  mediaActions: {
    flexDirection: "row",
  },
  mediaButton: {
    padding: 8,
    marginRight: 8,
  },
  postButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  postButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFF",
  },
  postCard: {
    backgroundColor: "#FFF",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderText: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  postMedia: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  linkedProject: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  projectThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  projectStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E9ECEF",
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  fundingText: {
    fontSize: 12,
    color: "#666",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
    color: "#666",
  },
});
