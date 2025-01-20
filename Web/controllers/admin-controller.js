const axios = require('axios');
exports.getAllEvents = async (req, res) => {
  const authToken = req.cookies.auth_token;
  const serverURL = process.env.serwerURL || '127.0.0.1:8000/api/events'; 
  try {
    // Pobranie wydarzeń z API
    const response = await axios.get(`http://${serverURL}/admin/allevents`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Ustawienia formatowania daty w języku polskim
    const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Format 24-godzinny
    });

    // Funkcja do formatowania daty
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      if (isNaN(date)) {
        return "Niepoprawna data"; // Obsługa błędnego formatu daty
      }
      return dateFormatter.format(date);
    };

    // Formatowanie wydarzeń
    const formattedEvents = response.data.map((event) => ({
      ...event,
      start_time: formatDate(event.start_time),
      end_time: formatDate(event.end_time),
    }));

    // Debugowanie
    console.log("Formatted Events:", formattedEvents);

    // Renderowanie widoku z przetworzonymi danymi
    res.render("allevents", { events: formattedEvents });
  } catch (error) {
    console.error("Błąd podczas pobierania wydarzeń:", error.message);

    // Obsługa błędów
    res.status(500).send("Wewnętrzny błąd serwera");
  }
};

exports.getEvent = async (req, res) => {
  const { id } = req.params;
  const serverURL = process.env.serwerURL || '127.0.0.1:8000/api/events'; 
  const authToken = req.cookies.auth_token;

  try {
  
    const response = await axios.get(`http://${serverURL}/admin/allevents/${id}/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      if (isNaN(date)) {
        return "Invalid Date";
      }
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };
      return date.toLocaleString('pl-PL', options);
    };


    response.data.start_time = formatDate(response.data.start_time);
    response.data.end_time = formatDate(response.data.end_time);

    if (response.data.image) {
      const base64Image = response.data.image.toString('base64');
      response.data.image = base64Image;
    }

    res.render('admin-event-details', { event: response.data });
  } catch (error) {
    console.error('Error fetching event details:', error.message);
    if (error.response?.status === 403) {
      return res.status(403).send('You are not authorized to view this event.');
    }
    res.status(500).send('Error fetching event.');
  }
};

exports.getEventItems = async (req, res) => {
  const { id } = req.params; // ID wydarzenia
  const serverURL = process.env.serwerURL || '127.0.0.1:8000/api/events'; 
  const authToken = req.cookies.auth_token; 
  console.log(`Fetching items for event ID: ${id}`);
  
  try {

    const response = await axios.get(`http://${serverURL}/admin/allevents/${id}/items`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const items = response.data.items;
    const defaultValues = response.data.default_values;
    const item_properties = response.data.item_properties;

    res.render('event-items', { items, eventId: id, defaultValues, item_properties });
  } catch (error) {
    console.error('Error fetching event items:', error.message);
    if (error.response?.status === 403) {
      return res.status(403).send('You are not authorized to view items for this event.');
    }
    res.status(500).send('Error fetching items.');
  }
};

exports.getItemRatings = async (req, res) => {
  const { eventId, itemId } = req.params;
  const serverURL = process.env.serwerURL || '127.0.0.1:8000/api/events'; 
  const authToken = req.cookies.auth_token; 

  try {

      const response = await axios.get(`http://${serverURL}/admin/allevents/${eventId}/items/${itemId}/ratings/`, {
          headers: { Authorization: `Bearer ${authToken}` },
      });


      res.render('admin-item-ratings', {
          ratings: response.data,
          eventId,
          itemId,
          
      });
  } catch (error) {
      console.error('Error fetching item ratings:', error.message);

      if (error.response?.status === 403) {
          return res.status(403).send('Brak dostępu.');
      }
      res.status(500).send('Błąd podczas pobierania ocen.');
  }
};
exports.deleteEvent = async (req, res) => {
  const { id } = req.params; // ID wydarzenia
  const serverURL = process.env.serwerURL || '127.0.0.1:8000/api/events'; 
  const authToken = req.cookies.auth_token; 

  try {
    const response = await axios.delete(`http://${serverURL}/admin/allevents/${id}/delete/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    res.status(200).send({ message: response.data.message });
  } catch (error) {
    console.error('Error deleting event:', error.message);
    if (error.response?.status === 403) {
      return res.status(403).send('You are not authorized to delete this event.');
    } else if (error.response?.status === 404) {
      return res.status(404).send('Event not found.');
    }
    res.status(500).send('Error deleting event.');
  }
};

exports.deleteItem = async (req, res) => {
  const { eventId, itemId } = req.params;
  const serverURL = process.env.serwerURL || '127.0.0.1:8000/api/events'; 
  const authToken = req.cookies.auth_token; 

  try {
    const response = await axios.delete(`http://${serverURL}/admin/allevents/${eventId}/items/${itemId}/delete/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    res.status(200).send({ message: response.data.message });
  } catch (error) {
    console.error('Error deleting event:', error.message);
    if (error.response?.status === 403) {
      return res.status(403).send('You are not authorized to delete this event.');
    } else if (error.response?.status === 404) {
      return res.status(404).send('Event not found.');
    }
    res.status(500).send('Error deleting event.');
  }
};

exports.deleteRatingAndComment = async (req, res) => {
  const { eventId, itemId, ratingId } = req.params; 
  const serverURL = process.env.serwerURL || '127.0.0.1:8000/api/events';  
  const authToken = req.cookies.auth_token; 

  try {
    const response = await axios.delete(
      `http://${serverURL}/admin/allevents/${eventId}/items/${itemId}/ratings/${ratingId}/delete/`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    res.status(200).send({ message: response.data.message }); 
  } catch (error) {
    console.error('Error deleting rating and comment:', error.message);
    if (error.response?.status === 403) {
      return res.status(403).send('You are not authorized to delete this rating and comment.');
    } else if (error.response?.status === 404) {
      return res.status(404).send('Rating and comment not found.');
    }
    res.status(500).send('Error deleting rating and comment.');
  }
};

exports.deleteComment = async (req, res) => {
  const { eventId, itemId, ratingId } = req.params;
  const serverURL = process.env.serwerURL || '127.0.0.1:8000/api/events'; 
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.patch(
      `http://${serverURL}/api/events/admin/allevents/${eventId}/items/${itemId}/ratings/${ratingId}/delete-comment/`,
      {}, // Nie wysyłamy żadnego payload
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    res.status(200).send({ message: response.data.message });
  } catch (error) {
    console.error('Error deleting comment:', error.message);
    if (error.response?.status === 403) {
      return res.status(403).send('You are not authorized to delete this comment.');
    } else if (error.response?.status === 404) {
      return res.status(404).send('Comment not found.');
    }
    res.status(500).send('Error deleting comment.');
  }
};
