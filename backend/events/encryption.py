from cryptography.fernet import Fernet
from django.conf import settings

# Pobierz klucz szyfrowania z settings.py
ENCRYPTION_KEY = settings.FERNET_ENCRYPTION_KEY

def encrypt_password(password):
    f = Fernet(ENCRYPTION_KEY.encode())  # Upewnij się, że klucz jest zakodowany jako bajty
    return f.encrypt(password.encode()).decode()  # Szyfruj i zwróć jako string

def decrypt_password(encrypted_password):
    f = Fernet(ENCRYPTION_KEY.encode())  # Upewnij się, że klucz jest zakodowany jako bajty
    return f.decrypt(encrypted_password.encode()).decode()  # Odszyfruj i zwróć jako string
