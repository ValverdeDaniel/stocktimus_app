from pathlib import Path
import os
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-u2p&t2+k+4%4ur1os_=sq)3w-ntb%=4)^^pu6n2^-(!p4__)1l"
DEBUG = True
ALLOWED_HOSTS = []

# --- Application definition ---
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'rest_framework',              # API framework
    'rest_framework.authtoken',    # Token-based auth
    'corsheaders',                 # For CORS (local frontend dev)
    'contracts',                   # Your custom app
    'users',                       # Your custom app
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # ✅ CORS Middleware should be placed as high as possible
    'corsheaders.middleware.CorsMiddleware',
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# --- Database ---
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': os.environ.get('DB_NAME', 'options_db'),
        'USER': os.environ.get('DB_USER', 'options_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'secret123'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# --- Password validators ---
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- i18n ---
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# --- Static files ---
STATIC_URL = "static/"

# ✅ REST Framework Auth + Permissions
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',   # Add token auth
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',        # Require auth by default
    ]
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ✅ CORS setup for local frontend development
# For development, allowing all origins is convenient.
CORS_ALLOW_ALL_ORIGINS = True 

# 🔒 For production, you should use a whitelist of allowed origins for security.
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",      # Your React frontend development server
#     "http://127.0.0.1:3000",
#     # "https://your-production-frontend.com", # Your deployed frontend URL
# ]


# ✅ EODHD API Key for Options Chain
EODHD_API_KEY = "67ffece4b2ae08.94077168"
