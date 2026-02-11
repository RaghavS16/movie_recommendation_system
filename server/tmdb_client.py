# server/tmdb_client.py
import os
import requests
import re
import difflib
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv('TMDB_API_KEY')
OMDB_API_KEY = os.getenv('OMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"
OMDB_BASE_URL = "http://www.omdbapi.com/"

# --- CONFIGURATION MAPS (Same as before) ---
MOOD_GENRES = {
    "happy": "35|16", "sad": "18|10749", "excited": "28|12",
    "scared": "27", "thrilling": "53", "romantic": "10749",
    "bored": "9648|878", "funny": "35", "relaxing": "35|10751|14"
}

MOOD_KEYWORDS = {
    "happy": ["happy", "joy", "good", "great", "cheerful", "laugh", "smile"],
    "sad": ["sad", "depressed", "heavy", "heart", "crying", "upset", "blue", "down"],
    "excited": ["excited", "pumped", "action", "adventure", "thrill", "hyped", "fast"],
    "scared": ["scared", "fear", "spooky", "horror", "creepy", "terrified", "ghost"],
    "thrilling": ["thrill", "suspense", "tension", "edge of seat", "mystery"],
    "romantic": ["romantic", "love", "date", "crush", "kiss", "couple"],
    "bored": ["bored", "boring", "something new", "interesting"],
    "funny": ["funny", "hilarious", "comedy", "joke", "fun", "laughing"],
    "relaxing": ["tired", "exhausted", "stress", "long day", "relax", "chill", "feel good"]
}

LANGUAGE_MAP = {
    "tamil": "ta", "hindi": "hi", "english": "en", "malayalam": "ml",
    "telugu": "te", "korean": "ko", "french": "fr", "spanish": "es", "japanese": "ja"
}

# --- IMPROVED HELPER FUNCTIONS ---

def detect_mood(text):
    text = text.lower()
    negations = ["not", "no", "don't", "dont", "hate", "avoid", "dislike"]
    
    # Store all found moods and their position in the text
    found_moods = [] 

    for mood, keywords in MOOD_KEYWORDS.items():
        for word in keywords:
            if word in text:
                index = text.find(word)
                preceding_text = text[max(0, index-20):index].split()
                
                # If negated, skip it
                if any(neg in preceding_text[-3:] for neg in negations):
                    continue 
                
                # If valid, add to list with its position index
                found_moods.append((index, mood))

    # If we found valid moods, return the one that appears LAST in the sentence
    if found_moods:
        # Sort by index (position in sentence) and pick the last one
        found_moods.sort(key=lambda x: x[0]) 
        return found_moods[-1][1]
            
    # Fuzzy Match Fallback (Only if direct match failed)
    words = text.split()
    all_keywords = {word: mood for mood, keywords in MOOD_KEYWORDS.items() for word in keywords}
    for word in words:
        matches = difflib.get_close_matches(word, all_keywords.keys(), n=1, cutoff=0.8)
        if matches:
            return all_keywords[matches[0]]

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

def extract_year(text):
    """Finds a year (e.g., 1990, 2024) in the input."""
    match = re.search(r'\b(19|20)\d{2}\b', text)
    return match.group(0) if match else None

# --- API FUNCTIONS ---

def get_trailer_key(movie_id):
    try:
        url = f"{TMDB_BASE_URL}/movie/{movie_id}/videos"
        response = requests.get(url, params={"api_key": TMDB_API_KEY}, timeout=5)
        results = response.json().get("results", [])
        for video in results:
            if video.get("site") == "YouTube" and video.get("type") == "Trailer":
                return video.get("key")
        return results[0].get("key") if results else None
    except: return None

def get_watch_providers(movie_id, movie_title):
    try:
        url = f"{TMDB_BASE_URL}/movie/{movie_id}/watch/providers"
        response = requests.get(url, params={"api_key": TMDB_API_KEY}, timeout=5)
        data = response.json()
        all_results = data.get("results", {})
        
        # --- FIX: Check IN first, fallback to US if not available ---
        # This prevents "Streaming info unavailable" if the movie is only on US Netflix
        region_data = all_results.get("IN") or all_results.get("US") or {}
        
        providers = []
        if "flatrate" in region_data:
            providers = [p["provider_name"] for p in region_data["flatrate"]]
        
        return ", ".join(list(set(providers))) if providers else f"Click to find: https://www.google.com/search?q=watch+{movie_title.replace(' ', '+')}+online"
    except:
        return "Streaming info unavailable"
    
def get_extended_details(title, year):
    if not OMDB_API_KEY: return {"imdb_rating": "N/A", "cast": "N/A", "director": "N/A", "duration": "N/A"}
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
        return {"imdb_rating": "N/A", "cast": "N/A", "director": "N/A", "duration": "N/A"}
    except: return {"imdb_rating": "N/A", "cast": "N/A", "director": "N/A", "duration": "N/A"}

def search_movie(query):
    try:
        url = f"{TMDB_BASE_URL}/search/movie"
        response = requests.get(url, params={"api_key": TMDB_API_KEY, "query": query}, timeout=5)
        return response.json().get('results', [])
    except: return []

def discover_movies(mood=None, language_code=None, year=None, page=1):
    url = f"{TMDB_BASE_URL}/discover/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "sort_by": "popularity.desc",
        "vote_count.gte": 10, 
        "page": page
    }
    
    if mood: params["with_genres"] = MOOD_GENRES.get(mood)
    if language_code: params["with_original_language"] = language_code
    if year: params["primary_release_year"] = year

    try:
        response = requests.get(url, params=params, timeout=5)
        return response.json().get('results', [])
    except Exception as e:
        print(f"API Error: {e}")
        return []

# server/tmdb_client.py

def get_recommendations(movie_id, mood=None):
    """Fetches movies similar to a specific movie ID, strictly filtering by mood if provided."""
    url = f"{TMDB_BASE_URL}/movie/{movie_id}/recommendations"
    try:
        response = requests.get(url, params={"api_key": TMDB_API_KEY}, timeout=5)
        results = response.json().get('results', [])

        # --- NEW: Strict Genre Filtering ---
        if mood and mood in MOOD_GENRES:
            # 1. Get the allowed Genre IDs for this mood (e.g. "35|16" -> {35, 16})
            allowed_genres = set(int(g) for g in MOOD_GENRES[mood].split('|'))
            
            filtered_results = []
            for movie in results:
                movie_genres = set(movie.get('genre_ids', []))
                
                # 2. Keep movie ONLY if it matches at least one genre from the mood
                if not movie_genres.isdisjoint(allowed_genres):
                    filtered_results.append(movie)
            
            # If filtering removes everything (rare), fallback to original results
            return filtered_results if filtered_results else results

        return results
    except: return []

class NetworkError(Exception):
    pass

def check_connection():
    """Simple check to see if TMDb is reachable"""
    try:
        requests.get("https://api.themoviedb.org", timeout=5)
        return True
    except:
        return False
