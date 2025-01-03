import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import SignUpForm from "./screens/auth/SignUpForm";
import SignInForm from "./screens/auth/SignInForm";
import Events from "./screens/Events";
import QRScanner from "./screens/QRScanner";
import Items from "./screens/Items";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ActivityIndicator, Button, View, Alert, TouchableOpacity, Text, StyleSheet } from "react-native";

export type RootStackParamList = {
  SignUp: undefined;
  SignIn: undefined;
  Events: undefined;
  QRScanner: undefined;
  Items: { eventId: number };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { authState, onLogout } = useAuth();
  if (authState?.authenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Ładowanie aplikacji...</Text>
      </View>
    );
  }

  const logout = async () => {
    const result = await onLogout!();
    if (result && result.error) {
      Alert.alert("Błąd", result.msg);
    }
  };

  return (
    <Stack.Navigator>
      {authState?.authenticated ? (
        <>
          <Stack.Screen
            name="Events"
            component={Events}
            options={{
              headerShown: true,
              title: "Events",
              headerLeft: () => null,
              headerTitle: () => null,
              headerRight: () => (
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                  <Text style={styles.logoutButtonText}>Wyloguj</Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen
            name="Items"
            component={Items}
            options={{
              headerShown: true,
              headerTitle: () => null,
              title: "Items",
              headerRight: () => (
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                  <Text style={styles.logoutButtonText}>Wyloguj</Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen
            name="QRScanner"
            component={QRScanner}
            options={{
              headerShown: false,
              title: "QRScanner",
              headerLeft: () => null,
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="SignIn"
            component={SignInForm}
            options={{
              headerShown: false,
              title: "Sign In",
              headerLeft: () => null,
            }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpForm}
            options={{
              headerShown: false,
              title: "Sign Up",
              headerLeft: () => null,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#FF6347',
    borderRadius: 20,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#0066cc',
    marginTop: 10,
  },
});

export default App;
