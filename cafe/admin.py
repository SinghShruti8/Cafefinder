from django.contrib.gis import admin
from django.contrib.gis.admin import OSMGeoAdmin

from cafe.models import Cafe


# Register your models here.
class CafeAdmin(OSMGeoAdmin):
    list_display = ("name", "location")


admin.site.register(Cafe, CafeAdmin)
