from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from .models import User, Event, Item, ItemRating
from .serializers import MobileEventSerializer, OwnerEventSerializer, EventSerializer, ItemSerializer, EventMember, MobileEventItemSerializer, ItemRatingSerializer, ItemDetailSerializer, ItemRatingDetailSerializer
from rest_framework.authentication import get_authorization_header
import logging

logger = logging.getLogger(__name__)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if User.objects.filter(username=username).exists():
            return Response({"error": "Użytkownik o podanej nazwie już istnieje"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            username=username,
            password=make_password(password),  # Hashowanie hasła
        )

        return Response({"message": "Użytkownik został zarejestrowany pomyślnie"}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        logger.debug(f"Logowanie użytkownika: {username}")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            logger.warning("Nie znaleziono użytkownika w bazie danych.")
            return Response({"error": "Nieprawidłowa nazwa użytkownika lub hasło"}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(password, user.password):
            logger.warning("Nieprawidłowe hasło.")
            return Response({"error": "Nieprawidłowa nazwa użytkownika lub hasło"}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        logger.info(f"Użytkownik zalogowany pomyślnie: {username}")
        return Response({
            'refresh': refresh_token,
            'token': access_token,
        }, status=status.HTTP_200_OK)

class MobileEventsListView(APIView):
    def get(self, request):
        events = Event.objects.annotate(
            member_count=Count('members')
        )
        serializer = MobileEventSerializer(events, many=True)
        return Response(serializer.data)

class OwnerEventsListView(APIView):
    def get(self, request):
        events = Event.objects.annotate(
            member_count=Count('members')
        )
        serializer = OwnerEventSerializer(events, many=True)
        return Response(serializer.data)

class CreateEventView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        data['owner'] = request.user.id
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MobileItemsListView(APIView):
    def get(self, request, event_id):
        user_id = request.user.id
        is_member = EventMember.objects.filter(user_id=user_id, event_id=event_id).exists()
        if is_member:
            event = Event.objects.prefetch_related('items').get(id=event_id)
            serializer = MobileEventItemSerializer(event)
            return Response({'success': True, 'data':serializer.data}, status=status.HTTP_200_OK)
        return Response({'success': False}, status=status.HTTP_200_OK)
    
class CheckEventMembershipView(APIView):
    def get(self, request):
        user_id = request.user.id
        event_id = request.query_params.get('eventId')

        if not user_id or not event_id:
            logger.warning("user_id i event_id są wymagane.")
            return Response({'error': 'user_id i event_id są wymagane'}, status=status.HTTP_400_BAD_REQUEST)

        is_member = EventMember.objects.filter(user_id=user_id, event_id=event_id).exists()

        if is_member:
            return Response({'success': True}, status=status.HTTP_200_OK)
        return Response({'success': False}, status=status.HTTP_200_OK)
    
class JoinEventView(APIView):
    def post(self, request):
        user_id = request.user.id
        event_id = request.data.get('eventId')
        password = request.data.get('password','')

        event = Event.objects.get(id = event_id)

        if event.is_private:
            if not password == event.password:
                return Response({'success': False, 'message': 'Błędne hasło.'}, status=status.HTTP_200_OK)

        is_member = EventMember.objects.filter(user_id=user_id, event_id=event_id).exists()
        if is_member:
            return Response({'success': False, 'message': 'Użytkownik nalezy już do tego eventu.'}, status=status.HTTP_200_OK)
        
        EventMember.objects.create(user_id=user_id, event_id=event_id)
        return Response({'success': True}, status=status.HTTP_200_OK)
    
class VerifyTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        auth_header = get_authorization_header(request).decode('utf-8')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'success': False, 'message': 'Brak tokenu lub niepoprawny format'}, status=status.HTTP_401_UNAUTHORIZED)

        token = auth_header.split(' ')[1]
        try:
            AccessToken(token)
            return Response({'success': True, 'message': 'Token jest prawidłowy'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        
class MobileItemDetailsView(APIView):
    def get(self, request, item_id):
        user_id = request.user.id
        user_username = request.user.username
        item = Item.objects.get(id=item_id)
        item_data = ItemDetailSerializer(item).data
        
        item_ratings = ItemRating.objects.filter(item_id=item_id)
        ratings_data = ItemRatingDetailSerializer(item_ratings, many=True).data
        ratings_data = [
            rating for rating in ratings_data
            if (rating.get('comment') is not None or rating.get('rating_value') is not None) and rating.get('user') != user_username
        ]

        user_rating = ItemRating.objects.filter(item_id=item_id, user_id=user_id).first()
        user_rating_data = ItemRatingSerializer(user_rating).data if user_rating else None

        rating = [item_data, ratings_data, user_rating_data]
        
        return Response({'success': True, 'data': rating}, status=status.HTTP_200_OK)

class ItemRatingAddOrModifyView(APIView):
    def post(self, request):
        rating_value = request.data.get('rating_value')
        comment = request.data.get('comment')
        item_id = request.data.get('item_id')
        user_id = request.user.id

        created = ItemRating.objects.update_or_create(
            item_id=item_id, user_id=user_id,
            defaults={'rating_value': rating_value, 'comment': comment}
        )

        if created:
            message = "Komentarz został dodany pomyślnie"
        else:
            message = "Komentarz został zaktualizowany pomyślnie"

        return Response({"message": message}, status=status.HTTP_200_OK)