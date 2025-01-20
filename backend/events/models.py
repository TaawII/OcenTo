from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from rest_framework.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from .encryption import encrypt_password, decrypt_password


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, role='user'):
        if not username:
            raise ValueError('Nazwa użytkownika musi być ustawiona')
        user = self.model(username=username, role='user')
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password):
        user = self.create_user(username=username, password=password, role='admin')
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class User(AbstractBaseUser):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]

    username = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=255, choices=ROLE_CHOICES, default='user')

    # Wymagane pola, aby Django działało poprawnie z niestandardowym modelem użytkownika
    is_active = models.BooleanField(default=True)  # Wymagane przez AbstractBaseUser
    is_staff = models.BooleanField(default=False)  # Wymagane przez AbstractBaseUser
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def save(self, *args, **kwargs):
        if not self.password.startswith('pbkdf2_sha256$'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

    # def has_perm(self, perm, obj=None):
    #     # Prosta implementacja: wszyscy użytkownicy mają wszystkie uprawnienia
    #     return True

    # def has_module_perms(self, app_label):
    #     # Prosta implementacja: wszyscy użytkownicy mają dostęp do każdego modułu
    #     return True


ALLOWED_CATEGORIES = {"inna", "impreza", "piwo"}


def validate_categories(value):
    if not isinstance(value, list):
        raise ValidationError("Categories must be a list.")
    for item in value:
        if item not in ALLOWED_CATEGORIES:
            raise ValidationError(f"Invalid category: {item}. Allowed categories are: {', '.join(ALLOWED_CATEGORIES)}")

class Event(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    item_properties = models.JSONField(
        help_text='Klucz wartości dla item na podstawie którego będą określane parametry podczas dodawania.')
    default_values = models.JSONField(help_text='Wartości domyślne')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_events')
    status = models.CharField(max_length=20, default='Waiting')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_private = models.BooleanField(default=False)
    password = models.CharField(max_length=255, blank=True, null=True)
    categories = models.JSONField(validators=[validate_categories])
    image = models.BinaryField(blank=True, null=True)

    # def get_password_decrypted(self):
    #     # Odszyfruj hasło przy odczycie
    #     if self.password:
    #         return decrypt_password(self.password)
    #     return None
    # def __str__(self):
    #     return self.title

class Item(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='items')
    item_values = models.JSONField(help_text='Wartości odpowiadające kluczowi w event.')
    image = models.BinaryField(blank=True, null=True)

    def __str__(self):
        return self.name


class EventMember(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_memberships')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='members')

    class Meta:
        unique_together = ('user', 'event')

    def __str__(self):
        return f"{self.user.username} - {self.event.title}"


class ItemRating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='item_ratings')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='ratings')
    rating_value = models.FloatField()
    comment = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('user', 'item')

    def __str__(self):
        return f"Rating by {self.user.username} for {self.item.nazwa}"
