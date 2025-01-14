import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { getItems } from '../api/events';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from "../App";
import { StackNavigationProp } from "@react-navigation/stack";
import { Rating } from 'react-native-ratings';

type ItemsScreenRouteProp = RouteProp<RootStackParamList, 'Items'>;
type NavigationProp = StackNavigationProp<RootStackParamList, "ItemDetails">;

export default function EventList() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ItemsScreenRouteProp>();
  const { eventId } = route.params;
  const [itemsList, setItems] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'rating'>('name');

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

  const sortItems = (order: 'asc' | 'desc', by: 'name' | 'rating') => {
    const sortedItems = [...itemsList.items].sort((a, b) => {
      if (by === 'name') {
        if (order === 'asc') {
          return a.nazwa.localeCompare(b.nazwa);
        } else {
          return b.nazwa.localeCompare(a.nazwa);
        }
      } else {
        if (order === 'asc') {
          return a.average_rating - b.average_rating;
        } else {
          return b.average_rating - a.average_rating;
        }
      }
    });
    setItems((prevState: any) => ({ ...prevState, items: sortedItems }));
    setSortOrder(order);
    setSortBy(by);
  };

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const goToItemDetails = (itemId: number) => {
    navigation.navigate('ItemDetails', { itemId });
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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {!loading && itemsList && itemsList.items.length > 0 && (
          <TouchableOpacity style={styles.sortButton} onPress={toggleModal}>
            <Text style={styles.sortButtonText}>Sortuj</Text>
          </TouchableOpacity>
        )}

        {/* Modal z opcjami sortowania */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={toggleModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Wybierz sortowanie</Text>
              <TouchableOpacity onPress={() => { sortItems('asc', 'name'); toggleModal(); }}>
                <Text style={[styles.modalOption, sortOrder === 'asc' && sortBy === 'name' && styles.selectedOption]}>Sortuj rosnąco po nazwie</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { sortItems('desc', 'name'); toggleModal(); }}>
                <Text style={[styles.modalOption, sortOrder === 'desc' && sortBy === 'name' && styles.selectedOption]}>Sortuj malejąco po nazwie</Text>
              </TouchableOpacity>
              {itemsList && itemsList.status === "END" && (
                <>
                  <TouchableOpacity onPress={() => { sortItems('asc', 'rating'); toggleModal(); }}>
                    <Text style={[styles.modalOption, sortOrder === 'asc' && sortBy === 'rating' && styles.selectedOption]}>Sortuj rosnąco po ocenie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { sortItems('desc', 'rating'); toggleModal(); }}>
                    <Text style={[styles.modalOption, sortOrder === 'desc' && sortBy === 'rating' && styles.selectedOption]}>Sortuj malejąco po ocenie</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={toggleModal}>
                <Text style={styles.modalClose}>Zamknij</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {!loading && itemsList && itemsList.title && (
          <Text style={styles.header}>{itemsList.title}</Text>
        )}
        {itemsList.items.length === 0 ? (
          <Text style={styles.noDataText}>To wydarzenie wydaje się być puste :o</Text>
        ) : (
          itemsList.items.map((item: any) => {
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => goToItemDetails(item.id)}
              >
                <View key={item.id} style={styles.eventCard}>
                  <Image
                    source={{ uri: `data:image/png;base64,${item.image}` }}
                    style={styles.eventImage}
                  />
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle}>{item.nazwa}</Text>
                    {item.item_values.map((value: any, index: number) => {
                      const property = value || itemsList.default_values[index];
                      return (
                        <Text key={index} style={styles.eventDate}>
                          {itemsList.item_properties[index]}: {property}
                        </Text>
                      );
                    })}
                    {itemsList.status === "End" || itemsList.status === "ActiveWithRanking" ? (
                      <Text style={styles.eventDate}>Średnia ocena: {item.average_rating || 0}</Text>
                      // <Rating
                      //   ratingCount={5}
                      //   imageSize={32}
                      //   startingValue={item.average_rating}
                      //   fractions={1}
                      //   readonly={true}
                      // />
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sortButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  sortButtonText: {
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
  modalOption: {
    fontSize: 16,
    paddingVertical: 10,
    textAlign: 'center',
  },
  selectedOption: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  modalClose: {
    fontSize: 16,
    paddingVertical: 10,
    textAlign: 'center',
    color: '#cc0000',
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
});
