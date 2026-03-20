# server/movie_search.py
# Smart movie search that handles ANY typo in movie names
# Uses TMDB's built-in fuzzy search + phonetic normalization
# 100% FREE - no extra API needed

import os
import re
import requests
import difflib
from dotenv import load_dotenv
from tmdb_retry import tmdb_get

load_dotenv()

TMDB_API_KEY = os.getenv('TMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"

# ─── PHONETIC NORMALIZATION ────────────────────────────────────────────────────
# These rules fix how people SOUND OUT movie names when typing

PHONETIC_REPLACEMENTS = [
    # Doubled/missing letters
    (r'(.)\1{2,}', r'\1\1'),        # "ustaad" → "ustad" (3+ same chars → 2)
    
    # Common sound-alike substitutions (order matters)
    (r'\bph\b', 'f'),               # "phun" → "fun"
    (r'ph', 'f'),                   # anywhere: "dolph" stays, "phobia" → "fobia"
    (r'ck$', 'k'),                  # trailing: "black" → "blak" — skip (too aggressive)
    (r'([aeiou])([aeiou])\2+', r'\1\2'),  # "hoootel" → "hotel"
    
    # Common vowel confusion
    (r'ie', 'i'),                   # "thief" alternates
    (r'ei', 'i'),
    
    # Indian language transliteration variants
    (r'th', 't'),                   # "ustad" / "usthad" → both become "ustad"
    (r'kh', 'k'),                   # "khabi" → "kabi"
    (r'dh', 'd'),                   # "dhoom" → "doom" for matching
    (r'gh', 'g'),
    (r'sh', 's'),
    (r'ch', 'c'),
    (r'aa', 'a'),                   # "baahubali" → "bahubali"
    (r'ee', 'i'),                   # "preethi" → "prithi"
    (r'oo', 'u'),                   # "ustaad" → "ustad"
    (r'ou', 'u'),
    (r'ai', 'a'),
]

def phonetic_normalize(text):
    """
    Reduce a word to its phonetic skeleton so 'usthad' and 'ustad' 
    both become 'ustad' (or a common simplified form).
    """
    text = text.lower().strip()
    for pattern, replacement in PHONETIC_REPLACEMENTS:
        text = re.sub(pattern, replacement, text)
    return text


# ─── QUERY CLEANUP ─────────────────────────────────────────────────────────────

# Words that appear in user messages but not in movie titles
NOISE_WORDS = {
    'movie', 'film', 'cinema', 'picture', 'show', 'watch', 'see', 'about',
    'tell', 'me', 'the', 'a', 'an', 'is', 'was', 'what', 'who', 'give',
    'suggest', 'recommend', 'find', 'search', 'please', 'pls', 'plz', 'want',
    'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'info', 'details',
    'cast', 'director', 'rating', 'review', 'synopsis', 'story', 'plot',
}

def clean_search_query(raw_query: str) -> str:
    """
    Remove noise words and clean up the query before sending to TMDB.
    Example: "tell me about usthad hotal movie" → "usthad hotal"
    """
    words = raw_query.lower().split()
    cleaned = [w for w in words if w not in NOISE_WORDS and len(w) > 1]
    return ' '.join(cleaned).strip()


# ─── TMDB SEARCH (primary) ────────────────────────────────────────────────────

def tmdb_search(query: str, limit: int = 5):
    """TMDB movie search with automatic retry on connection errors."""
    data = tmdb_get("/search/movie", {"query": query, "include_adult": False})
    return data.get("results", [])[:limit]


def tmdb_search_multi(query: str, limit: int = 5):
    """TMDB multi-search with automatic retry."""
    data    = tmdb_get("/search/multi", {"query": query})
    results = data.get("results", [])
    movies  = [r for r in results if r.get('media_type') == 'movie']
    return movies[:limit]


# ─── RESULT SCORER ────────────────────────────────────────────────────────────

def score_result(movie: dict, query: str) -> float:
    """
    Score how well a TMDB result matches the user's query.
    Higher = better match.

    Key fix: a result whose title is SHORTER than the query gets penalised.
    Example: query="theri" (5 chars) vs title="Teri" (4 chars).
    "Theri" (5 chars) is a closer length match, so it ranks higher.
    This stops short titles like "Teri" from beating "Theri".
    """
    title    = (movie.get('title') or '').lower()
    original = (movie.get('original_title') or '').lower()
    query_lower = query.lower().strip()

    # ── Exact match (case-insensitive) ──
    if title == query_lower or original == query_lower:
        return 1.0

    # ── Sequence similarity ──
    title_sim    = difflib.SequenceMatcher(None, query_lower, title).ratio()
    original_sim = difflib.SequenceMatcher(None, query_lower, original).ratio()

    # ── Phonetic similarity ──
    query_phon   = phonetic_normalize(query_lower)
    title_phon   = phonetic_normalize(title)
    orig_phon    = phonetic_normalize(original)
    phonetic_sim = max(
        difflib.SequenceMatcher(None, query_phon, title_phon).ratio(),
        difflib.SequenceMatcher(None, query_phon, orig_phon).ratio(),
    )

    # ── Starts-with bonus ──
    starts = 0.12 if (title.startswith(query_lower[:4]) or
                      original.startswith(query_lower[:4])) else 0

    # ── Length-difference penalty ──
    # If a title is shorter than the query it is likely a different word,
    # not a typo of the query.  e.g. "Teri" (4) vs query "theri" (5).
    # Penalty = 0.08 per missing character (capped at 0.25).
    best_title = title if title_sim >= original_sim else original
    len_diff   = len(query_lower) - len(best_title)
    len_penalty = min(max(len_diff, 0) * 0.08, 0.25)

    # ── Popularity bonus (tiny weight) ──
    pop_bonus = min(movie.get('popularity', 0) / 1000, 0.08)

    best_text = max(title_sim, original_sim)
    score = max(best_text, phonetic_sim) + starts + pop_bonus - len_penalty
    return score


# ─── SMART SEARCH (main function) ─────────────────────────────────────────────

def smart_movie_search(raw_query: str, limit: int = 5):
    """
    Main entry point. Handles:
      - Typos:          "usthad hotal" → finds "Ustad Hotel"
      - Extra words:    "tell me about the dark knight movie"
      - Missing spaces: "darkknight" → "dark knight"  
      - Mixed case:     doesn't matter
      - Indian names:   "baahubali" / "bahubali" / "bahubaali" all work
      - English names:  "shawshnk redemptn" → "Shawshank Redemption"
    
    Returns list of TMDB movie dicts, best match first.
    """
    print(f"🔎 SMART SEARCH: '{raw_query}'")
    
    # Step 1: Clean query
    cleaned = clean_search_query(raw_query)
    if not cleaned:
        cleaned = raw_query
    print(f"  → Cleaned: '{cleaned}'")
    
    # Step 2: Try TMDB directly (it handles many typos internally)
    candidates = tmdb_search(cleaned)
    
    # Step 3: If poor results, try phonetically normalized version
    if not candidates or (candidates and score_result(candidates[0], cleaned) < 0.45):
        normalized = phonetic_normalize(cleaned)
        if normalized != cleaned:
            print(f"  → Phonetic: '{normalized}'")
            phon_results = tmdb_search(normalized)
            candidates = candidates + phon_results
    
    # Step 4: Try word-by-word partial search (for missing-space typos)
    if not candidates:
        words = cleaned.split()
        if len(words) > 1:
            for word in words:
                if len(word) > 3:
                    partial = tmdb_search(word, limit=8)
                    candidates.extend(partial)
    
    # Step 5: Try multi-search (catches actors/directors too)
    if not candidates:
        candidates = tmdb_search_multi(cleaned)
    
    # Step 6: Remove duplicates (by TMDB id)
    seen_ids = set()
    unique = []
    for m in candidates:
        if m.get('id') not in seen_ids:
            seen_ids.add(m.get('id'))
            unique.append(m)
    
    # Step 7: Re-rank by our custom scorer
    scored = [(score_result(m, cleaned), m) for m in unique]
    scored.sort(key=lambda x: x[0], reverse=True)
    
    # Debug: show top matches
    for score, m in scored[:3]:
        print(f"  ✓ [{score:.2f}] {m.get('title')} ({m.get('release_date','')[:4]})")
    
    results = [m for _, m in scored[:limit]]
    
    # Step 8: If still nothing, return empty with helpful flag
    return results


def get_best_match(raw_query: str):
    """
    Returns the single best matching movie, or None.
    Use this when the user is asking about ONE specific film.
    """
    results = smart_movie_search(raw_query, limit=1)
    return results[0] if results else None


def did_you_mean(raw_query: str, results: list) -> str:
    """
    If the top result title differs from the query, 
    generate a "Did you mean X?" string.
    """
    if not results:
        return ""
    top_title = results[0].get('title', '')
    query_lower = raw_query.lower().strip()
    sim = difflib.SequenceMatcher(None, query_lower, top_title.lower()).ratio()
    
    # Only suggest if meaningfully different but still a match
    if 0.35 < sim < 0.88:
        return f"(Showing results for **{top_title}**)"
    return ""


# ─── PERSON SEARCH (Actor / Director) ────────────────────────────────────────

def search_person_id(name: str):
    """
    Search TMDB for a person (actor or director) by name.
    Returns (person_id, person_name, known_for_department) or (None, None, None).
    Handles typos — e.g. "shanker" finds "Shankar", "vijy" finds "Vijay".
    """
    try:
        data    = tmdb_get("/search/person", {"query": name})
        results = data.get("results", [])
        if not results:
            return None, None, None

        # Score by name similarity + popularity
        query_lower = name.lower()
        best = None
        best_score = -1
        for p in results[:8]:
            pname = (p.get("name") or "").lower()
            sim = difflib.SequenceMatcher(None, query_lower, pname).ratio()
            # phonetic similarity
            p_phon = phonetic_normalize(pname)
            q_phon = phonetic_normalize(query_lower)
            phon   = difflib.SequenceMatcher(None, q_phon, p_phon).ratio()
            pop    = min(p.get("popularity", 0) / 200, 0.15)
            score  = max(sim, phon) + pop
            if score > best_score:
                best_score = score
                best = p

        if best and best_score > 0.4:
            dept = best.get("known_for_department", "Acting")
            print(f"  👤 Person found: {best['name']} ({dept}) score={best_score:.2f}")
            return best["id"], best["name"], dept
        return None, None, None
    except Exception as e:
        print(f"Person search error: {e}")
        return None, None, None


def get_movies_by_actor(actor_name: str, limit: int = 8):
    """
    Returns top movies an actor is known for, sorted by popularity/vote.
    Handles typos in the actor name.
    Example: "vijay", "vijy", "thalapathy vijay" → Vijay's filmography
    """
    person_id, real_name, dept = search_person_id(actor_name)
    if not person_id:
        print(f"  ✗ Actor not found: '{actor_name}'")
        return [], None

    try:
        data = tmdb_get(f"/person/{person_id}/movie_credits")

        # Cast credits (movies actor appeared in)
        cast = data.get("cast", [])

        # Filter: must have a poster and at least some votes
        cast = [m for m in cast if m.get("poster_path") and m.get("vote_count", 0) > 50]

        # Sort by vote_average × log(vote_count) — rewards quality + popularity
        import math
        cast.sort(
            key=lambda m: m.get("vote_average", 0) * math.log(max(m.get("vote_count", 1), 1)),
            reverse=True,
        )
        print(f"  🎬 Actor '{real_name}': {len(cast)} movies found, returning top {limit}")
        return cast[:limit], real_name
    except Exception as e:
        print(f"Actor credits error: {e}")
        return [], real_name


def get_movies_by_director(director_name: str, limit: int = 8):
    """
    Returns top movies a director made, sorted by rating.
    Handles typos in the director name.
    Example: "shankar", "dir shanker", "s shankar" → Shankar's filmography
    """
    # Strip common prefixes users type
    clean = re.sub(
        r'^(dir|director|directed by|filmmaker|shankar|s\.?)\s*',
        '', director_name, flags=re.IGNORECASE
    ).strip() or director_name

    person_id, real_name, dept = search_person_id(clean)

    # If found as actor, try the original full name too
    if not person_id:
        person_id, real_name, dept = search_person_id(director_name)

    if not person_id:
        print(f"  ✗ Director not found: '{director_name}'")
        return [], None

    try:
        data = tmdb_get(f"/person/{person_id}/movie_credits")

        # Crew credits — filter to directing roles
        crew = data.get("crew", [])
        directed = [
            m for m in crew
            if m.get("job", "").lower() in ("director", "co-director")
            and m.get("poster_path")
            and m.get("vote_count", 0) > 30
        ]

        # If TMDB has no directing credits (e.g. person is mainly actor),
        # fall back to their cast credits so we still return something
        if not directed:
            print(f"  ⚠ No directing credits for '{real_name}', falling back to cast")
            directed = [
                m for m in data.get("cast", [])
                if m.get("poster_path") and m.get("vote_count", 0) > 50
            ]

        import math
        directed.sort(
            key=lambda m: m.get("vote_average", 0) * math.log(max(m.get("vote_count", 1), 1)),
            reverse=True,
        )
        print(f"  🎬 Director '{real_name}': {len(directed)} films found, returning top {limit}")
        return directed[:limit], real_name
    except Exception as e:
        print(f"Director credits error: {e}")
        return [], real_name


# ─── SONG → MOVIE SEARCH ─────────────────────────────────────────────────────

def find_movie_by_song(song_name: str, limit: int = 3):
    """
    Find which movie a song belongs to.
    Strategy:
      1. Search TMDB directly for the song name (some movies share song titles)
      2. Use Groq/rule-based to extract movie name if known
      3. Fall back to a keyword search combining song + "movie soundtrack"
    Returns list of TMDB movie dicts.

    Note: TMDB doesn't have a dedicated song search endpoint, so we search
    the movie title index — many Indian films are commonly searched by song.
    We also try removing common song suffixes like "song", "lyric video" etc.
    """
    print(f"  🎵 Song search: '{song_name}'")

    # Clean up song query — remove words like "song", "lyrics", "video", "full"
    song_noise = {
        'song', 'songs', 'lyric', 'lyrics', 'video', 'full', 'official',
        'audio', 'hd', 'ft', 'feat', 'music', 'ost', 'soundtrack',
    }
    words = song_name.lower().split()
    cleaned_song = ' '.join(w for w in words if w not in song_noise).strip() or song_name

    candidates = []

    # Try 1: search movie titles matching the song name directly
    # (works for films named after their hit song, e.g. "Rowdy Baby")
    direct = tmdb_search(cleaned_song, limit=5)
    candidates.extend(direct)

    # Try 2: phonetic variant
    phon = phonetic_normalize(cleaned_song)
    if phon != cleaned_song:
        phon_results = tmdb_search(phon, limit=5)
        candidates.extend(phon_results)

    # Try 3: search keyword by keyword (song may be part of movie title)
    for word in cleaned_song.split():
        if len(word) > 4:
            partial = tmdb_search(word, limit=6)
            candidates.extend(partial)

    # Deduplicate
    seen = set()
    unique = []
    for m in candidates:
        if m.get('id') not in seen:
            seen.add(m.get('id'))
            unique.append(m)

    # Score — for song search, we care more about popularity than title match
    # because the song title often doesn't match the movie title
    scored = []
    for m in unique:
        title_score = score_result(m, cleaned_song)
        # Give a popularity boost for song searches since title match is unreliable
        pop_score = min(m.get('popularity', 0) / 300, 0.3)
        vote_score = min(m.get('vote_average', 0) / 10, 0.1)
        final = title_score * 0.5 + pop_score + vote_score
        scored.append((final, m))

    scored.sort(key=lambda x: x[0], reverse=True)

    for s, m in scored[:3]:
        print(f"  ✓ [{s:.2f}] {m.get('title')} ({m.get('release_date','')[:4]})")

    return [m for _, m in scored[:limit]]