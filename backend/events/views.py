from django.contrib.auth.hashers import make_password, check_password
from rest_framework.generics import ListCreateAPIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status, permissions
from django.db.models import Count
from django.shortcuts import get_object_or_404
import logging, base64
from .models import User, Event, Item, ItemRating
from .serializers import MobileEventSerializer, OwnerEventSerializer, EventSerializer, ItemSerializer, EventMember, MobileEventItemSerializer, ItemRatingSerializer, ItemDetailSerializer, ItemRatingDetailSerializer, EventEditSerializer, AdminItemRatingSerializer, EventNoImageSerializer
from rest_framework.authentication import get_authorization_header
from io import BytesIO
from .encryption import decrypt_password, encrypt_password
from django.core.exceptions import ValidationError
logger = logging.getLogger(__name__)

#Lista kategorii
CATEGORIES = ["Piwo", "Impreza", "Motoryzacja", "Zwierzęta", "Inna", "Petardy", "Samochody"]

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if User.objects.filter(username=username).exists():
            return Response({"error": "Użytkownik o podanej nazwie już istnieje"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            username=username,
            password=make_password(password),
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
            owner = User.objects.get(id=id)
            image_binary = ''
            image_data = data.get('image', None)
            if image_data:
                try:
                    if image_data.startswith("data:image/jpeg;base64,"):
                        image_data = image_data.split(",")[1]

                    image_binary = base64.b64decode(image_data)
                except Exception as e:
                    return Response({'error': f'Błąd przy dekodowaniu obrazu: {str(e)}'}, status=400)
            passwordGet = data.get('password')
            if passwordGet:
                password = encrypt_password(passwordGet)
            else:
                password = ''
            categories = data.get('categories', [])
            if any(category not in CATEGORIES for category in categories):
                return Response({"error": "Nieprawidłowe kategorie."}, status=status.HTTP_400_BAD_REQUEST)

            event = Event.objects.create(
                title=data.get('title'),
                item_properties=data.get('item_properties'),
                default_values=data.get('default_values'),
                owner=owner,
                start_time=data.get('start_time'),
                end_time=data.get('end_time'),
                is_private=data.get('is_private', False),
                password=password,
                categories=categories,
                image=image_binary
            )

            return Response({'message': 'Event zapisany pomyślnie!', 'id': event.id})

        except Exception as e:
            return Response({'error': str(e)}, status=400)

    def get(self, request, *args, **kwargs):
        return Response({'categories': CATEGORIES})


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if event.owner != request.user and request.user.role != 'admin':
            return Response({"error": "You are not authorized to view this event."}, status=status.HTTP_403_FORBIDDEN)
        serializer = EventSerializer(event)
        return Response(serializer.data)

class EventEditView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        
        if event.owner != request.user and request.user.role != 'admin':
            return Response({"error": "You are not authorized to view this event."}, status=status.HTTP_403_FORBIDDEN)

        event.has_items = event.items.exists()

        serializer = EventSerializer(event)
        data = serializer.data

        data['has_items'] = event.has_items

        if event.is_private and event.password:
            data['password'] = decrypt_password(event.password)
        else:
            data['password'] = ''

        data['available_categories'] = CATEGORIES

        return Response(data)

    def put(self, request, pk):
        event = get_object_or_404(Event, pk=pk)

        if event.owner != request.user:
            return Response({"error": "You are not authorized to edit this event."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data

        categories = data.get('categories', [])
        if any(category not in CATEGORIES for category in categories):
            return Response({"error": "Nieprawidłowe kategorie."}, status=status.HTTP_400_BAD_REQUEST)

        image_data = data.get('image', None)
        if image_data:
            if image_data.startswith("data:image/jpeg;base64,"):
                image_data = image_data.split(",")[1]
            try:
                image_binary = base64.b64decode(image_data)
                event.image = image_binary
            except Exception as e:
                return Response({"error": "Invalid image data."}, status=status.HTTP_400_BAD_REQUEST)

        password = data.get('password')
        if password:
            data['password'] = encrypt_password(password)
        else:
            data['password'] = None

        serializer = EventEditSerializer(event, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

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
            if not password == decrypt_password(event.password):
                return Response({'success': False, 'message': 'Błędne hasło.'}, status=status.HTTP_200_OK)

        is_member = EventMember.objects.filter(user_id=user_id, event_id=event_id).exists()
        if is_member:
            return Response({'success': False, 'message': 'Użytkownik nalezy już do tego eventu.'}, status=status.HTTP_200_OK)
        
        EventMember.objects.create(user_id=user_id, event_id=event_id)
        return Response({'success': True}, status=status.HTTP_200_OK)

class JoinEventQRView(APIView):
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

        event = item.event
        item_properties = event.item_properties if hasattr(event, 'item_properties') else None
        default_values = event.default_values if hasattr(event, 'default_values') else None
        event_status = event.status if hasattr(event, 'status') else None

        rating = [item_data, ratings_data, item_properties, default_values, user_rating_data, event_status]
        
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
        user = request.user
        events = Event.objects.filter(owner=user).defer('image')
        serializer = EventNoImageSerializer(events, many=True)
        return Response(serializer.data)


class MobileDeleteRatingView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        user = request.user
        item = Item.objects.filter(id = item_id).first()
        rating = ItemRating.objects.filter(user=user, item=item).first()
        rating.delete()
        return Response({'success': 'Ocena została usunięta.'}, status=status.HTTP_200_OK)

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class AdminEventsListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        if not request.user.is_authenticated or request.user.role != 'admin':
            raise PermissionDenied("Brak dostępu. Tylko administratorzy mogą wyświetlać tę listę.")
        events = Event.objects.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

class EventItemsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        event = get_object_or_404(Event, id=pk)
        if event.owner != request.user and request.user.role != 'admin':
            return Response(
                {"error": "You are not authorized to view the items of this event."},
                status=status.HTTP_403_FORBIDDEN
            )
        items = Item.objects.filter(event=event)
        serialized_items = ItemSerializer(items, many=True).data
        response_data = {
            "items": serialized_items,
            "default_values": event.default_values,
            "item_properties": event.item_properties
        }
        return Response(response_data)

class AdminItemRatingsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk, item_id):
        ratings = ItemRating.objects.filter(item__id=item_id, item__event__id=pk)
        serializer = AdminItemRatingSerializer(ratings, many=True)
        return Response(serializer.data)

class EventDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response(
                {'error': 'You do not have permission to delete events.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            event = Event.objects.get(id=pk)
            event.delete()
            return Response(
                {'message': 'Event deleted successfully.'},
                status=status.HTTP_200_OK
            )
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ItemDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, item_id, *args, **kwargs):
        if not request.user.role == 'admin':
            return Response({'error': 'Only admins can delete items.'}, status=403)

        try:
            item = get_object_or_404(Item, event_id=pk, id=item_id)
            item.delete()
            return Response({'message': 'Item deleted successfully.'}, status=200)

        except Exception as e:
            return Response({'error': 'Failed to delete item.'}, status=500)

class AdminDeleteRatingAndCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, item_id, rating_id, *args, **kwargs):
        if not request.user.role == 'admin':
            return Response({'error': 'Only admins can delete ratings and comments.'}, status=403)
        item = get_object_or_404(Item, id=item_id, event_id=pk)
        rating = get_object_or_404(ItemRating, id=rating_id, item=item)
        rating.delete()
        return Response({'message': 'Rating and comment deleted successfully.'}, status=200)


class AdminDeleteCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, item_id, rating_id, *args, **kwargs):
        if not request.user.role == 'admin':
            return Response({'error': 'Only admins can delete comments.'}, status=403)
        item = get_object_or_404(Item, id=item_id, event_id=pk)
        rating = get_object_or_404(ItemRating, id=rating_id, item=item)

        rating.comment = None
        rating.save()

        return Response({'message': 'Comment deleted successfully.'}, status=200)

class AddItemToEventView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)

        if event.owner != request.user:
            return Response({"error": "Nie masz uprawnień do dodania itemu do tego wydarzenia."}, status=status.HTTP_403_FORBIDDEN)

        serializer = EventSerializer(event)
        return Response(serializer.data)

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)

        if event.owner != request.user:
            return Response({"error": "Nie masz uprawnień do dodania itemu do tego wydarzenia."}, status=status.HTTP_403_FORBIDDEN)

        item_data = request.data
        
        if Item.objects.filter(name=item_data.get('name'), event=event).exists():
            return Response({"error": f"Item o nazwie '{item_data.get('name')}' już istnieje w tym wydarzeniu."}, status=status.HTTP_400_BAD_REQUEST)
        
        image_data = item_data.get('image', None)

        if image_data:

            try:
                if image_data.startswith("data:image/jpeg;base64,"):
                    image_data = image_data.split(",")[1]

                image_binary = base64.b64decode(image_data)
                item_data['image'] = image_binary
            except Exception as e:
                return Response({"error": "Invalid image data"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            item_data['image'] = None

        item_values = []
        if isinstance(item_data.get('item_values', None), list):
            item_values = item_data['item_values']
        else:
            for prop, default in zip(event.item_properties, event.default_values):
                value = item_data.get('item_values', {}).get(prop, "")
                item_values.append(value if value else default)

        item_data['item_values'] = item_values
        item_data['event'] = event.id

        serializer = ItemSerializer(data=item_data)
        if serializer.is_valid():
            item = serializer.save()

            if item_data['image'] is not None:
                item.image = item_data['image']
                item.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OwnerEventItemsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        user_id = request.user.id

        event = get_object_or_404(Event, id=event_id)
        
        if event.owner.id != user_id:
            return Response({"error": "Nie masz uprawnień do wyświetlenia itemów tego wydarzenia."}, status=status.HTTP_403_FORBIDDEN)

        items = Item.objects.filter(event=event)

        items_data = []
        for item in items:
            ratings = ItemRating.objects.filter(item=item)

            total_rating = sum(rating.rating_value for rating in ratings)
            count = ratings.count()
            comments_count = ratings.exclude(comment=None).count()

            average_rating = round(total_rating / count, 1) if count > 0 else 0.0

            item_data = ItemSerializer(item).data
            item_data['average_rating'] = average_rating
            item_data['rating_count'] = count
            item_data['comments_count'] = comments_count
            items_data.append(item_data)

        items_data = sorted(items_data, key=lambda x: x['average_rating'], reverse=True)

        event_data = {
            'title': event.title,
            'item_properties': event.item_properties,
            'default_values': event.default_values
        }

        return Response({
            'success': True, 
            'data': {
                'event': event_data,
                'items': items_data
            }
        }, status=status.HTTP_200_OK)


class OwnerDeleteItemView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, event_id, item_id):
        item = get_object_or_404(Item, id=item_id)

        if item.event.id != event_id:
            return Response({"error": "Przedmiot nie należy do tego wydarzenia."}, status=status.HTTP_400_BAD_REQUEST)

        if item.event.owner != request.user:
            return Response({"error": "Nie masz uprawnień do usunięcia tego przedmiotu."}, status=status.HTTP_403_FORBIDDEN)

        item.delete()
        return Response({"message": "Przedmiot został usunięty pomyślnie."}, status=status.HTTP_200_OK)

class ItemEditView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id, item_id):
        event = get_object_or_404(Event, id=event_id, owner=request.user)

        item = get_object_or_404(Item, id=item_id, event=event)

        serializer = ItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def put(self, request, event_id, item_id):
        event = get_object_or_404(Event, id=event_id, owner=request.user)
        item = get_object_or_404(Item, id=item_id, event=event)

        data = request.data
        image_data = data.get('image', None)

        if image_data:
            try:
                if image_data.startswith("data:image/"):
                    image_data = image_data.split(",")[1]
                    
                image_binary = base64.b64decode(image_data)

                item.image = image_binary
            except (ValueError, ValidationError) as e:
                return Response({"error": "Invalid image data"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ItemSerializer(item, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class OwnerItemReviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id, item_id):
        item = get_object_or_404(Item, id=item_id, event_id=event_id)

        ratings = ItemRating.objects.filter(item=item).select_related('user')

        serialized_ratings = [
            {
                'id': rating.id,
                'username': rating.user.username,
                'rating_value': rating.rating_value,
                'comment': rating.comment,
            }
            for rating in ratings
        ]

        return Response({'item_name': item.name, 'ratings': serialized_ratings}, status=status.HTTP_200_OK)


class OwnerDeleteCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, event_id, item_id, rating_id):
        rating = get_object_or_404(ItemRating, id=rating_id, item_id=item_id, item__event_id=event_id)

        if rating.item.event.owner != request.user:
            return Response({'error': 'Nie masz uprawnień do usunięcia tego komentarza.'}, status=status.HTTP_403_FORBIDDEN)

        rating.comment = None
        rating.save()
        return Response({'success': 'Komentarz został usunięty.'}, status=status.HTTP_200_OK)

class OwnerDeleteRatingView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, event_id, item_id, rating_id):
        rating = get_object_or_404(ItemRating, id=rating_id, item_id=item_id, item__event_id=event_id)

        if rating.item.event.owner != request.user:
            return Response({'error': 'Nie masz uprawnień do usunięcia tej oceny.'}, status=status.HTTP_403_FORBIDDEN)

        rating.delete()
        return Response({'success': 'Ocena została usunięta.'}, status=status.HTTP_200_OK)

class OwnerDeleteEventView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)

        if event.owner != request.user:
            return Response({"error": "Nie masz uprawnień do usunięcia tego wydarzenia."}, status=status.HTTP_403_FORBIDDEN)

        event.delete()
        return Response({"message": "Wydarzenie zostało pomyślnie usunięte."}, status=status.HTTP_200_OK)
    
class OwnerChangeEventStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)

        if event.owner != request.user:
            return Response({"error": "Nie masz uprawnień do zmiany statusu tego wydarzenia."}, status=403)

        new_status = request.data.get('status')
        if new_status not in ['Active', 'End']:
            return Response({"error": "Nieprawidłowy status."}, status=400)

        event.status = new_status
        event.save()

        return Response({"message": "Status wydarzenia został zaktualizowany pomyślnie.", "new_status": event.status}, status=200)