from rest_framework import serializers
from .models import User, Event, Item, EventMember, ItemRating


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'role']
        extra_kwargs = {
            'password': {'write_only': True},  # Ukrywanie hasła w odpowiedziach
        }


class EventSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField()  # Wyświetli `username` właściciela

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'item_properties', 'default_values', 'owner',
            'status', 'start_time', 'end_time', 'is_private', 'password', 'categories'
        ]
        extra_kwargs = {
            'password': {'write_only': True},  # Ukrywanie hasła w odpowiedziach
        }


class ItemSerializer(serializers.ModelSerializer):
    event = serializers.StringRelatedField()  # Wyświetli tytuł eventu

    class Meta:
        model = Item
        fields = ['id', 'nazwa', 'event', 'item_values', 'image']


class EventMemberSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # Wyświetli `username` użytkownika
    event = serializers.StringRelatedField()  # Wyświetli tytuł eventu

    class Meta:
        model = EventMember
        fields = ['user', 'event']


class ItemRatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # Wyświetli `username` użytkownika
    item = serializers.StringRelatedField()  # Wyświetli nazwę itemu

    class Meta:
        model = ItemRating
        fields = ['user', 'item', 'rating_value', 'comment']
