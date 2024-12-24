import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert, Modal, FlatList } from 'react-native';
import { getItems } from '../api/events';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function EventList() {
  const { onLogout } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszystkie');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
    //   const result = await getItems();
    //   setItems(result);
    //   const category = ['Wszystkie', ...new Set(result.flatMap(event => event.categories))];
    //   setCategoryList(category);
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
    let filtered = items;

    if (selectedCategory !== 'Wszystkie') {
      filtered = filtered.filter(event => event.categories.includes(selectedCategory));
    }

    return filtered;
  };

  const filteredEvents = getFilteredEvents();

  return (
    <SafeAreaView style={styles.container}>
        {/* Filtry: Kategorie */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Kategoria</Text>
          <TouchableOpacity style={styles.filterButton} onPress={() => {setModalVisible(true); }}>
            <Text style={styles.filterText}>{selectedCategory}</Text>
          </TouchableOpacity>
        </View>

      <ScrollView>
        {/* Modal */}
        <Modal
      visible={modalVisible}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <Text style={styles.modalHeader}>Kategorie</Text>
        <FlatList
          data={categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setSelectedCategory(item);
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
