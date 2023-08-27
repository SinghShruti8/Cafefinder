from django.shortcuts import render
from django.views.generic.base import TemplateView
from django.views import generic
from django.contrib.gis.geos import fromstr, Point
from django.contrib.gis.db.models.functions import Distance
from .models import Cafe


class CafeListView(generic.ListView):
    template_name = "cafe.html"

    def get_nearest_cafes(self, user_location):
        if user_location:
            user_lat, user_lng = map(float, user_location.split(","))
            user_point = Point(user_lng, user_lat)
            nearest_cafes = Cafe.objects.annotate(distance=Distance("location", user_point)).order_by("distance")[:10]
        else:
            nearest_cafes = []

        return nearest_cafes

    def get(self, request, *args, **kwargs):
        user_location = self.request.GET.get("user_location")
        nearest_cafes = self.get_nearest_cafes(user_location)

        context = {
            "user_location": user_location,
            "nearest_cafes": nearest_cafes,
        }
        return render(request, self.template_name, context)


class CafeMapView(TemplateView):
    template_name = "cafe.html"

