from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import RegisterView, LoginView, MobileEventsListView, OwnerEventsListView, CreateEventView, MobileItemsListView, CheckEventMembership, JoinEvent

# Zapisujcie wszystkie url w całosci z małych liter: np. zamiast MobileEventsList używajcie mobileeventslist
urlpatterns = [
    path('register', RegisterView.as_view(), name='events_register'),
    path('login', LoginView.as_view(), name='events_login'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('mobileeventslist', MobileEventsListView.as_view(), name='mobile-events-list'),
    path('ownereventslist', OwnerEventsListView.as_view(), name='owner-events-list'),
    path('mobileitemslist', MobileItemsListView.as_view(), name='mobile-items-list'),
    path('checkeventmembership', CheckEventMembership.as_view(), name='check-event-membership'),
    path('joinevent', JoinEvent.as_view(), name='join-event'),
    path('create', CreateEventView.as_view(), name='create_event'),
]
