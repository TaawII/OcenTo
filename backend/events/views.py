from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.db.models import Count
from django.shortcuts import get_object_or_404
import logging, base64
from .models import User, Event, Item, ItemRating
from .serializers import MobileEventSerializer, OwnerEventSerializer, EventSerializer, ItemSerializer, EventMember, MobileEventItemSerializer, ItemRatingSerializer, ItemDetailSerializer, ItemRatingDetailSerializer, EventEditSerializer
from rest_framework.authentication import get_authorization_header
from io import BytesIO

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

    def post(self, request, *args, **kwargs):
        data = request.data
        id = request.user.id
        try:
            # Pobieranie użytkownika na podstawie przekazanego ID
            owner = User.objects.get(id=id)
            image_binary = ''
            # Sprawdzanie, czy obraz jest przesyłany w formacie Base64
            image_data = data.get('image', None)
            if image_data:
                try:
                    if image_data.startswith("data:image/jpeg;base64,"):
                        # Usunięcie prefiksu
                        image_data = image_data.split(",")[1]

                        # Przekształcanie danych base64 na binarny format
                    image_binary = base64.b64decode(image_data)  # Dekodowanie
                except Exception as e:
                    return Response({'error': f'Błąd przy dekodowaniu obrazu: {str(e)}'}, status=400)
            # Tworzenie nowego wydarzenia
            event = Event.objects.create(
                title=data.get('title'),
                item_properties=data.get('item_properties'),
                default_values=data.get('default_values'),
                owner=owner,
                status=data.get('status'),
                start_time=data.get('start_time'),
                end_time=data.get('end_time'),
                is_private=data.get('is_private', False),
                password=data.get('password'),
                categories=data.get('categories'),
                image=image_binary
            )

            return Response({'message': 'Event zapisany pomyślnie!', 'id': event.id})

        except Exception as e:
            return Response({'error': str(e)}, status=400)


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if event.owner != request.user:
            return Response({"error": "You are not authorized to view this event."}, status=status.HTTP_403_FORBIDDEN)
        serializer = EventSerializer(event)
        return Response(serializer.data)

class EventEditView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if event.owner != request.user:
            return Response({"error": "You are not authorized to edit this event."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        image_data = data.get('image', None)

        if image_data:
            print("Received image (base64):", image_data[:100])  # Wypisujemy początek obrazu, by nie zaśmiecać konsoli

            try:
                # Sprawdź, czy dane zawierają prefiks "data:image/jpeg;base64,"
                if image_data.startswith("data:image/jpeg;base64,"):
                    # Usunięcie prefiksu
                    image_data = image_data.split(",")[1]
                    
                # Przekształcanie danych base64 na binarny format
                image_binary = base64.b64decode(image_data)  # Dekodowanie

                event.image = image_binary  # Zapisz obraz jako BLOB w bazie danych
            except Exception as e:
                print(f"Error decoding image: {e}")
                return Response({"error": "Invalid image data"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = EventEditSerializer(event, data=data, partial=True)
        
        if serializer.is_valid():
            # Sprawdzamy, czy item_properties i default_values zostały poprawnie przekazane
            #print("Validated item_properties:", serializer.validated_data.get('item_properties'))
            #print("Validated default_values:", serializer.validated_data.get('default_values'))
            
            # Zapisz zmodyfikowany event
            serializer.save()
            return Response(serializer.data)
        print("Validation errors:", serializer.errors)
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


class Decrypt(APIView):
    def get(self, request, event_id):
        event = Event.objects.get(id=event_id)
        password = event.get_password_decrypted()
        return Response({"message": password}, status=status.HTTP_200_OK)

class UserEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user  # Pobierz zalogowanego użytkownika
        events = Event.objects.filter(owner=user)  # Wyszukaj wszystkie wydarzenia użytkownika
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

