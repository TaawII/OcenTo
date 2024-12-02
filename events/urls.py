
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import RegisterView, LoginView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='events_register'),
    path('login/', LoginView.as_view(), name='events_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

]
