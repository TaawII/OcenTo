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
      res.redirect(`/panel/events/${eventId}`);
    } catch (error) {
      //console.error(error);
      res.status(500).send('Error adding item – the item with this name may already exist in the database.');
    }
  };
  