const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.isAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;
    console.log('Token JWT:', token); 

    if (!token) {
      return res.status(401).send('Brak tokenu'); 
    }

    const response = await axios.get('http://127.0.0.1:8000/api/events/admin/allevents', {
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    });

    res.render('allevents', { events: response.data });
  } catch (error) {
    console.error('Błąd pobierania eventów:', error.message); 
    res.status(error.response?.status || 500).send(error.response?.data || 'Błąd serwera');
  }
};
