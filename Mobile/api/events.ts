import axios from 'axios';

// Adres URL Twojego API
const API_URL = 'http://192.168.137.1:8000/api/events'; // Zmień to na odpowiedni URL

// Funkcja, która pobiera wszystkie eventy
export const getEvents = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}/MobileEventsList`);
    return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania wydarzeń: ', error);
    return [];
  }
};

// Funkcja, która pobiera wszystkie itemy danego eventu
export const getItems = async (eventId: Number): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}/MobileItemsList/${eventId}`);
    if (response.status == 200) {
      if (response.data.success == true) {
        return response.data.data
      } else {
        return [];
      }
    } else {
      console.error('Błąd podczas pobierania listy przedmiotów: ', response.data.error);
      return [];
    }
  } catch (error) {
    console.error('Nieznany błąd podczas pobierania listy przedmiotów: ', error);
    return [];
  }
};

// Funckja do sprawdzania czy jestesmy uczestnikami danego eventu
export const isPermissionToShowItems = async (eventId: Number): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/CheckEventMembership?eventId=${eventId}`);
    if (response.status == 200) {
      if (response.data.success == true) {
        return true
      } else {
        return false
      }
    } else {
      console.error('Błąd podczas sprawdzania czy uzytkownik nalezy do danego wydarzenia: ', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('Nieznany błąd podczas sprawdzania czy uzytkownik nalezy do danego wydarzenia: ', error);
    return null;
  }
};

// Funkcja umożliwiająca dołaczenie do eventu
export const joinEvent = async (eventId: Number, password: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/JoinEvent`, { eventId, password });
    if (response.status == 200) {
      if (response.data.success == true) {
        return { success: true }
      } else {
        return { success: false, message: response.data.message }
      }
    } else {
      console.error('Błąd podczas dodawania uzytkownika do danego wydarzenia: ', response.data.error);
      return { success: false, message: 'Wystąpił nieznany bład, spróbuj ponownie za chwile.' };
    }
  } catch (error) {
    console.error('Nieznany błąd podczas dodawania uzytkownika do danego wydarzenia: ', error);
    return null;
  }
};

// Funkcja umożliwiająca dołaczenie do eventu przy pomocy kodu QR
export const joinEventQR = async (eventId: Number, password: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/JoinEventQR`, { eventId, password });
    if (response.status == 200) {
      if (response.data.success == true) {
        return { success: true }
      } else {
        return { success: false, message: response.data.message }
      }
    } else {
      console.error('Błąd podczas dodawania uzytkownika do danego wydarzenia: ', response.data.error);
      return { success: false, message: 'Wystąpił nieznany bład, spróbuj ponownie za chwile.' };
    }
  } catch (error) {
    console.error('Nieznany błąd podczas dodawania uzytkownika do danego wydarzenia: ', error);
    return null;
  }
};
//Funkcja do pobierania szczegółów przedmiotu
export const getItemDetails = async (itemId: Number): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}/MobileItemDetails/${itemId}`);
    return response.data.data;
  } catch (error) {
    console.error('Błąd podczas pobierania wydarzeń: ', error);
    return [];
  }
};

// Funkcja do dodawania lub modyfikowania oceny przedmiotu
export const addOrModifyItemRating = async (item_id: Number, rating_value: Number, comment: String): Promise<any[]> => {
  try {
    const response = await axios.post(`${API_URL}/AddOrModifyRating`, {item_id, rating_value, comment});
    return response.data.data;
  } catch (error) {
    console.error('Błąd podczas pobierania wydarzeń: ', error);
    return [];
  }
};

// Funkcja do usuwania oceny przedmiotu
export const deleteComment = async (item_id: Number): Promise<any[]> => {
  try {
    const response = await axios.delete(`${API_URL}/mobileRatingDelete/${item_id}`);
    return response.data.data;
  } catch (error) {
    console.error('Błąd podczas usuwania komentarza: ', error);
    return [];
  }
};

// Testowanie czasu zapytan
// const startTime = new Date().getTime();  // Zapisz czas wysłania zapytania
// const endTime = new Date().getTime();  // Zapisz czas zakończenia zapytania
// console.log(`Czas wykonywania zapytania ${endTime - startTime} ms`);