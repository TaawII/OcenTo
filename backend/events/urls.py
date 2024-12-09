from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import RegisterView, LoginView, MobileEventListView, OwnerEventsListView

# Zapisujcie wszystkie url w całosci z małych liter: np. zamiast MobileEventsList używajcie mobileeventslist
urlpatterns = [
    path('register', RegisterView.as_view(), name='events_register'),
    path('login', LoginView.as_view(), name='events_login'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('mobileeventslist', MobileEventListView.as_view(), name='mobile-events-list'),
    path('ownereventslist', OwnerEventsListView.as_view(), name='owner-events-list'),
]
