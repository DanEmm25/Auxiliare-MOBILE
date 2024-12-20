import React, { useState, useRef, ReactNode } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  Pressable,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SIDEBAR_FULL_WIDTH = Platform.OS === "web" ? 250 : 200;
const SIDEBAR_COLLAPSED_WIDTH = Platform.OS === "web" ? 70 : 60;

const InvestorLayout = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarAnim = useRef(
    new Animated.Value(SIDEBAR_COLLAPSED_WIDTH)
  ).current;
  const router = useRouter();
  const pathname = usePathname();

  const routes = {
    home: "/users/investor/screens/home",
    portfolio: "/users/investor/screens/portfolio",
    investments: "/users/investor/screens/investments",
    financials: "/users/investor/screens/financials",
    profile: "/users/investor/screens/profile",
    messages: "/users/screens/conversations",
  };

  const getRouteFromPathname = (path: string): string => {
    const routes: { [key: string]: string } = {
      "/users/investor/screens/home": "Home",
      "/users/investor/screens/portfolio": "Portfolio",
      "/users/investor/screens/investments": "Investments",
      "/users/investor/screens/financials": "Financials",
      "/users/investor/screens/profile": "Profile",
    };
    return routes[path] || "Home";
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
      router.push("/auth/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleNavigation = (route: string) => {
    if (route === "Logout") {
      handleLogout();
    } else if (route === "Messages") {
      router.push("/users/screens/conversations");
    } else {
      const routes: { [key: string]: string } = {
        Home: "/users/investor/screens/home",
        Portfolio: "/users/investor/screens/portfolio",
        Investments: "/users/investor/screens/investments",
        Financials: "/users/investor/screens/financials",
        Profile: "/users/investor/screens/profile",
      };
      router.push(routes[route] || "/users/investor/screens/home");
    }
  };

  const currentRoute = getRouteFromPathname(pathname);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newWidth = isOpen
          ? SIDEBAR_FULL_WIDTH + gesture.dx
          : SIDEBAR_COLLAPSED_WIDTH + gesture.dx;
        if (
          newWidth >= SIDEBAR_COLLAPSED_WIDTH &&
          newWidth <= SIDEBAR_FULL_WIDTH
        ) {
          sidebarAnim.setValue(newWidth);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldOpen = gesture.dx > 50;
        toggleSidebar(shouldOpen);
      },
    })
  ).current;

  const toggleSidebar = (open?: boolean) => {
    const toValue =
      open ?? !isOpen ? SIDEBAR_FULL_WIDTH : SIDEBAR_COLLAPSED_WIDTH;
    Animated.spring(sidebarAnim, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 9,
    }).start();
    setIsOpen(open ?? !isOpen);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.sidebar,
          { width: sidebarAnim },
          Platform.OS === "ios" && styles.iosSidebar,
        ]}
        {...panResponder.panHandlers}
      >
        {Platform.OS === "ios" && (
          <BlurView intensity={95} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.sidebarContent}>
          <View style={styles.sidebarHeader}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => toggleSidebar()}
            >
              <Ionicons
                name={isOpen ? "chevron-back" : "chevron-forward"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.menuItems]}>
            {[
              { name: "Home", icon: "home" },
              { name: "Portfolio", icon: "briefcase" },
              { name: "Investments", icon: "trending-up" },
              { name: "Messages", icon: "chatbubbles" },
              { name: "Financials", icon: "stats-chart" },
              { name: "Profile", icon: "person" },
              { name: "Logout", icon: "exit" },
            ].map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.navItem,
                  currentRoute === item.name && styles.activeNavItem,
                ]}
                onPress={() => handleNavigation(item.name)}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={currentRoute === item.name ? "#007AFF" : "#666"}
                />
                {isOpen && (
                  <Animated.Text
                    style={[
                      styles.navText,
                      currentRoute === item.name && styles.activeNavText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Animated.Text>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      </Animated.View>

      {isOpen && Platform.OS === "web" && (
        <Pressable
          style={styles.overlay}
          onPress={() => toggleSidebar(false)}
        />
      )}

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    backgroundColor: Platform.select({
      ios: "rgba(255,255,255,0.85)",
      android: "#FFFFFF",
      default: "#FFFFFF",
    }),
    borderRightWidth: Platform.OS === "web" ? 1 : 0,
    borderColor: "#E5E5EA",
    height: "100%",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
    }),
  },
  iosSidebar: {
    backgroundColor: "transparent",
  },
  sidebarContent: {
    flex: 1,
    zIndex: 2,
  },
  sidebarHeader: {
    height: Platform.OS === "web" ? 60 : 50,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 8,
    borderBottomWidth: Platform.OS === "web" ? 1 : 0,
    borderBottomColor: "#E5E5EA",
  },
  toggleButton: {
    padding: 8,
  },
  menuItems: {
    flex: 1,
    paddingTop: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Platform.OS === "web" ? 12 : 10,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  activeNavItem: {
    backgroundColor: Platform.select({
      ios: "rgba(0,122,255,0.12)",
      android: "#E8F1FF",
      default: "#F2F2F7",
    }),
  },
  navText: {
    marginLeft: 10,
    fontSize: Platform.OS === "web" ? 15 : 14,
    color: "#666",
    fontWeight: "500",
  },
  activeNavText: {
    color: Platform.select({
      ios: "#007AFF",
      android: "#2196F3",
      default: "#007AFF",
    }),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});

export default InvestorLayout;
