const axios = require('axios');

exports.renderCreateEvent = (req, res) => {
  res.render('events/create', { error: null });
};

exports.createEvent = async (req, res) => {
  const formData = {
    title: req.body.title,
    item_properties: req.body.item_properties || [], 
    default_values: req.body.default_values || [],   
    status: req.body.status,
    start_time: req.body.start_time,
    end_time: req.body.end_time,
    is_private: req.body.is_private === 'on',
    password: req.body.password || null,
    categories: req.body.categories || []
  };

  // Pobranie tokena z ciasteczek (czyli autoryzacja)
  const token = req.cookies.auth_token; // Token przechowywany w ciasteczku 'auth_token'

  if (!token) {
    return res.render('events/create', { error: 'Nie znaleziono tokena autoryzacyjnego.' });
  }

  try {
    // Wyślij dane do backendu Django
    const response = await axios.post('http://127.0.0.1:8000/api/events/create', formData, {
      headers: {
        'Authorization': `Bearer ${token}`, // Użycie tokena z ciasteczek
        'Content-Type': 'application/json'
      }
    });

    // Jeśli udało się utworzyć event, przekieruj na stronę z potwierdzeniem
    res.redirect('/events/create?success=true');
  } catch (error) {
    console.error(error);
    res.render('events/create', { error: 'Wystąpił błąd podczas tworzenia wydarzenia.' });
  }
};
