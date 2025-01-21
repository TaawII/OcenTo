const axios = require('axios');
const serverURL  = process.env.serwerURL;

exports.getCreateItemForm = async (req, res) => {
  const { eventId } = req.params;
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.get(`http://${serverURL}/${eventId}/add-item/`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const event = response.data;
    
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

exports.createItem = async (req, res) => {
    const { eventId } = req.params;
    let { item_values } = req.body;
    const { name } = req.body;
    const authToken = req.cookies.auth_token;
  
    let imageBase64 = req.file ? req.file.buffer.toString('base64') : null;
  
    try {
      if (!Array.isArray(item_values)) {
        item_values = Object.values(item_values);
      }
  
      const dataToSend = {
        name: name,
        item_values: item_values
      };
  
      if (imageBase64) {
        dataToSend.image = imageBase64;
      }
  
      const response = await axios.post(`http://${serverURL}/${eventId}/add-item/`, dataToSend, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
  
      res.redirect(`/panel/events/${eventId}/items`);
    } catch (error) {
      res.status(500).send('Error adding item – the item with this name may already exist in the database.');
    }
  };

exports.getEventItems = async (req, res) => {
  const eventId = req.params.event_id;
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.get(`http://${serverURL}/${eventId}/items/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const { event, items } = response.data.data;

    const { title, item_properties, default_values } = event;

    res.render('items/event-items', {
      event: { id: eventId, title, item_properties, default_values },
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Błąd podczas pobierania itemów dla wydarzenia.');
  }
};

exports.deleteItem = async (req, res) => {
  const { eventId, itemId } = req.params;
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.delete(`http://${serverURL}/${eventId}/items/${itemId}/delete`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    res.status(200).send({ message: "Przedmiot został pomyślnie usunięty." });
  } catch (error) {
    res.status(500).send('Błąd podczas usuwania przedmiotu.');
  }
};

exports.getEditItemForm = async (req, res) => {
  const { eventId, itemId } = req.params;
  const authToken = req.cookies.auth_token;

  try {
    const itemResponse = await axios.get(`http://${serverURL}/${eventId}/items/${itemId}/edit`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const eventResponse = await axios.get(`http://${serverURL}/events/${eventId}/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const item = itemResponse.data;
    const { item_properties, default_values } = eventResponse.data;

    res.render('items/edit-item', {
      item,
      itemProperties: item_properties,
      defaultValues: default_values,
    });
  } catch (error) {
    console.error('Błąd podczas pobierania danych itemu lub eventu:', error.response?.data || error.message);
    res.status(500).send('Nie udało się załadować danych.');
  }
};

exports.editItem = async (req, res) => {
  const { eventId, itemId } = req.params;
  const authToken = req.cookies.auth_token;

  const imageFile = req.file ? req.file.buffer.toString('base64') : null;

  const itemData = {
    ...req.body,
    image: imageFile,
  };

  try {
    await axios.put(`http://${serverURL}/${eventId}/items/${itemId}/edit`, itemData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    res.redirect(`/panel/events/${eventId}/items`);
  } catch (error) {
    console.error('Błąd podczas zapisywania itemu:', error.response?.data || error.message);
    res.status(500).send('Nie udało się zapisać zmian.');
  }
};

exports.getItemReviews = async (req, res) => {
  const { eventId, itemId } = req.params;
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.get(`http://${serverURL}/${eventId}/items/${itemId}/reviews`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const { item_name, ratings } = response.data;

    const hasRatings = ratings && ratings.length > 0;

    res.render('items/item-reviews', {
      itemName: item_name,
      ratings: ratings,
      hasRatings: ratings && ratings.length > 0,
      eventId: eventId,
      itemId: itemId,
    });
  } catch (error) {
    console.error('Błąd podczas pobierania ocen i komentarzy:', error.response?.data || error.message);
    res.status(500).send('Nie udało się załadować danych.');
  }
};

exports.deleteComment = async (req, res) => {
  const { eventId, itemId, ratingId } = req.params;
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.delete(`http://${serverURL}/${eventId}/items/${itemId}/reviews/${ratingId}/delete-comment`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    res.status(200).send({ message: "Komentarz został pomyślnie usunięty." });
  } catch (error) {
    console.error("Błąd podczas usuwania komentarza:", error.response?.data || error.message);
    res.status(500).send({ error: "Nie udało się usunąć komentarza." });
  }
};

exports.deleteRating = async (req, res) => {
  const { eventId, itemId, ratingId } = req.params;
  const authToken = req.cookies.auth_token;

  try {
    const response = await axios.delete(`http://${serverURL}/${eventId}/items/${itemId}/reviews/${ratingId}/delete`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    res.status(200).send({ message: "Ocena została pomyślnie usunięta." });
  } catch (error) {
    console.error("Błąd podczas usuwania oceny:", error.response?.data || error.message);
    res.status(500).send({ error: "Nie udało się usunąć oceny." });
  }
};