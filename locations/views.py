from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions
from .models import Location
from .serializers import LocationSerializer
from rest_framework import generics
from django.contrib.auth.models import User
from .serializers import RegisterSerializer
from rest_framework.permissions import AllowAny


class LocationListView(generics.ListAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]

class LocationUpdateView(generics.UpdateAPIView):
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        # Each user can only update their own location
        return Location.objects.get(user=self.request.user)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]