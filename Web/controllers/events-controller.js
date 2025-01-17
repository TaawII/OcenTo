const FormData = require('form-data'); // Wymaga zainstalowania form-data
const fs = require('fs');
const axios = require('axios');
const { encryptPassword } = require('../utils/encryption');
const { decryptPassword } = require('../utils/encryption');
const QRCode = require('qrcode');

exports.getEvent = async (req, res) => {
  const { id } = req.params;
  const serverURL = process.env.serwerURL;
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.get(`http://${serverURL}/events/${id}/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });


    // Funkcja do formatowania daty
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      if (isNaN(date)) {
        return "Invalid Date"; // W przypadku niepoprawnej daty
      }
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      return date.toLocaleString('pl-PL', options);  // Formatowanie na polski format
    };


    // Jeśli zdjęcie istnieje, konwertujemy je na Base64
    if (response.data.image) {
      const base64Image = response.data.image.toString('base64');
      response.data.image = base64Image;
    }

    // Formatowanie daty
    response.data.start_time = formatDate(response.data.start_time);
    response.data.end_time = formatDate(response.data.end_time);

    const qrData = {
      id:id,
      password:response.data.password,
    }
    const QRJsonString = JSON.stringify(qrData);
    const qrCode = await QRCode.toDataURL(QRJsonString);

    res.render('panel/event-detail', { event: response.data, qrCode });
  } catch (error) {
    console.error(error.response?.data);
    console.error(error.response?.status);
    if (error.response && error.response.status === 403) {
      return res.status(403).send('You are not authorized to view this event.');
    }
    res.status(500).send('Error fetching event.');
  }
};

exports.editEvent = async (req, res) => {
  const { id } = req.params;
  const serverURL = process.env.serwerURL;
  const authToken = req.cookies.auth_token;

  const isPrivate = req.body.is_private === 'on' ? true : false; // Sprawdzamy, czy checkbox jest zaznaczony

  //Sprawdzenie, czy dane item_properties i default_values są w formie tablicy
  let { item_properties, default_values } = req.body;

  //Jeśli są pojedynczymi wartościami, przekonwertuj je na tablice
  if (typeof item_properties === 'string') {
    item_properties = [item_properties];
  }
  if (typeof default_values === 'string') {
    default_values = [default_values];
  }

  //Logowanie przed wysyłaniem danych do Django
  // console.log('item_properties:', item_properties);
  // console.log('default_values:', default_values);

  // Jeśli w formularzu został wysłany plik
  let imageFile = req.file ? req.file.buffer.toString('base64') : null;

  if (imageFile) {
    console.log('Image file (base64 encoded):', imageFile.substring(0, 100));  // Wypisujemy tylko część base64, aby nie zaśmiecało konsoli
  } else {
    console.log('No image uploaded');
  }


  //Przygotowanie danych do wysłania
  const eventData = {
    ...req.body,
    is_private: isPrivate,  // Ustawiamy prawidłową wartość booleanową dla is_private
    item_properties,  //Tablica item_properties
    default_values,   //Tablica default_values
    image: imageFile, //Przesyłanie obrazu w formie base64
  };

  try {
    const response = await axios.put(`http://${serverURL}/events/${id}/edit/`, eventData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    res.redirect(`/panel/events/${id}`);// Po udanym zapisie przenosimy użytkownika na stronę szczegółów eventu
  } catch (error) {
    if (error.response && error.response.status === 403) {
      return res.status(403).send('You are not authorized to edit this event.');
    }
    res.status(500).send('Error updating event.');
  }
};

exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const serverURL = process.env.serwerURL;
  const authToken = req.cookies.auth_token;

  try {
    //Pobierz dane eventu z Django
    const response = await axios.get(`http://${serverURL}/events/${id}/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    //Formatowanie daty w odpowiedni sposób
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toISOString().slice(0, 16);  //Zwróci datę w formacie "YYYY-MM-DDTHH:MM"
    };

    //Jeśli zdjęcie istnieje, konwertuj na base64, aby wyświetlić w formularzu
    let imageSrc = null;
    if (response.data.image) {
      //Zakładając, że response.data.image jest w formacie binarnym (Buffer)
      imageSrc = `data:image/jpeg;base64,${response.data.image.toString('base64')}`;
    }

    //Przekaż dane eventu (w tym zdjęcie) do widoku formularza edycji
    res.render('panel/edit-event', {
      event: {
        ...response.data,
        start_time: formatDate(response.data.start_time),
        end_time: formatDate(response.data.end_time),
        image: imageSrc, //Dodanie image w formacie base64
      }
    });
  } catch (error) {
    console.error(error.response?.data);
    console.error(error.response?.status);
    return res.status(500).send('Error fetching event for edit form.');
  }
};

exports.renderCreateEvent = (req, res) => {
  res.render('events/create', { error: null });
};
exports.submitEvent = async (req, res) => {
  const serverURL = process.env.serwerURL;
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
    // if (password) {
    //   password = encryptPassword(password); // Szyfruj hasło przed wysłaniem
    // }
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
    const response = await axios.post(`http://${serverURL}/create`, formData, {
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
}

exports.getUserEvents = async (req, res) => {
  const serverURL = process.env.serwerURL;
  const authToken = req.cookies.auth_token;

  // Funkcja do formatowania daty
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) {
      return "Invalid Date"; // W przypadku niepoprawnej daty
    }
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return date.toLocaleString('pl-PL', options);  // Formatowanie na polski format
  };

  try {
    const response = await axios.get(`http://${serverURL}/events/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Formatowanie dat dla każdego eventu
    response.data.forEach(event => {
      event.start_time = formatDate(event.start_time);
      event.end_time = formatDate(event.end_time);
    });

    // Przekazanie danych wydarzeń do widoku
    res.render('panel/user-events', { events: response.data });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user events.');
  }
};

