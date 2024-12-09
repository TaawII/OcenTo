import axios from 'axios';

// Adres URL Twojego API
const API_URL = 'http://192.168.137.1:8000/api/events'; // Zmień to na odpowiedni URL

// Funkcja, która pobiera dane
export const getEvents = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}/MobileEventsList`);
    return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania wydarzeń: ', error);
    throw error;
  }
};
