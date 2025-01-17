import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Button, Alert } from "react-native";
import { CameraView, Camera } from "expo-camera";
import { joinEvent, isPermissionToShowItems } from '../api/events';
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

type NavigationProp = StackNavigationProp<RootStackParamList, "Items">;

export default function QRScanner() {
    const navigation = useNavigation<NavigationProp>();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        };

        getCameraPermissions();
    }, []);

      const checkPermissions = async (data: any) => {
        const isPermissions = await isPermissionToShowItems(data.id);
        if (isPermissions === true) {
          navigation.navigate("Items", { eventId: data.id });
        } else if (isPermissions === false) {
            const isJoin = await joinEvent(data.id, data.password);
            if (isJoin.success === true) {
                navigation.navigate("Items", { eventId: data.id });
            }
        } else {
          Alert.alert('Błąd', 'Wystąpił nieznany problem, spróbuj ponownie za chwile.');
        }
      };

    const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        try {
            const dataParse = JSON.parse(data);
            if (dataParse.id !== undefined && dataParse.password !== undefined) {
                checkPermissions(dataParse)
            } else {
                Alert.alert(`Niepoprawny kod qr`);
            }
        } catch (error) {
            console.error('Błąd parsowania JSON:', error);
            Alert.alert('Niepoprawny kod QR');
        }
    };

    if (hasPermission === null) {
        return <Text>Prośba o pozwolenie na użycie kamery</Text>;
    }
    if (hasPermission === false) {
        return <Text>Brak dostępu do kamery</Text>;
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417"],
                }}
                style={StyleSheet.absoluteFillObject}
            />
            {scanned && (
                <Button title={"Naciśnij aby zeskanować ponownie"} onPress={() => setScanned(false)} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
    },
});