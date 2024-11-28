from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User
import logging

logger = logging.getLogger(__name__)

class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if User.objects.filter(username=username).exists():
            return Response({"error": "Użytkownik o podanej nazwie już istnieje"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            username=username,
            password=password,
        )

        return Response({"message": "Użytkownik został zarejestrowany pomyślnie"}, status=status.HTTP_201_CREATED)
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        logger.debug(f"Logowanie użytkownika: {username}")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            logger.debug("Nie znaleziono użytkownika w bazie danych.")
            return Response({"error": "Nieprawidłowa nazwa użytkownika lub hasło"}, status=status.HTTP_401_UNAUTHORIZED)

        if not check_password(password, user.password):
            logger.debug("Hasło nie pasuje do tego w bazie danych.")
            return Response({"error": "Nieprawidłowa nazwa użytkownika lub hasło"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        logger.debug(f"Użytkownik zalogowany pomyślnie: {username}")
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)