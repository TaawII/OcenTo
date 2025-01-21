const axios = require('axios');
require('dotenv').config();

exports.registerUser = async (req, res) => {
  const { username, password } = req.body;
  const serverURL = process.env.serwerURL;

  try {
    const registerURL = `http://${serverURL}/register`;
    const response = await axios.post(registerURL, { username, password });

    if (response.status === 201) {
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

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  const serverURL = process.env.serwerURL;

  try {
    const loginURL = `http://${serverURL}/login`;
    const response = await axios.post(loginURL, { username, password });

    if (response.status === 200 && response.data.token) {
      res.cookie('auth_token', response.data.token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      res.redirect('/panel/events');
    } else {
      const errorMessage = response.data.error || 'Nieoczekiwana odpowiedź serwera.';
      res.render('auth/login', { 
        error: errorMessage, 
        success: null 
      });
    }
  } catch (error) {
    let errorMessage = 'Wystąpił błąd podczas logowania.';

    if (error.response && error.response.data && error.response.data.error) {
      errorMessage = error.response.data.error;
    } else if (error.response) {
      errorMessage = 'Błąd połączenia z serwerem. Spróbuj ponownie później.';
    }

    res.render('auth/login', { 
      error: errorMessage, 
      success: null 
    });
  }
};

exports.logout = (req, res) => {
  
  res.clearCookie('auth_token');
  res.render('auth/login', {
    success: 'Zostałeś wylogowany.',
    error: null
  });
};

