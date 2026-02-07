# server/tmdb_client.py
import os
import requests
import re
import difflib  # <--- NEW: For fixing typos
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv('TMDB_API_KEY')
OMDB_API_KEY = os.getenv('OMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"
OMDB_BASE_URL = "http://www.omdbapi.com/"

# --- CONFIGURATION MAPS ---

MOOD_GENRES = {
    "happy": "35|16",       # Comedy | Animation
    "sad": "18|10749",      # Drama | Romance
    "excited": "28|12",     # Action | Adventure
    "scared": "27",         # Horror
    "thrilling": "53",      # Thriller
    "romantic": "10749",    # Romance
    "bored": "9648|878",    # Mystery | Sci-Fi
    "funny": "35",          # Comedy
    "relaxing": "35|10751|14" # Comedy | Family | Fantasy
}

# Expanded keywords for better detection
MOOD_KEYWORDS = {
    "happy": ["happy", "joy", "good", "great", "cheerful", "laugh", "smile"],
    "sad": ["sad", "depressed", "heavy", "heart", "crying", "upset", "blue", "down", "cry"],
    "excited": ["excited", "pumped", "action", "adventure", "thrill", "hyped", "fast"],
    "scared": ["scared", "fear", "spooky", "horror", "creepy", "terrified", "ghost", "dark"],
    "thrilling": ["thrill", "suspense", "tension", "edge of seat", "mystery"],
    "romantic": ["romantic", "love", "date", "crush", "kiss", "couple"],
    "bored": ["bored", "boring", "something new", "interesting", "surprising"],
    "funny": ["funny", "hilarious", "comedy", "joke", "fun", "laughing"],
    "relaxing": ["tired", "exhausted", "stress", "long day", "relax", "chill", "feel good", "calm", "sleepy"]
}

LANGUAGE_MAP = {
    "tamil": "ta", "hindi": "hi", "english": "en", "malayalam": "ml",
    "telugu": "te", "korean": "ko", "french": "fr", "spanish": "es", "japanese": "ja"
}

# --- HELPER FUNCTIONS ---

def detect_mood(text):
    text = text.lower()
    
    # 1. Direct Match
    for mood, keywords in MOOD_KEYWORDS.items():
        if any(word in text for word in keywords):
            return mood
            
    # 2. Fuzzy Match (Handle Typos like "tierd" or "actoin")
    words = text.split()
    all_keywords = {word: mood for mood, keywords in MOOD_KEYWORDS.items() for word in keywords}
    
    for word in words:
        # Find closest match if it's at least 80% similar
        matches = difflib.get_close_matches(word, all_keywords.keys(), n=1, cutoff=0.8)
        if matches:
            return all_keywords[matches[0]]
            
    return None

def detect_language(text):
    text = text.lower()
    # 1. Direct Match
    for lang_name, code in LANGUAGE_MAP.items():
        if lang_name in text:
            return code, lang_name
            
    # 2. Fuzzy Match (Handle Typos like "taml", "hindhi")
    words = text.split()
    matches = difflib.get_close_matches(text, LANGUAGE_MAP.keys(), n=1, cutoff=0.8)
    if matches:
        matched_lang = matches[0]
        return LANGUAGE_MAP[matched_lang], matched_lang
        
    return None, None

def detect_count(text):
    numbers = re.findall(r'\b\d+\b', text)
    return min(int(numbers[0]), 10) if numbers else 3

# --- API FUNCTIONS WITH ERROR HANDLING ---

class NetworkError(Exception):
    pass

def check_connection():
    """Simple check to see if TMDb is reachable"""
    try:
        requests.get("https://api.themoviedb.org", timeout=5)
        return True
    except:
        return False

def get_watch_providers(movie_id, movie_title):
    try:
        url = f"{TMDB_BASE_URL}/movie/{movie_id}/watch/providers"
        response = requests.get(url, params={"api_key": TMDB_API_KEY}, timeout=5)
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
    except requests.exceptions.ConnectionError:
        return "Streaming info unavailable (Network Error)"
    except:
        return f"Click to find: https://www.google.com/search?q=watch+{movie_title.replace(' ', '+')}+online"

def get_extended_details(title, year):
    default_data = {"imdb_rating": "N/A", "cast": "N/A", "director": "N/A", "duration": "N/A"}
    if not OMDB_API_KEY: return default_data
    try:
        response = requests.get(OMDB_BASE_URL, params={"apikey": OMDB_API_KEY, "t": title, "y": year}, timeout=5)
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
        response = requests.get(url, params={"api_key": TMDB_API_KEY, "query": query}, timeout=10)
        return response.json().get('results', [])
    except requests.exceptions.ConnectionError:
        raise NetworkError("Failed to connect to TMDb")
    except: 
        return []

# server/tmdb_client.py

def get_trailer_key(movie_id):
    """
    Fetches the YouTube Video Key for a given movie ID.
    Returns the key string (e.g., 'd9MyW72ELq0') or None.
    """
    try:
        url = f"{TMDB_BASE_URL}/movie/{movie_id}/videos"
        params = {"api_key": TMDB_API_KEY}
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        results = data.get("results", [])
        
        # Priority 1: "Trailer" on YouTube
        for video in results:
            if video.get("site") == "YouTube" and video.get("type") == "Trailer":
                return video.get("key")
        
        # Priority 2: Any YouTube video (Teaser, Clip) if no Trailer found
        if results and results[0].get("site") == "YouTube":
             return results[0].get("key")

        return None
    except:
        return None
    
def discover_movies(mood=None, language_code=None):
    url = f"{TMDB_BASE_URL}/discover/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "sort_by": "popularity.desc",
        "vote_count.gte": 10, 
        "page": 1
    }
    
    if mood: params["with_genres"] = MOOD_GENRES.get(mood)
    if language_code: params["with_original_language"] = language_code

    try:
        response = requests.get(url, params=params, timeout=10)
        return response.json().get('results', [])
    except requests.exceptions.ConnectionError:
        raise NetworkError("Failed to connect to TMDb")
    except Exception as e:
        print(f"API Error: {e}")
        return []