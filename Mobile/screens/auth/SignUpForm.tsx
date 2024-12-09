import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "../../context/AuthContext";

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, "SignUp">;

const DismissKeyboard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    {children}
  </TouchableWithoutFeedback>
);

const SignUpForm: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [checkPassword, setCheckPassword] = useState<string>("");
  const { onRegister, onLogin } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateInputs = () => {
    if (!username || !password || !checkPassword) {
      setErrorMsg("Wszystkie pola muszą być wypełnione.");
      return false;
    }
    if (password != checkPassword) {
      setErrorMsg("Wprowadzone hasła nie są takie same.");
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const login = async () => {
    const result = await onLogin!(username, password);
    if (result && result.error) {
      navigation.navigate("SignIn");
    }
  };

  const register = async () => {
    if (!validateInputs()) return;

    const result = await onRegister!(username, password);
    if (result && result.error) {
      setErrorMsg(result.msg);
    } else {
      login();
    }
  };

  return (
    <DismissKeyboard>
      <View style={styles.container}>
        <Text style={styles.title}>Zarejestruj się</Text>
        <Text style={styles.subtitle}></Text>

        {/* Username Field */}
        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={20} color="#aaa" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nazwa użytkownika"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        {/* Password Field */}
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={20} color="#aaa" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Hasło"
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setIsPasswordVisible((prev) => !prev)}>
            <FontAwesome
              name={isPasswordVisible ? "eye" : "eye-slash"}
              size={20}
              color="#aaa"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Password Field */}
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={20} color="#aaa" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Powtórz hasło"
            secureTextEntry={!isPasswordVisible}
            value={checkPassword}
            onChangeText={setCheckPassword}
          />
          <TouchableOpacity onPress={() => setIsPasswordVisible((prev) => !prev)}>
            <FontAwesome
              name={isPasswordVisible ? "eye" : "eye-slash"}
              size={20}
              color="#aaa"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Error Message under Password Field */}
        {errorMsg && (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.button} onPress={register}>
          <Text style={styles.buttonText}>Zarejestruj się</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Posiadasz konto?{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("SignIn")}
          >
            Zaloguj się
          </Text>
        </Text>
      </View>
    </DismissKeyboard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxText: {
    marginLeft: 10,
    color: "#555",
  },
  link: {
    color: "#7f57ff",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#7f57ff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orText: {
    color: "#777",
    marginBottom: 10,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "60%",
    marginBottom: 20,
  },
  socialIcon: {
    marginHorizontal: 10,
  },
  footerText: {
    color: "#555",
  },
  eyeIcon: {
    marginLeft: 10,
  },
  errorText: {
    color: "red",
    marginTop: 5,
    fontSize: 14,
    paddingBottom: 10,
  },
});

export default SignUpForm;
