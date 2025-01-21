const FormData = require('form-data'); 
const fs = require('fs');
const axios = require('axios');
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

exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const serverURL = process.env.serwerURL;
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.get(`http://${serverURL}/events/${id}/edit/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const event = response.data;

    // Funkcja do formatowania daty w odpowiedni sposób
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toISOString().slice(0, 16); // Format "YYYY-MM-DDTHH:MM"
    };

    // Formatowanie dat w obiekcie event
    event.start_time = formatDate(event.start_time);
    event.end_time = formatDate(event.end_time);

    res.render('panel/edit-event', {
      event,
      categories: event.available_categories,
    });
  } catch (error) {
    console.error('Error fetching event for edit form:', error.response?.data || error.message);
    res.status(500).send('Error fetching event for edit form.');
  }
};



exports.editEvent = async (req, res) => {
  const { id } = req.params;
  const serverURL = process.env.serwerURL;
  const authToken = req.cookies.auth_token;

  let { item_properties, default_values, categories, password } = req.body;

  // Konwersja do tablic
  if (typeof item_properties === 'string') item_properties = [item_properties];
  if (typeof default_values === 'string') default_values = [default_values];
  if (typeof categories === 'string') categories = [categories];

  const isPrivate = req.body.is_private === 'on';

  // Obsługa obrazu
  const imageFile = req.file ? req.file.buffer.toString('base64') : null;

  const eventData = {
    ...req.body,
    is_private: isPrivate,
    item_properties,
    default_values,
    categories,
    password: password || null,
    image: imageFile,
  };

  try {
    await axios.put(`http://${serverURL}/events/${id}/edit/`, eventData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    res.redirect(`/panel/events/${id}`);
  } catch (error) {
    console.error('Error updating event:', error.response?.data || error.message);
    res.status(500).send('Error updating event.');
  }
};

exports.renderCreateEvent = async (req, res) => {
  try {
    const serverURL = process.env.serwerURL;
    const response = await axios.get(`http://${serverURL}/create`, {
      headers: {
        'Authorization': `Bearer ${req.cookies.auth_token}`, 
      },
    });

    const categories = response.data.categories || [];
    res.render('events/create', { error: null, categories });
  } catch (error) {
    console.error('Błąd podczas pobierania kategorii:', error.message);
    res.render('events/create', { error: 'Nie udało się załadować kategorii', categories: [] });
  }
};

exports.submitEvent = async (req, res) => {
  const serverURL = process.env.serwerURL;
  try {
    let imageBase64 = req.file? req.file.buffer.toString('base64'):null;
    const isPrivate = req.body.is_private === 'on' ? true : false; 

  let { item_properties, default_values, categories } = req.body;

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

    const formData = {
      title: req.body.title,
      item_properties: item_properties || [], 
      default_values: default_values || [],   
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      is_private: isPrivate, 
      password: password || null,
      categories: categories || [],
      image: imageBase64
    };

    const token = req.cookies.auth_token;
    console.log(token);
    const response = await axios.post(`http://${serverURL}/create`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
 
    res.redirect(`/panel/events/${response.data.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Błąd podczas przesyłania Eventu');
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

exports.deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  const authToken = req.cookies.auth_token;
  const serverURL = process.env.serwerURL;

  try {
    const response = await axios.delete(`http://${serverURL}/${eventId}/delete`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    res.status(200).send({ message: "Wydarzenie zostało pomyślnie usunięte." });
  } catch (error) {
    console.error("Błąd podczas usuwania wydarzenia:", error.response?.data || error.message);
    res.status(500).send({ error: "Nie udało się usunąć wydarzenia." });
  }
};

exports.changeEventStatus = async (req, res) => {
  const { eventId } = req.params;
  const { status } = req.body;
  const authToken = req.cookies.auth_token;
  const serverURL = process.env.serwerURL;

  try {
    const response = await axios.post(`http://${serverURL}/${eventId}/change-status/`, 
      { status }, 
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    res.status(200).send({ message: response.data.message, new_status: response.data.new_status });
  } catch (error) {
    console.error("Błąd podczas zmiany statusu wydarzenia:", error.response?.data || error.message);
    res.status(500).send({ error: "Nie udało się zmienić statusu wydarzenia." });
  }
};