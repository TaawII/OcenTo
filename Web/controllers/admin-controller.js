const axios = require('axios');

exports.getAllEvents = async (req, res) => {
  try {
    const response = await axios.get(`http://127.0.0.1:8000/api/events/admin/events`, {
      headers: {
        Authorization: `Bearer ${req.user.token}`, 
      },
    });
    res.render('allevents', { events: response.data }); 
  } catch (error) {
    console.error('Błąd podczas pobierania wydarzeń:', error.message);
    res.status(500).send('Wewnętrzny błąd serwera');
  }
};

exports.getEvent = async (req, res) => {
  const { id } = req.params;
  const serverURL = process.env.SERVER_URL || 'http://127.0.0.1:8000'; 
  const authToken = req.cookies.auth_token;

  try {
  
    const response = await axios.get(`${serverURL}/api/events/admin/allevents/${id}/`, {
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
  const serverURL = process.env.SERVER_URL || 'http://127.0.0.1:8000'; 
  const authToken = req.cookies.auth_token; 
  console.log(`Fetching items for event ID: ${id}`);
  
  try {

    const response = await axios.get(`${serverURL}/api/events/admin/allevents/${id}/items`, {
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
  const serverURL = process.env.SERVER_URL || 'http://127.0.0.1:8000';
  const authToken = req.cookies.auth_token; 

  try {

      const response = await axios.get(`${serverURL}/api/events/admin/allevents/${eventId}/items/${itemId}/ratings/`, {
          headers: { Authorization: `Bearer ${authToken}` },
      });


      res.render('admin-item-ratings', {
          ratings: response.data,
          eventId,
          itemId,
          
      });
      console.log(response.data);
  } catch (error) {
      console.error('Error fetching item ratings:', error.message);

      if (error.response?.status === 403) {
          return res.status(403).send('Brak dostępu.');
      }
      res.status(500).send('Błąd podczas pobierania ocen.');
  }
};