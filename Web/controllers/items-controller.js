const axios = require('axios');
const serverURL  = process.env.serwerURL;

// Metoda GET - wyświetla formularz
exports.getCreateItemForm = async (req, res) => {
  const { eventId } = req.params;
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.get(`http://${serverURL}/${eventId}/add-item/`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });


    //console.log('Response Data:', response.data); // Sprawdzamy dane w odpowiedzi

    const event = response.data;
    
    // Zwracamy formularz z item_properties i default_values
    res.render('items/create-item', {
      event,
      item_properties: event.item_properties,
      default_values: event.default_values
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading event data');
  }
};

// // Metoda POST - dodaje item do eventu
exports.createItem = async (req, res) => {
    const { eventId } = req.params;
    let { item_values } = req.body;  // Oczekujemy, że item_values zostanie przesłane w formularzu
    const { name } = req.body;
    const authToken = req.cookies.auth_token;
  
    let imageBase64 = req.file ? req.file.buffer.toString('base64') : null;
  
    if (imageBase64) {
      console.log('Image file (base64 encoded):', imageBase64.substring(0, 100));  // Wypisujemy tylko część base64, aby nie zaśmiecało konsoli
    } else {
      console.log('No image uploaded');
    }
  
    try {
      // Konwertujemy item_values na listę (tablicę), jeśli nie jest nią
      if (!Array.isArray(item_values)) {
        item_values = Object.values(item_values);  // Jeśli item_values jest obiektem, konwertujemy na listę
      }
  
      // Przygotowujemy dane do wysłania
      const dataToSend = {
        name: name,
        item_values: item_values
      };
  
      if (imageBase64) {
        dataToSend.image = imageBase64; // Przesyłamy obrazek, jeśli został dołączony
      }
  
      // Logowanie danych przed wysłaniem
      console.log('\nEvent ID:', eventId);
      console.log('Item Values:', item_values);
      console.log('Nazwa:', name);
      console.log('Auth Token:', authToken);
      console.log('Image:', imageBase64 ? imageBase64.substring(0, 100) : 'No image uploaded');
  
      // Wysyłanie danych do API Django
      const response = await axios.post(`http://${serverURL}/${eventId}/add-item/`, dataToSend, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
  
      // Zwracamy odpowiedź, możemy przekierować użytkownika po sukcesie
      res.redirect(`/panel/events/${eventId}/items`);
    } catch (error) {
      //console.error(error);
      res.status(500).send('Error adding item – the item with this name may already exist in the database.');
    }
  };
  

exports.getEventItems = async (req, res) => {
  const eventId = req.params.event_id;
  const authToken = req.cookies.auth_token;

  try {
    // Pobieramy dane o wydarzeniu i itemach
    const response = await axios.get(`http://${serverURL}/${eventId}/items/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const { event, items } = response.data.data;  // Dane o wydarzeniu i itemach

    // Rozdzielamy event na odpowiednie zmienne
    const { title, item_properties, default_values } = event;

    // Modyfikujemy itemy, aby przekazać item_values oraz domyślne wartości
    const itemsData = items.map(item => {
      // Mapujemy itemy, dodajemy domyślne wartości, gdy item_values są puste
      const itemWithValues = item.item_values.map((value, index) => {
        return value.trim() === "" && default_values[index] ? default_values[index] : value;
      });
      return {
        ...item,
        item_values: itemWithValues
      };
    });

    // Przesyłamy dane do widoku
    res.render('items/event-items', {
      event: { id: eventId, title, item_properties, default_values },
      items: itemsData   // Przesyłamy listę itemów z przetworzonymi wartościami
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Błąd podczas pobierania itemów dla wydarzenia.');
  }
};

exports.deleteItem = async (req, res) => {
  const { eventId, itemId } = req.params;
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.delete(`http://${serverURL}/${eventId}/items/${itemId}/delete`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Przekierowanie po sukcesie
    //res.redirect(`/panel/events/${eventId}/items`);
    res.status(200).send({ message: "Przedmiot został pomyślnie usunięty." });
  } catch (error) {
    //console.error(error);
    res.status(500).send('Błąd podczas usuwania przedmiotu.');
  }
};


exports.getEditItemForm = async (req, res) => {
  const { eventId, itemId } = req.params;
  const authToken = req.cookies.auth_token;

  try {
    // Pobierz dane itemu z API Django
    const itemResponse = await axios.get(`http://${serverURL}/${eventId}/items/${itemId}/edit`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Pobierz dane wydarzenia, aby uzyskać item_properties
    const eventResponse = await axios.get(`http://${serverURL}/events/${eventId}/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const item = itemResponse.data;
    const { item_properties, default_values } = eventResponse.data;

    // Przekaż dane do widoku
    res.render('items/edit-item', {
      item,
      itemProperties: item_properties, // Etykiety pól
      defaultValues: default_values,   // Domyślne wartości
    });
  } catch (error) {
    console.error('Błąd podczas pobierania danych itemu lub eventu:', error.response?.data || error.message);
    res.status(500).send('Nie udało się załadować danych.');
  }
};

exports.editItem = async (req, res) => {
  const { eventId, itemId } = req.params;
  const authToken = req.cookies.auth_token;

  // Przetwarzanie obrazu, jeśli został przesłany
  const imageFile = req.file ? req.file.buffer.toString('base64') : null;

  if (imageFile) {
    console.log('Image file (base64 encoded):', imageFile.substring(0, 100)); // Logujemy tylko fragment base64
  } else {
    console.log('No image uploaded');
  }

  // Przygotowanie danych do wysłania
  const itemData = {
    ...req.body,
    image: imageFile, // Dodajemy obraz w formacie base64
  };

  try {
    // Wysyłamy dane do API Django
    await axios.put(`http://${serverURL}/${eventId}/items/${itemId}/edit`, itemData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Przekierowanie po zapisaniu zmian
    res.redirect(`/panel/events/${eventId}/items`);
  } catch (error) {
    console.error('Błąd podczas zapisywania itemu:', error.response?.data || error.message);
    res.status(500).send('Nie udało się zapisać zmian.');
  }
};
