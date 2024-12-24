import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert, Modal, FlatList } from 'react-native';
import { getItems } from '../api/events';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from "../App";

type ItemsScreenRouteProp = RouteProp<RootStackParamList, 'Items'>;

export default function EventList() {
  const route = useRoute<ItemsScreenRouteProp>();
  const { eventId } = route.params;
  const { onLogout } = useAuth();
  const [itemsList, setItems] = useState<any>();
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const result = await getItems(eventId);
          setItems(result)
        } catch (error) {
          console.error("Błąd ładowania danych:", error)
          setItems([])
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [eventId])
  );

  const logout = async () => {
    const result = await onLogout!();
    if (result && result.error) {
      Alert.alert("Błąd", result.msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {!loading && itemsList && itemsList.title && (
          <Text style={styles.header}>{itemsList.title}</Text>
        )}
        {loading ? (
          <Text style={styles.loadingText}>Ładowanie...</Text>
        ) : itemsList.items.length === 0 ? (
          <Text style={styles.noDataText}>To wydarzenie wydaje się być puste :o</Text>
        ) : (
          itemsList.items.map((item: any) => {
            return (
              <TouchableOpacity
                key={item.id}
              // onPress={() => checkPermissions(item)}
              >
                <View key={item.id} style={styles.eventCard}>
                  <Image source={{ uri: item.image }} style={styles.eventImage} />
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle}>{item.nazwa}</Text>
                    {item.item_values.map((value: any, index: number) => (
                      <Text key={index} style={styles.eventDate}>
                        {itemsList.item_properties[index]}: {value}
                      </Text>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Wyloguj</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: 'gray',
  },
  logoutContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#cc0000',
    borderRadius: 30,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
  },
  eventImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  eventDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 14,
    color: '#777',
  },
  eventDescription: {
    fontSize: 14,
    marginVertical: 8,
  },
  peopleCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
  },
});