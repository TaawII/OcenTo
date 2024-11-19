from django.db import models

class User(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=255)

    def __str__(self):
        return self.username


class Event(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    item_properties = models.JSONField(help_text='Klucz wartości dla item na podstawie którego będą określane parametry podczas dodawania.')
    default_values = models.JSONField(help_text='Wartości domyślne')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_events')
    status = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_private = models.BooleanField(default=False)
    password = models.CharField(max_length=255, blank=True, null=True)
    categories = models.JSONField()

    def __str__(self):
        return self.title


class Item(models.Model):
    id = models.AutoField(primary_key=True)
    nazwa = models.CharField(max_length=255, unique=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='items')
    item_values = models.JSONField(help_text='Wartości odpowiadające kluczowi w event.')
    image = models.BinaryField(blank=True, null=True)

    def __str__(self):
        return self.nazwa


class EventMember(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_memberships')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='members')

    class Meta:
        unique_together = ('user', 'event')

    def __str__(self):
        return f"{self.user.username} - {self.event.title}"


class ItemRating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='item_ratings')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='ratings')
    rating_value = models.FloatField()
    comment = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('user', 'item')

    def __str__(self):
        return f"Rating by {self.user.username} for {self.item.nazwa}"
