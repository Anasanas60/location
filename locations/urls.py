from django.urls import path
from .views import LocationListView, LocationUpdateView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),  # Registration endpoint
    path('', LocationListView.as_view(), name='location-list'),
    path('update/', LocationUpdateView.as_view(), name='location-update'),
]