import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "../../context/AuthContext";

type NavigationProp = StackNavigationProp<RootStackParamList, "SignIn">;

const DismissKeyboard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {children}
    </TouchableWithoutFeedback>
);

const SignInForm: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const { onLogin } = useAuth();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const validateInputs = () => {
        if (!username || !password) {
            setErrorMsg("Nazwa użytkownika i hasło nie mogą być puste");
            return false;
        }
        setErrorMsg(null);
        return true;
    };

    const login = async () => {
        if (!validateInputs()) return;

        const result = await onLogin!(username, password);
        if (result && result.error) {
            setErrorMsg(result.msg);
        } else {
            navigation.navigate("Events");
        }
    };

    return (
        <DismissKeyboard>
            <View style={styles.container}>
                <Text style={styles.title}>Zaloguj się</Text>
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

                <View style={styles.inputContainer}>
                    {/* Ikona kłódki */}
                    <FontAwesome name="lock" size={20} color="#aaa" style={styles.icon} />

                    {/* Pole hasła */}
                    <TextInput
                        style={styles.input}
                        placeholder="Hasło"
                        secureTextEntry={!isPasswordVisible}
                        value={password}
                        onChangeText={setPassword}
                    />

                    {/* Ikona oka */}
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible((prev) => !prev)}
                    >
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

                {/* Sign In Button */}
                <TouchableOpacity style={styles.button} onPress={login}>
                    <Text style={styles.buttonText}>Zaloguj się</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>
                    Nie posiadasz konta?{" "}
                    <Text
                        style={styles.link}
                        onPress={() => navigation.navigate("SignUp")}
                    >
                        Zarejestruj sie
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

export default SignInForm;
