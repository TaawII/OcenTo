import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert, Modal, FlatList } from 'react-native';
import { getEvents } from '../api/events';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function EventList() {
  const { onLogout } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'Wszystkie' | 'Publiczne' | 'Prywatne'>('Wszystkie');
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszystkie');
  const [modalVisible, setModalVisible] = useState(false);
  const [isCategoryModal, setIsCategoryModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await getEvents();
      setEvents(result);
      const category = ['Wszystkie', ...new Set(result.flatMap(event => event.categories))];
      setCategoryList(category);
    };
    load();
  }, []);

  const logout = async () => {
    const result = await onLogout!();
    if (result && result.error) {
      Alert.alert("Błąd", result.msg);
    }
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

  return (
    <SafeAreaView style={styles.container}>
              <View style={styles.filterRow}>
          {/* Filtry: Dostępność */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Dostępność</Text>
            <TouchableOpacity style={styles.filterButton} onPress={() => { setIsCategoryModal(false); setModalVisible(true); }}>
              <Text style={styles.filterText}>{selectedFilter}</Text>
            </TouchableOpacity>
          </View>

          {/* Filtry: Kategorie */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Kategoria</Text>
            <TouchableOpacity style={styles.filterButton} onPress={() => { setIsCategoryModal(true); setModalVisible(true); }}>
              <Text style={styles.filterText}>{selectedCategory}</Text>
            </TouchableOpacity>
          </View>
        </View>
      <ScrollView>


        {/* Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>{isCategoryModal ? 'Kategorie' : 'Dostępność'}</Text>
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
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Lista wydarzeń */}
        <Text style={styles.header}>Lista wydarzeń</Text>
        {filteredEvents.map((item) => (
          <View key={item.id} style={styles.eventCard}>
            {item.is_private && (
              <View style={styles.lockContainer}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            )}
            <Image source={{ uri: item.image }} style={styles.eventImage} />
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventDate}>Rozpoczęcie: {item.start_time}</Text>
              <Text style={styles.eventDate}>Zakończenie: {item.end_time}</Text>
              <Text style={styles.eventDescription}>Zarządca: {item.owner}</Text>
              <Text style={styles.peopleCount}>Ilość uczestników: {item.member_count}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
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
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#0066cc',
    borderRadius: 8,
  },
  closeButtonText: {
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
