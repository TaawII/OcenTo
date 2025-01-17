import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert, Modal, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { getEvents, isPermissionToShowItems, joinEvent } from '../api/events';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

type NavigationProp = StackNavigationProp<RootStackParamList, "Items">;

export default function EventList() {
  const navigation = useNavigation<NavigationProp>();
  const [events, setEvents] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'Wszystkie' | 'Publiczne' | 'Prywatne'>('Wszystkie');
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszystkie');
  const [modalVisible, setModalVisible] = useState(false);
  const [isCategoryModal, setIsCategoryModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [itemJoin, setItemJoin] = useState<any>(null);
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(true); // Stan ładowania

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        setLoading(true); // Rozpocznij ładowanie
        try {
          const result = await getEvents();
          setEvents(result);

          const category = ['Wszystkie', ...new Set(result.flatMap(event => event.categories))];
          setCategoryList(category);
        } catch (error) {
          console.error('Błąd ładowania danych:', error);
          Alert.alert('Błąd', 'Wystąpił błąd podczas ładowania danych.');
        } finally {
          setLoading(false); // Zakończ ładowanie
        }
      };
      load();
    }, [])
  );

  const formatDate = (isoDate: any) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Miesiące są liczone od 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getFilteredEvents = () => {
    let filtered = events;
    if (selectedFilter === 'Publiczne') {
      filtered = filtered.filter(event => !event.is_private);
    } else if (selectedFilter === 'Prywatne') {
      filtered = filtered.filter(event => event.is_private);
    }
    if (selectedCategory !== 'Wszystkie') {
      filtered = filtered.filter(event => event.categories.includes(selectedCategory));
    }
    return filtered;
  };

  const filteredEvents = getFilteredEvents();

  const checkPermissions = async (item: any) => {
    const isPermissions = await isPermissionToShowItems(item.id);
    if (isPermissions === true) {
      navigation.navigate("Items", { eventId: item.id });
    } else if (isPermissions === false) {
      resetModal();
      setItemJoin(item);
      setShowPasswordModal(true);
    } else {
      Alert.alert('Błąd', 'Wystąpił nieznany problem, spróbuj ponownie za chwile.');
    }
  };

  const checkJoinEvent = async () => {
    if (itemJoin.is_private && !password) {
      setPasswordError('Hasło jest wymagane');
    } else {
      const isJoin = await joinEvent(itemJoin.id, password);
      if (isJoin.success === true) {
        navigation.navigate("Items", { eventId: itemJoin.id });
        resetModal();
      } else {
        setPasswordError(isJoin.message);
      }
    }
  };

  const resetModal = () => {
    setPasswordError('');
    setShowPasswordModal(false);
    setPassword('');
    setItemJoin(null);
  };


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Ładowanie...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Dostępność</Text>
          <TouchableOpacity style={styles.filterButton} onPress={() => { setIsCategoryModal(false); setModalVisible(true); }}>
            <Text style={styles.filterText}>{selectedFilter}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Kategoria</Text>
          <TouchableOpacity style={styles.filterButton} onPress={() => { setIsCategoryModal(true); setModalVisible(true); }}>
            <Text style={styles.filterText}>{selectedCategory}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{isCategoryModal ? 'Kategoria' : 'Dostępność'}</Text>
              <FlatList
                data={isCategoryModal ? categoryList : ['Wszystkie', 'Publiczne', 'Prywatne']}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      if (isCategoryModal) {
                        setSelectedCategory(item);
                      } else {
                        setSelectedFilter(item as 'Wszystkie' | 'Publiczne' | 'Prywatne');
                      }
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => item + index}
              />
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseButtonText}>Zamknij</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showPasswordModal} transparent={true} onRequestClose={resetModal}>
          <View style={styles.passwordModalOverlay}>
            <View style={styles.passwordModalContainer}>
              {itemJoin && (
                <>
                  <Text style={styles.modalHeaderBold}>
                    Czy chcesz dołączyć do: {itemJoin.title}?
                  </Text>

                  {itemJoin.is_private && (
                    <>
                      <TextInput
                        style={styles.inputModal}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Hasło"
                      />
                      {passwordError ? <Text style={styles.errorModalText}>{passwordError}</Text> : null}
                    </>
                  )}
                </>
              )}
              <View style={styles.buttonModalContainer}>
                <TouchableOpacity style={styles.closeModalButton} onPress={resetModal}>
                  <Text style={styles.closeModalButtonText}>Anuluj</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeModalButton} onPress={checkJoinEvent}>
                  <Text style={styles.closeModalButtonText}>Dołącz</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* <Text style={styles.header}>Lista wydarzeń</Text> */}
        {filteredEvents.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => checkPermissions(item)}>
            <View style={styles.eventCard}>
              {item.is_private && (
                <View style={styles.lockContainer}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              )}
                <Image
                  source={{ uri: `data:image/png;base64,${item.image}` }}
                  style={styles.eventImage}
                />
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDate}>Rozpoczęcie: {formatDate(item.start_time)}</Text>
                <Text style={styles.eventDate}>Zakończenie: {formatDate(item.end_time)}</Text>
                <Text style={styles.eventDescription}>Zarządca: {item.owner}</Text>
                <Text style={styles.peopleCount}>Ilość uczestników: {item.member_count}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#0066cc',
    marginTop: 10,
  },
  passwordModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  passwordModalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  inputModal: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  errorModalText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  modalHeaderBold: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonModalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  closeModalButton: {
    padding: 10,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  filterGroup: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  filterButton: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#0066cc',
    borderRadius: 30,
    alignItems: 'center',
  },
  filterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalItem: {
    padding: 10,
    backgroundColor: '#f1f1f1',
    marginBottom: 10,
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center', //wyśrodkowanie elementów w modalu
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#0066cc',
    borderRadius: 8,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
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
    alignSelf: 'center',
    width: 150,
    borderRadius: 8,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  eventDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingRight: 20,
  },
  lockContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  lockIcon: {
    fontSize: 16,
    color: '#fff',
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
