# server/tmdb_client.py
import os, re, difflib
import requests as _req
from dotenv import load_dotenv
from tmdb_retry import tmdb_get

load_dotenv()

OMDB_API_KEY  = os.getenv('OMDB_API_KEY')
OMDB_BASE_URL = "http://www.omdbapi.com/"

# ─── SINGLE SOURCE OF TRUTH ───────────────────────────────────────────────────

LANGUAGE_MAP = {
    "tamil":"ta","hindi":"hi","english":"en","malayalam":"ml","telugu":"te",
    "korean":"ko","french":"fr","spanish":"es","japanese":"ja","chinese":"zh",
    "german":"de","italian":"it","portuguese":"pt","russian":"ru","arabic":"ar",
    "thai":"th","kannada":"kn","bengali":"bn","marathi":"mr",
}

# Single genre ID per mood — ensures TMDB returns exact genre matches
# TMDB Genre IDs:
#  28=Action 12=Adventure 16=Animation 35=Comedy 80=Crime
#  99=Documentary 18=Drama 10751=Family 14=Fantasy 36=History
#  27=Horror 10402=Music 9648=Mystery 10749=Romance 878=Sci-Fi 53=Thriller
MOOD_TO_GENRE_ID = {
    "relaxing":    35,
    "funny":       35,
    "happy":       35,
    "romantic":    10749,
    "sad":         18,
    "inspired":    18,
    "nostalgic":   18,
    "dark":        80,
    "scared":      27,
    "thrilling":   53,
    "excited":     28,
    "adventurous": 12,
    "bored":       878,
}

MOOD_GENRE_LABEL = {
    "relaxing":    "Comedy & Feel-Good",
    "funny":       "Comedy",
    "happy":       "Comedy & Feel-Good",
    "romantic":    "Romance",
    "sad":         "Drama",
    "inspired":    "Drama & Biography",
    "nostalgic":   "Classic Drama",
    "dark":        "Crime",
    "scared":      "Horror",
    "thrilling":   "Thriller",
    "excited":     "Action",
    "adventurous": "Adventure",
    "bored":       "Sci-Fi",
}

MOOD_GENRES = {k: str(v) for k, v in MOOD_TO_GENRE_ID.items()}

MOOD_KEYWORDS = {
    "relaxing":    ["tired","exhausted","stress","long day","chill","relax","unwind","calm","office","work","rough day","need a break"],
    "funny":       ["funny","comedy","laugh","hilarious","joke","humor","laughter"],
    "happy":       ["happy","joy","great","cheerful","good mood","celebrate","ecstatic","positive"],
    "romantic":    ["romantic","love","date","crush","couple","valentine","heart","romance","love story"],
    "sad":         ["sad","depressed","cry","upset","heartbreak","grief","lonely","miss","tears","emotional"],
    "inspired":    ["motivated","inspired","biography","true story","documentary","historical","motivate"],
    "nostalgic":   ["nostalgic","childhood","classic","old","90s","80s","vintage","retro","memory"],
    "dark":        ["dark","gritty","crime","violent","disturbing","mature","serious","gangster","mafia"],
    "scared":      ["scared","horror","spooky","creepy","ghost","terrified","nightmare","fear","scary"],
    "thrilling":   ["suspense","mystery","thriller","edge","twist","whodunit","detective"],
    "excited":     ["pumped","hyped","adrenaline","action","intense","fight","battle","war"],
    "adventurous": ["adventure","explore","journey","quest","travel","epic","fantasy","magical","mythical"],
    "bored":       ["bored","nothing","new","interesting","different","unique","surprise"],
}


