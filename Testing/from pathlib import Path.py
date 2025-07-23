from pathlib import Path

# Re-define the content after reset
step_by_step_plan = """
📘 IMPLEMENTING LOGIN + USER-TIED WATCHLISTS (Django + React)

---
🎯 GOAL:
Allow users to log in and have their saved watchlist groups/contracts tied to their account.

---
✅ STEP 1: ENABLE USER AUTHENTICATION IN DJANGO
Why? We need to identify which user is making a request and restrict access to their own data only.

1.1 Add `rest_framework` and `rest_framework.authtoken` to `INSTALLED_APPS` in settings.py:
    INSTALLED_APPS = [
        ...
        'rest_framework',
        'rest_framework.authtoken',
    ]

1.2 Configure Django REST Framework settings:
    REST_FRAMEWORK = {
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework.authentication.TokenAuthentication',
        ],
        'DEFAULT_PERMISSION_CLASSES': [
            'rest_framework.permissions.IsAuthenticated',
        ],
    }

1.3 Run migrations for token auth:
    python manage.py migrate

---
✅ STEP 2: CREATE LOGIN AND SIGNUP ENDPOINTS
Why? Users need to sign up and log in to receive a token for authenticated requests.

2.1 Create a users app if needed:
    python manage.py startapp users

2.2 Create serializers.py in `users/`:
    from django.contrib.auth.models import User
    from rest_framework import serializers

    class UserSerializer(serializers.ModelSerializer):
        class Meta:
            model = User
            fields = ['id', 'username', 'email']

2.3 Create login and signup views in `users/views.py`:
    from django.contrib.auth import authenticate
    from rest_framework.authtoken.models import Token
    from rest_framework.decorators import api_view
    from rest_framework.response import Response
    from django.contrib.auth.models import User

    @api_view(['POST'])
    def login_view(request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=400)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key})

    @api_view(['POST'])
    def signup_view(request):
        username = request.data.get("username")
        password = request.data.get("password")
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already taken"}, status=400)
        user = User.objects.create_user(username=username, password=password)
        token = Token.objects.create(user=user)
        return Response({"token": token.key})

2.4 Add routes in `users/urls.py`:
    from django.urls import path
    from .views import login_view, signup_view

    urlpatterns = [
        path('login/', login_view),
        path('signup/', signup_view),
    ]

2.5 Include these URLs in the main `urls.py`:
    path('api/', include('users.urls')),

---
✅ STEP 3: TIE MODELS TO USERS
Why? Each watchlist group and contract should be tied to the user who created them.

3.1 Update models (e.g., WatchlistGroup):
    from django.contrib.auth.models import User

    class WatchlistGroup(models.Model):
        user = models.ForeignKey(User, on_delete=models.CASCADE)
        name = models.CharField(max_length=255)
        ...

3.2 Filter views by user:
    def get_queryset(self):
        return WatchlistGroup.objects.filter(user=self.request.user)

3.3 Override `perform_create()` to assign `user=request.user` when creating.

---
✅ STEP 4: SET UP REACT TO HANDLE LOGIN
Why? React needs to send login credentials, store the token, and include it on all requests.

4.1 Create authService.js:
    export async function login(username, password) {
      const res = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
      }
      return data;
    }

    export function getAuthHeaders() {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Token ${token}` } : {};
    }

4.2 Example usage in fetch:
    fetch('/api/watchlist-groups/', {
      headers: getAuthHeaders()
    });

4.3 Build a login form that calls `login()` and stores the token.

---
✅ NEXT STEPS
We’ll now build:
  • A login/signup React form
  • Adjust API calls to pass the token
  • Add “My Watchlist” filtering
"""

# Save the plan as a .txt file
file_path = Path("/mnt/data/login_user_watchlist_plan.txt")
file_path.write_text(step_by_step_plan)

file_path.name



last thing we need to do is add to main routes loginform and signup form
