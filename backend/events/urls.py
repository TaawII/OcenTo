from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, MobileEventsListView, OwnerEventsListView, CreateEventView, \
    MobileItemsListView, CheckEventMembershipView, JoinEventView, VerifyTokenView, MobileItemDetailsView, \
    ItemRatingAddOrModifyView, Decrypt, EventDetailView, EventEditView, UserEventsView, AdminEventsListView, \
    EventItemsView, AdminItemRatingsView, EventDeleteView, ItemDeleteView, AdminDeleteRatingAndCommentView, \
    AdminDeleteCommentView, AddItemToEventView, OwnerEventItemsView, OwnerDeleteItemView, ItemEditView, \
    OwnerItemReviewsView, OwnerDeleteCommentView, OwnerDeleteRatingView, MobileDeleteRatingView, OwnerDeleteEventView

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
    path('events/<int:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('events/<int:pk>/edit/', EventEditView.as_view(), name='event-edit'),
    path('events/', UserEventsView.as_view(), name='user-events'),
    path('token/verify', VerifyTokenView.as_view(), name='token_verify'),
    path('password/<event_id>',Decrypt.as_view(), name='token_decrypt'),
    path('mobileratingdelete/<item_id>',MobileDeleteRatingView.as_view(), name='mobile_rating_delete'),
    path('admin/allevents', AdminEventsListView.as_view(), name='admin_all_events'),
    path('admin/allevents/<int:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('admin/allevents/<int:pk>/items/', EventItemsView.as_view(), name='event-items'),
    path('admin/allevents/<int:pk>/items/<int:item_id>/ratings/', AdminItemRatingsView.as_view(), name='item-ratings'),
    path('admin/allevents/<int:pk>/delete/', EventDeleteView.as_view(), name='event-delete'),
    path('admin/allevents/<int:pk>/items/<int:item_id>/delete/', ItemDeleteView.as_view(), name='delete-item'),
    path('admin/allevents/<int:pk>/items/<int:item_id>/ratings/<int:rating_id>/delete/',AdminDeleteRatingAndCommentView.as_view(),name='delete-rating-comment',),
    path('admin/allevents/<int:pk>/items/<int:item_id>/ratings/<int:rating_id>/delete-comment/',AdminDeleteCommentView.as_view(),name='delete-comment',),
    path('<int:event_id>/add-item/', AddItemToEventView.as_view(), name='add-item-to-event'),
    path('<int:event_id>/items/', OwnerEventItemsView.as_view(), name='owner_event_items'),
    path('<int:event_id>/items/<int:item_id>/delete', OwnerDeleteItemView.as_view(), name='delete_item'),
    path('<int:event_id>/items/<int:item_id>/edit', ItemEditView.as_view(), name='item_edit'),
    path('<int:event_id>/items/<int:item_id>/reviews', OwnerItemReviewsView.as_view(), name='item_reviews'),
    path('<int:event_id>/items/<int:item_id>/reviews/<int:rating_id>/delete-comment', OwnerDeleteCommentView.as_view(), name='delete_comment'),
    path('<int:event_id>/items/<int:item_id>/reviews/<int:rating_id>/delete', OwnerDeleteRatingView.as_view(), name='delete_rating'),
    path('<int:event_id>/delete', OwnerDeleteEventView.as_view(), name='delete_event'),

]