def discover_movies(mood=None, language_code=None, year=None, page=1):
    """
    Genre-accurate, quality-first movie discovery.
    - Single genre_id per mood (not OR-chain) = exact match
    - vote_count >= 200 = no obscure films
    - sort by vote_average = best quality first
    - vote_average >= 6.5 = minimum quality bar
    """
    params = {
        "sort_by":          "vote_average.desc",
        "vote_count.gte":   200,
        "vote_average.gte": 6.5,
        "page":             page,
    }
    if mood and mood in MOOD_TO_GENRE_ID:
        params["with_genres"] = MOOD_TO_GENRE_ID[mood]
    if language_code:
        params["with_original_language"] = language_code
    if year:
        params["primary_release_year"] = year

    data    = tmdb_get("/discover/movie", params)
    results = data.get("results", [])

    # Relax thresholds once if no results (e.g. 2026 Tamil romantic)
    if not results:
        params["vote_count.gte"]   = 50
        params["vote_average.gte"] = 6.0
        data    = tmdb_get("/discover/movie", params)
        results = data.get("results", [])

    return results


def search_movie(query):
    data = tmdb_get("/search/movie", {"query": query})
    return data.get("results", [])


def get_recommendations(movie_id, mood=None):
    data    = tmdb_get(f"/movie/{movie_id}/recommendations")
    results = data.get("results", [])
    if mood and mood in MOOD_TO_GENRE_ID:
        gid      = MOOD_TO_GENRE_ID[mood]
        filtered = [m for m in results if gid in m.get("genre_ids", [])]
        return filtered if filtered else results
    return results


def get_trailer_key(movie_id):
    data    = tmdb_get(f"/movie/{movie_id}/videos")
    results = data.get("results", [])
    for v in results:
        if v.get("site") == "YouTube" and v.get("type") == "Trailer":
            return v.get("key")
    return results[0].get("key") if results else None


def get_watch_providers(movie_id, movie_title):
    data        = tmdb_get(f"/movie/{movie_id}/watch/providers")
    region_data = data.get("results", {})
    info        = region_data.get("IN") or region_data.get("US") or {}
    providers   = [p["provider_name"] for p in info.get("flatrate", [])]
    if providers:
        return ", ".join(sorted(set(providers)))
    safe = movie_title.replace(" ", "+")
    return f"Click to find: https://www.google.com/search?q=watch+{safe}+online"


def get_extended_details(title, year):
    if not OMDB_API_KEY:
        return {"imdb_rating":"N/A","cast":"N/A","director":"N/A","duration":"N/A"}
    try:
        resp = _req.get(OMDB_BASE_URL, params={"apikey":OMDB_API_KEY,"t":title,"y":year}, timeout=5)
        d = resp.json()
        if d.get("Response") == "True":
            return {
                "imdb_rating": d.get("imdbRating","N/A"),
                "cast":        d.get("Actors","N/A"),
                "director":    d.get("Director","N/A"),
                "duration":    d.get("Runtime","N/A"),
            }
    except Exception as e:
        print(f"OMDB error: {e}")
    return {"imdb_rating":"N/A","cast":"N/A","director":"N/A","duration":"N/A"}


def detect_mood(text):
    text = text.lower()
    negations = {"not","no","don't","dont","hate","avoid","dislike"}
    found = []
    for mood, keywords in MOOD_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                idx  = text.find(kw)
                prev = set(text[max(0,idx-25):idx].split())
                if not prev & negations:
                    found.append((idx, mood))
    if found:
        return sorted(found)[-1][1]
    all_kw = {w: m for m, kws in MOOD_KEYWORDS.items() for w in kws}
    for word in text.split():
        m = difflib.get_close_matches(word, all_kw, n=1, cutoff=0.82)
        if m:
            return all_kw[m[0]]
    return None

def detect_language(text):
    text = text.lower()
    for lang, code in LANGUAGE_MAP.items():
        if lang in text:
            return code, lang
    return None, None

def detect_count(text):
    nums = re.findall(r'\b\d+\b', text)
    return min(int(nums[0]), 10) if nums else 3

def extract_year(text):
    m = re.search(r'\b(19|20)\d{2}\b', text)
    return m.group(0) if m else None

class NetworkError(Exception):
    pass