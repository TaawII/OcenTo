from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from .models import User, Event
from .serializers import MobileEventSerializer, OwnerEventSerializer, EventSerializer, EventEditSerializer
from django.shortcuts import get_object_or_404
import logging, base64

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

class MobileEventListView(APIView):
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
