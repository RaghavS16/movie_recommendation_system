# server/tmdb_client.py
import os
import requests
import re
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv('TMDB_API_KEY')
OMDB_API_KEY = os.getenv('OMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"
OMDB_BASE_URL = "http://www.omdbapi.com/"

MOOD_GENRES = {
    "happy": "35|16", "sad": "18|10749", "excited": "28|12",
    "scared": "27", "thrilling": "53", # Separated Horror and Thriller
    "romantic": "10749", "bored": "9648|878",
    "funny": "35", "relaxing": "35|10751|14"
}

MOOD_KEYWORDS = {
    "happy": ["happy", "joy", "good", "great", "cheerful", "laugh"],
    "sad": ["sad", "depressed", "heavy", "heart", "crying", "upset", "blue", "down"],
    "excited": ["excited", "pumped", "action", "adventure", "thrill", "hyped"],
    "scared": ["scared", "fear", "spooky", "horror", "creepy", "terrified", "ghost"],
    "thrilling": ["thrill", "suspense", "tension", "edge of seat"],
    "romantic": ["romantic", "love", "date", "crush", "kiss"],
    "bored": ["bored", "boring", "something new", "interesting"],
    "funny": ["funny", "hilarious", "comedy", "joke"],
    "relaxing": ["tired", "exhausted", "stress", "long day", "relax", "chill", "feel good"]
}

LANGUAGE_MAP = {
    "tamil": "ta", "hindi": "hi", "english": "en", "malayalam": "ml",
    "telugu": "te", "korean": "ko", "french": "fr", "spanish": "es", "japanese": "ja"
}

def detect_mood(text):
    text = text.lower()
    for mood, keywords in MOOD_KEYWORDS.items():
        if any(word in text for word in keywords):
            return mood
    return None

def detect_language(text):
    text = text.lower()
    for lang_name, code in LANGUAGE_MAP.items():
        if lang_name in text:
            return code, lang_name
    return None, None

def detect_count(text):
    numbers = re.findall(r'\b\d+\b', text)
    return min(int(numbers[0]), 10) if numbers else 3

def get_watch_providers(movie_id, movie_title):
    try:
        url = f"{TMDB_BASE_URL}/movie/{movie_id}/watch/providers"
        response = requests.get(url, params={"api_key": TMDB_API_KEY})
        data = response.json()
        results = data.get("results", {})
        region_data = results.get("IN")
        
        providers = []
        if region_data:
            for key in ["flatrate", "rent", "buy"]:
                if key in region_data:
                    for p in region_data[key]:
                        providers.append(p["provider_name"] if key == "flatrate" else f"{key.title()}: {p['provider_name']}")
        
        return ", ".join(list(set(providers))) if providers else f"Click to find: https://www.google.com/search?q=watch+{movie_title.replace(' ', '+')}+online"
    except:
        return f"Click to find: https://www.google.com/search?q=watch+{movie_title.replace(' ', '+')}+online"

def get_extended_details(title, year):
    default_data = {"imdb_rating": "N/A", "cast": "N/A", "director": "N/A", "duration": "N/A"}
    if not OMDB_API_KEY: return default_data
    try:
        response = requests.get(OMDB_BASE_URL, params={"apikey": OMDB_API_KEY, "t": title, "y": year})
        data = response.json()
        if data.get("Response") == "True":
            return {
                "imdb_rating": data.get("imdbRating", "N/A"),
                "cast": data.get("Actors", "N/A"),
                "director": data.get("Director", "N/A"),
                "duration": data.get("Runtime", "N/A")
            }
        return default_data
    except: return default_data

def search_movie(query):
    try:
        url = f"{TMDB_BASE_URL}/search/movie"
        response = requests.get(url, params={"api_key": TMDB_API_KEY, "query": query})
        return response.json().get('results', [])
    except: return []

# UPDATED FUNCTION FOR YOUR LOGIC
def discover_movies(mood=None, language_code=None):
    url = f"{TMDB_BASE_URL}/discover/movie"
    params = {
        "api_key": TMDB_API_KEY,
        # 1. Fetch POPULAR movies first (so we always get results)
        "sort_by": "popularity.desc",
        # 2. Lower vote count so we don't miss regional movies
        "vote_count.gte": 10, 
        "page": 1
    }
    
    if mood: 
        params["with_genres"] = MOOD_GENRES.get(mood)
    
    if language_code: 
        params["with_original_language"] = language_code
        print(f"🔹 DEBUG: Filtering by Language Code: {language_code}")

    try:
        response = requests.get(url, params=params)
        results = response.json().get('results', [])
        return results 
    except Exception as e:
        print(f"Error connecting to TMDb: {e}")
        return []