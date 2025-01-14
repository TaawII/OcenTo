const FormData = require('form-data'); // Wymaga zainstalowania form-data
const fs = require('fs');
const axios = require('axios');

exports.renderCreateEvent = (req, res) => {
  res.render('events/create', { error: null });
};
exports.submitEvent = async (req, res) => {
  let imagePath = '';
  try {
    if (!req.file) {
      return res.status(400).send('Nie przesłano pliku obrazka');
    }
 
    const formData = new FormData();
    const fields = req.body;
 
    // Dodanie danych do formData
    formData.append('title', fields.title || "Testowy tytuł");
    formData.append('item_properties', fields.item_properties || '[]');
    formData.append('default_values', fields.default_values || '[]');
    formData.append('status', fields.status || 'Active');
    formData.append('start_time', fields.start_time || '2021-06-01T12:00:00Z');
    formData.append('end_time', fields.end_time || '2021-06-01T12:00:00Z');
    //formData.append('is_private', fields.is_private === 'on' ? 'true' : 'false');  // Zmiana na 'true'/'false'
    formData.append('password', fields.password || '');  // Ustawienie pustego stringu jeśli brak
    formData.append('categories', fields.categories || '[]');
 
    // Pobieramy ścieżkę do pliku obrazu
    imagePath = req.file.path;
 
    // Odczyt pliku i konwersja do Base64
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
 
    // Dodanie obrazu w formacie Base64 do formData
    formData.append('image', base64Image);
    const token = req.cookies.auth_token;
    console.log(token);
    // Przesyłanie danych do Django
    const response = await axios.post('http://127.0.0.1:8000/api/events/create', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
 
    res.send('Event został przesłany pomyślnie!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Błąd podczas przesyłania Eventu');
  } finally {
    // Usunięcie pliku po przesłaniu, nawet w przypadku błędu
    if (imagePath) {
      try {
        fs.unlinkSync(imagePath);
      } catch (unlinkError) {
        console.error('Błąd podczas usuwania pliku:', unlinkError);
      }
    }
  }
}
 