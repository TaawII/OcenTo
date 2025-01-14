from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import RegisterView, LoginView, MobileEventsListView, OwnerEventsListView, CreateEventView, \
    MobileItemsListView, CheckEventMembershipView, JoinEventView, VerifyTokenView, MobileItemDetailsView, \
    ItemRatingAddOrModifyView

# Zapisujcie wszystkie url w całosci z małych liter: np. zamiast MobileEventsList używajcie mobileeventslist
urlpatterns = [
    path('register', RegisterView.as_view(), name='events_register'),
    path('login', LoginView.as_view(), name='events_login'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('mobileeventslist', MobileEventsListView.as_view(), name='mobile_events_list'),
    path('ownereventslist', OwnerEventsListView.as_view(), name='owner_events_list'),
    path('mobileitemslist/<event_id>', MobileItemsListView.as_view(), name='mobile_items_list'),
    path('mobileitemdetails/<item_id>', MobileItemDetailsView.as_view(), name='mobile_items_details'),
    path('checkeventmembership', CheckEventMembershipView.as_view(), name='check_event_membership'),
    path('addormodifyrating', ItemRatingAddOrModifyView.as_view(), name='check_event_membership'),
    path('joinevent', JoinEventView.as_view(), name='join_event'),
    path('create', CreateEventView.as_view(), name='create_event'),
    path('token/verify', VerifyTokenView.as_view(), name='token_verify'),
]
