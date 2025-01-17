const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.isAdmin = async (req, res, next) => {
  try {
    // Pobranie tokenu JWT z ciasteczek
    const token = req.cookies.auth_token;
    console.log('Token JWT:', token); // Wyświetlenie tokenu w logach do debugowania

    if (!token) {
      return res.status(401).send('Brak tokenu'); // Jeśli brak tokenu, zwróć błąd 401
    }

    // Wysłanie żądania do Django z tokenem
    const response = await axios.get('http://127.0.0.1:8000/api/events/admin/allevents', {
      headers: {
        Authorization: `Bearer ${token}`, // Przekazanie tokenu JWT
      },
    });

    // Zwrot danych do klienta
    res.render('allevents', { events: response.data });
  } catch (error) {
    console.error('Błąd pobierania eventów:', error.message); // Logowanie błędów
    res.status(error.response?.status || 500).send(error.response?.data || 'Błąd serwera');
  }
};
