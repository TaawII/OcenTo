from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from .models import User, Event
from .serializers import EventSerializerForMobile
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
            return Response({"error": "Nieprawidłowa nazwa użytkownika lub hasło"}, status=status.HTTP_401_UNAUTHORIZED)

        if not check_password(password, user.password):
            logger.warning("Nieprawidłowe hasło.")
            return Response({"error": "Nieprawidłowa nazwa użytkownika lub hasło"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        logger.info(f"Użytkownik zalogowany pomyślnie: {username}")
        return Response({
            'refresh': refresh_token,
            'token': access_token,
        }, status=status.HTTP_200_OK)

class EventListMobileView(APIView):
    def get(self, request):
        events = Event.objects.annotate(
            member_count=Count('members')  # Liczba członków powiązanych z wydarzeniem
        )
        serializer = EventSerializerForMobile(events, many=True)
        return Response(serializer.data)