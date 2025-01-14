import base64

from django.contrib.auth.hashers import make_password, check_password
from rest_framework import serializers
from django.db.models import Avg
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
    
class MobileEventSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField()
    member_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'owner', 'status', 'start_time', 'end_time', 'is_private', 'categories', 'member_count'
        ]

class OwnerEventSerializer(serializers.ModelSerializer):
    owner_id = serializers.PrimaryKeyRelatedField(source='owner', read_only=True)
    owner_name = serializers.StringRelatedField(source='owner')
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'item_properties', 'default_values', 'owner_id', 'owner_name',
            'status', 'start_time', 'end_time', 'is_private', 'password', 'categories', 'member_count'
        ]

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

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'title', 'item_properties', 'default_values', 'owner', 'status',
            'start_time', 'end_time', 'password', 'categories', 'image'
        ]

class MobileItemEventSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = ['id', 'nazwa', 'item_values', 'image', 'average_rating']

    def get_average_rating(self, obj):
        event = obj.event
        if event.status == "END":
            average_rating = ItemRating.objects.filter(item=obj).aggregate(Avg('rating_value'))['rating_value__avg']
            logger.debug(f"Średnia ocena dla obiektu {obj.id}: {average_rating}")
            return average_rating if average_rating is not None else 0.0
        return None

class MobileEventItemSerializer(serializers.ModelSerializer):
    items = MobileItemEventSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'item_properties', 'default_values', 'items', 'status']


class ItemDetailSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    vote_count = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = ['id', 'nazwa', 'item_values', 'image', 'average_rating', 'vote_count']

    def get_average_rating(self, obj):
        event = obj.event
        if event.status in ["End", "ActiveWithRanking"]:
            average_rating = ItemRating.objects.filter(item=obj).aggregate(Avg('rating_value'))['rating_value__avg']
            return average_rating if average_rating is not None else 0.0
        return None
    
    def get_vote_count(self, obj):
        event = obj.event
        if event.status in ["End", "ActiveWithRanking"]:
            ratings = ItemRating.objects.filter(item=obj)
            vote_count = ratings.count()
            return vote_count
        return None

class ItemRatingDetailSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    item = serializers.StringRelatedField()
    rating_value = serializers.SerializerMethodField()

    class Meta:
        model = ItemRating
        fields = ['user', 'item', 'rating_value', 'comment']

    def get_rating_value(self, obj):
        event = obj.item.event
        if event.status in ["End", "ActiveWithRanking"]:
            return obj.rating_value
        return None