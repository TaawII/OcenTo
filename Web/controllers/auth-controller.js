const axios = require('axios');
require('dotenv').config();

// Funkcja do obsługi rejestracji
exports.registerUser = async (req, res) => {
  const { username, password } = req.body;
  const serverURL = process.env.serwerURL; // Adres API

  try {
    const registerURL = `http://${serverURL}/register`;
    const response = await axios.post(registerURL, { username, password });

    // Obsługa sukcesu rejestracji
    if (response.status === 201) {
      // Przekierowanie do widoku logowania po pomyślnej rejestracji
      res.render('auth/login', { 
        error: null, 
        success: 'Konto zostało pomyślnie utworzone! Zaloguj się.' 
      });
    } else {
      res.render('auth/register', { 
        error: 'Nieoczekiwana odpowiedź serwera.', 
        success: null 
      });
    }
  } catch (error) {
    // Obsługa błędów rejestracji
    let errorMessage = 'Wystąpił błąd podczas rejestracji.';
    if (error.response) {
      if (error.response.status === 400) {
        errorMessage = 'Użytkownik o podanej nazwie już istnieje.';
      } else if (error.response.status === 500) {
        errorMessage = 'Wewnętrzny błąd serwera. Spróbuj ponownie później.';
      }
    }

    res.render('auth/register', { 
      error: errorMessage, 
      success: null 
    });
  }
};

// Funkcja do obsługi logowania
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  const serverURL = process.env.serwerURL; // Adres API

  try {
    const loginURL = `http://${serverURL}/login`;
    const response = await axios.post(loginURL, { username, password });

    // Obsługa sukcesu logowania
    if (response.status === 200 && response.data.token) {
      res.cookie('auth_token', response.data.token, { 
        httpOnly: true, // Ciasteczko będzie dostępne tylko dla serwera i nie można go odczytać lub zmodyfikować za pomocą JavaScript w przeglądarce.
        secure: process.env.NODE_ENV === 'production', // Jeżeli aplikacja działa w trybie produkcyjnym (production), ciasteczko będzie wymagać HTTPS.
        maxAge: 7 * 24 * 60 * 60 * 1000 // Ciasteczko ważne przez tydzień.
      });
      res.redirect('/panel/events');
    } else {
      // Jeśli odpowiedź serwera nie zawiera tokena, wyświetlamy ogólny błąd
      const errorMessage = response.data.error || 'Nieoczekiwana odpowiedź serwera.';
      res.render('auth/login', { 
        error: errorMessage, 
        success: null 
      });
    }
  } catch (error) {
    // Obsługa błędów logowania
    let errorMessage = 'Wystąpił błąd podczas logowania.';

    if (error.response && error.response.data && error.response.data.error) {
      // Jeśli odpowiedź serwera zawiera wiadomość błędu, wyświetlamy ją
      errorMessage = error.response.data.error;
    } else if (error.response) {
      // Jeżeli wystąpił błąd HTTP, wyświetlamy domyślną wiadomość
      errorMessage = 'Błąd połączenia z serwerem. Spróbuj ponownie później.';
    }

    res.render('auth/login', { 
      error: errorMessage, 
      success: null 
    });
  }
};

exports.logout = (req, res) => {
  
  res.clearCookie('auth_token');  //Usunięcie ciasteczka
  res.render('auth/login', {
    success: 'Zostałeś wylogowany.',
    error: null
  });
};

