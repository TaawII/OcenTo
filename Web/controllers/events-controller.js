const FormData = require('form-data'); // Wymaga zainstalowania form-data
const fs = require('fs');
const axios = require('axios');
const { encryptPassword } = require('../utils/encryption');
const { decryptPassword } = require('../utils/encryption');

exports.renderCreateEvent = (req, res) => {
  res.render('events/create', { error: null });
};
exports.submitEvent = async (req, res) => {
  try {
    let imageBase64 = req.file? req.file.buffer.toString('base64'):null;
    const isPrivate = req.body.is_private === 'on' ? true : false; // Sprawdzamy, czy checkbox jest zaznaczony

  //Sprawdzenie, czy dane item_properties i default_values są w formie tablicy
  let { item_properties, default_values, categories } = req.body;

  //Jeśli są pojedynczymi wartościami, przekonwertuj je na tablice
  if (typeof item_properties === 'string') {
    item_properties = [item_properties];
  }
  if (typeof default_values === 'string') {
    default_values = [default_values];
  }
  if (typeof categories === 'string') {
    categories = [categories];
  }
  let password = req.body.password || null;
    if (password) {
      password = encryptPassword(password); // Szyfruj hasło przed wysłaniem
    }
    const formData = {
      title: req.body.title,
      item_properties: item_properties || [], 
      default_values: default_values || [],   
      status: req.body.status,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      is_private: isPrivate, //poprawka
      password: password || null,
      categories: categories || [],
      image: imageBase64
    };

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
  } 
}
exports.getDecryptedPassword = (req, res) => {
  try {
    const { encryptedPassword } = req.body;

    // Sprawdzenie, czy zaszyfrowane hasło zostało przesłane
    if (!encryptedPassword) {
      return res.status(400).json({ error: 'Brak zaszyfrowanego hasła do odszyfrowania' });
    }

    console.log('Zaszyfrowane hasło otrzymane z Postmana:', encryptedPassword);

    // Próba odszyfrowania hasła
    const decryptedPassword = decryptPassword(encryptedPassword);

    console.log('Odszyfrowane hasło:', decryptedPassword);

    // Zwrócenie odszyfrowanego hasła w odpowiedzi
    res.status(200).json({ decryptedPassword });
  } catch (error) {
    console.error('Błąd podczas odszyfrowywania hasła:', error.message);

    // Jeśli wystąpił błąd, zwróć odpowiednią odpowiedź
    res.status(500).json({ error: 'Błąd podczas odszyfrowywania hasła. Upewnij się, że zaszyfrowane hasło jest poprawne.' });
  }
};

