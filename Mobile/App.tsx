import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import SignUpForm from "./screens/auth/SignUpForm";
import SignInForm from "./screens/auth/SignInForm";
import Events from "./screens/Events";
import QRScanner from "./screens/QRScanner";
import Items from "./screens/Items";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ActivityIndicator, View } from "react-native";

export type RootStackParamList = {
  SignUp: undefined;
  SignIn: undefined;
  Events: undefined;
  QRScanner: undefined;
  Items: { eventId: Number };
};

const Stack = createStackNavigator<RootStackParamList>();

// Dodaj osobną funkcję do zarządzania nawigacją
const AppNavigator: React.FC = () => {
  const { authState } = useAuth();

  if (authState?.authenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {authState?.authenticated ? (
        <>
          <Stack.Screen
            name="Events"
            component={Events}
            options={{
              headerShown: false,
              title: "Events",
              headerLeft: () => null,
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
          <Stack.Screen
            name="Items"
            component={Items}
            options={{
              headerShown: false,
              title: "Items",
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

export default App;
