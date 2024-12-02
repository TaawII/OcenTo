from django.contrib.auth.hashers import make_password, check_password
from rest_framework import serializers
from .models import User, Event, Item, EventMember, ItemRating
import logging
logger = logging.getLogger(__name__)

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'role']

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        try:
            user = User.objects.get(username=username)
            logger.info(f"Użytkownik znaleziony: {user.username}")
        except User.DoesNotExist:
            logger.error("Nieprawidłowa nazwa użytkownika.")
            raise serializers.ValidationError("Nieprawidłowa nazwa użytkownika lub hasło.")

        if not check_password(password, user.password):
            logger.error("Nieprawidłowe hasło.")
            raise serializers.ValidationError("Nieprawidłowa nazwa użytkownika lub hasło.")

        logger.info("Logowanie udane.")
        return user
    
class EventSerializerForMobile(serializers.ModelSerializer):
    owner = serializers.StringRelatedField()  # Nazwa wlasciciela zamiast ID
    member_count = serializers.IntegerField(read_only=True)  # Liczba członków
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'owner', 'status', 'start_time', 'end_time', 'is_private', 'categories', 'member_count'
        ]

class EventSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'item_properties', 'default_values', 'owner',
            'status', 'start_time', 'end_time', 'is_private', 'password', 'categories'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }




class ItemSerializer(serializers.ModelSerializer):
    event = serializers.StringRelatedField()

    class Meta:
        model = Item
        fields = ['id', 'nazwa', 'event', 'item_values', 'image']


class EventMemberSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    event = serializers.StringRelatedField()

    class Meta:
        model = EventMember
        fields = ['user', 'event']


class ItemRatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    item = serializers.StringRelatedField()

    class Meta:
        model = ItemRating
        fields = ['user', 'item', 'rating_value', 'comment']
