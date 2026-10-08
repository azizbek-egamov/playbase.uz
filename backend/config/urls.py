from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API v1
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.sessions_app.urls')),
    path('api/v1/', include('apps.clubs.urls')),
    path('api/v1/products/', include('apps.products.urls')),
    path('api/v1/billing/', include('apps.billing.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/printers/', include('apps.printers.urls')),
    path('api/v1/superadmin/', include('apps.superadmin.urls')),
]
