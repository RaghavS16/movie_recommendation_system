# server/ai_processor.py
import os, json, re, difflib, random
from dotenv import load_dotenv
from tmdb_client import LANGUAGE_MAP, MOOD_KEYWORDS, MOOD_TO_GENRE_ID, MOOD_GENRE_LABEL

load_dotenv()
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# ─── GROQ SYSTEM PROMPT ───────────────────────────────────────────────────────

_SYSTEM_PROMPT = """You are FilmoBot, a movie recommendation assistant.
Extract intent from user messages. Respond ONLY with valid JSON — no explanation, no markdown.

JSON schema:
{
  "intent": "discover" | "search" | "similar" | "person_search" | "song_search" | "greeting" | "reset",
  "mood": "relaxing"|"funny"|"happy"|"romantic"|"sad"|"inspired"|"nostalgic"|"dark"|"scared"|"thrilling"|"excited"|"adventurous"|"bored" | null,
  "language": language in lowercase e.g. "tamil","hindi","english","korean" | null,
  "year": "YYYY" | null,
  "count": integer 1-10 (default 5),
  "search_query": exact movie name as user typed | null,
  "person_query": exact actor/director name as user typed | null,
  "song_query": exact song name as user typed | null,
  "reason": user's emotional context in one sentence | ""
}

Intent rules:
- discover     → mood, genre, language, or general "suggest me" request
- search       → user names a specific movie title
- similar      → "like X", "similar to X", "same vibe as X"
- person_search→ "vijay movies", "nolan films", "movies with dhanush", "dir shankar"
- song_search  → user knows a song, wants to find the movie
- greeting     → hi/hello/hey only
- reset        → clear/reset/forget

Mood mapping (use these ONLY):
- relaxing  = tired, stressed, long day, office, work, need to unwind, chill
- funny     = want to laugh, comedy, hilarious
- happy     = cheerful, good mood, positive vibes
- romantic  = love, date night, love story, heart, romance
- sad       = heartbreak, emotional, cry, lonely
- inspired  = biography, true story, motivational, real events
- nostalgic = childhood, classics, old movies, retro
- dark      = crime, gritty, gangster, violent, mature
- scared    = horror, ghost, spooky, terrifying
- thrilling = suspense, mystery, twist, detective
- excited   = action, fight, adrenaline, battle
- adventurous = adventure, fantasy, quest, journey, explore
- bored     = surprise me, something different, random

Rules:
- Keep search_query/person_query/song_query EXACTLY as user typed (typos included)
- null language means all languages
- count default is 5, not 1"""

_FEW_SHOTS = [
    # Mood discovery — natural language descriptions
    ("i'm tired in high work in my office so i need to relax suggest movie for me",
     '{"intent":"discover","mood":"relaxing","language":null,"year":null,"count":5,"search_query":null,"person_query":null,"song_query":null,"reason":"User exhausted from office work, needs to unwind"}'),
    ("i feel lonely tonight suggest something",
     '{"intent":"discover","mood":"sad","language":null,"year":null,"count":5,"search_query":null,"person_query":null,"song_query":null,"reason":"User feeling lonely"}'),
    ("love vibe in 2026",
     '{"intent":"discover","mood":"romantic","language":null,"year":"2026","count":5,"search_query":null,"person_query":null,"song_query":null,"reason":""}'),
    ("tamil comedy movies",
     '{"intent":"discover","mood":"funny","language":"tamil","year":null,"count":5,"search_query":null,"person_query":null,"song_query":null,"reason":""}'),
    ("show 5 hindi romantic films 2023",
     '{"intent":"discover","mood":"romantic","language":"hindi","year":"2023","count":5,"search_query":null,"person_query":null,"song_query":null,"reason":""}'),
    ("i want something scary",
     '{"intent":"discover","mood":"scared","language":null,"year":null,"count":5,"search_query":null,"person_query":null,"song_query":null,"reason":""}'),
    ("suggest a crime thriller",
     '{"intent":"discover","mood":"dark","language":null,"year":null,"count":5,"search_query":null,"person_query":null,"song_query":null,"reason":""}'),
    ("adventure fantasy film",
     '{"intent":"discover","mood":"adventurous","language":null,"year":null,"count":5,"search_query":null,"person_query":null,"song_query":null,"reason":""}'),
    # Specific movie
    ("tell me about mersal",
     '{"intent":"search","mood":null,"language":null,"year":null,"count":5,"search_query":"mersal","person_query":null,"song_query":null,"reason":""}'),
    ("usthad hotal",
     '{"intent":"search","mood":null,"language":null,"year":null,"count":5,"search_query":"usthad hotal","person_query":null,"song_query":null,"reason":""}'),
    ("shawshnk redemptn",
     '{"intent":"search","mood":null,"language":null,"year":null,"count":5,"search_query":"shawshnk redemptn","person_query":null,"song_query":null,"reason":""}'),
    ("inception",
     '{"intent":"search","mood":null,"language":null,"year":null,"count":5,"search_query":"inception","person_query":null,"song_query":null,"reason":""}'),
    # Similar
    ("something like interstellar",
     '{"intent":"similar","mood":null,"language":null,"year":null,"count":5,"search_query":"interstellar","person_query":null,"song_query":null,"reason":""}'),
    ("movies similar to the dark knight",
     '{"intent":"similar","mood":null,"language":null,"year":null,"count":5,"search_query":"the dark knight","person_query":null,"song_query":null,"reason":""}'),
    # Person
    ("vijay top movies",
     '{"intent":"person_search","mood":null,"language":null,"year":null,"count":5,"search_query":null,"person_query":"vijay","song_query":null,"reason":""}'),
    ("dir shankar best films",
     '{"intent":"person_search","mood":null,"language":null,"year":null,"count":5,"search_query":null,"person_query":"shankar","song_query":null,"reason":""}'),
    ("movies with dhanush",
     '{"intent":"person_search","mood":null,"language":null,"year":null,"count":5,"search_query":null,"person_query":"dhanush","song_query":null,"reason":""}'),
    ("nolan films",
     '{"intent":"person_search","mood":null,"language":null,"year":null,"count":5,"search_query":null,"person_query":"nolan","song_query":null,"reason":""}'),
    ("rajinikanth hits",
     '{"intent":"person_search","mood":null,"language":null,"year":null,"count":5,"search_query":null,"person_query":"rajinikanth","song_query":null,"reason":""}'),
    # Song
    ("Aura 10/10",
     '{"intent":"song_search","mood":null,"language":null,"year":null,"count":3,"search_query":null,"person_query":null,"song_query":"Aura 10/10","reason":""}'),
    ("which movie has song Kesariya",
     '{"intent":"song_search","mood":null,"language":null,"year":null,"count":3,"search_query":null,"person_query":null,"song_query":"Kesariya","reason":""}'),
    ("i know a song Rowdy Baby find the movie",
     '{"intent":"song_search","mood":null,"language":null,"year":null,"count":3,"search_query":null,"person_query":null,"song_query":"Rowdy Baby","reason":""}'),
]


# ─── GROQ CALL ────────────────────────────────────────────────────────────────

def analyze_with_groq(user_message):
    if not GROQ_API_KEY:
        return None
    try:
        import requests
        messages = [{"role": "system", "content": _SYSTEM_PROMPT}]
        for user_ex, assistant_ex in _FEW_SHOTS:
            messages.append({"role": "user",      "content": user_ex})
            messages.append({"role": "assistant", "content": assistant_ex})
        messages.append({"role": "user", "content": user_message})

        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": "llama-3.1-8b-instant", "messages": messages,
                  "max_tokens": 200, "temperature": 0.1},
            timeout=8,
        )
        resp.raise_for_status()
        raw = resp.json()["choices"][0]["message"]["content"].strip()
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        result = json.loads(raw)
        print(f"Groq: {result}")
        return result
    except Exception as e:
        print(f"Groq failed ({e}), using rule-based fallback")
        return None


# ─── RULE-BASED FALLBACK ──────────────────────────────────────────────────────

_KNOWN_TYPOS = {
    "movei":"movie","moive":"movie","flim":"film",
    "tierd":"tired","tird":"tired","exausted":"exhausted",
    "stressd":"stressed","stresd":"stressed",
    "ofice":"office","offce":"office",
    "recomend":"recommend","reccomend":"recommend",
    "sugget":"suggest","sugest":"suggest",
    "romant":"romantic","romantik":"romantic",
    "horro":"horror","horor":"horror",
    "commedy":"comedy","komedy":"comedy",
    "relaxe":"relax","relex":"relax",
}

def _fix_typos(text):
    words = text.split()
    mood_words = [w for kws in MOOD_KEYWORDS.values() for w in kws]
    lang_words = list(LANGUAGE_MAP.keys())
    vocab = mood_words + lang_words
    out = []
    for w in words:
        lw = w.lower()
        if lw in _KNOWN_TYPOS:
            out.append(_KNOWN_TYPOS[lw])
        else:
            close = difflib.get_close_matches(lw, vocab, n=1, cutoff=0.83)
            out.append(close[0] if close else w)
    return " ".join(out)

def analyze_rule_based(text):
    text_fixed = _fix_typos(text.lower())
    result = {
        "intent":"discover","mood":None,"language":None,"year":None,
        "count":5,"search_query":None,"person_query":None,"song_query":None,"reason":""
    }
    # Language
    for lang in LANGUAGE_MAP:
        if lang in text_fixed:
            result["language"] = lang
            break
    # Year
    m = re.search(r'\b(19|20)\d{2}\b', text)
    if m: result["year"] = m.group(0)
    # Count
    nums = re.findall(r'\b(\d+)\b', text)
    if nums: result["count"] = min(int(nums[0]), 10)
    # Mood
    negations = {"not","no","don't","dont","hate","avoid"}
    found = []
    for mood, kws in MOOD_KEYWORDS.items():
        for kw in kws:
            if kw in text_fixed:
                idx  = text_fixed.find(kw)
                prev = set(text_fixed[max(0,idx-25):idx].split())
                if not prev & negations:
                    found.append((idx, mood))
    if found:
        result["mood"] = sorted(found)[-1][1]
    # Search indicators
    for indicator in ["tell me about","about","what is","search for","find movie"]:
        if indicator in text_fixed:
            idx = text_fixed.find(indicator) + len(indicator)
            q   = text[idx:].strip().rstrip("?.,!")
            if q:
                result["intent"]       = "search"
                result["search_query"] = q
            break
    # Similar
    for pat in [r'like (.+)', r'similar to (.+)', r'same (?:as|vibe as) (.+)']:
        m2 = re.search(pat, text_fixed)
        if m2:
            result["intent"]       = "similar"
            result["search_query"] = m2.group(1).strip()
            break
    return result


# ─── MAIN ENTRY ───────────────────────────────────────────────────────────────

def analyze_message(user_message):
    """Returns (intent_dict, user_message)."""
    result = analyze_with_groq(user_message)
    if result:
        return result, user_message
    return analyze_rule_based(user_message), user_message


# ─── PERSONA RESPONSES ────────────────────────────────────────────────────────

_INTROS = {
    "relaxing":    ["You deserve a break. 🍵 These are perfect for unwinding.",
                    "Long day? Grab a blanket and relax. 😌"],
    "funny":       ["Ready to laugh? 😂 These are certified comedy gold.",
                    "Laughter incoming! 🎭"],
    "happy":       ["Good vibes only! 🌟 These will keep you smiling.",
                    "Love the energy! 😄"],
    "romantic":    ["Love is in the air! ❤️ Perfect for a cozy night.",
                    "Here for the feels! 🌹"],
    "sad":         ["Sending warmth. 🌧️ A good movie helps process feelings.",
                    "It's okay to feel this way. 🫂 Here are some meaningful films."],
    "inspired":    ["Ready to be moved? 💡 These stories stayed with people forever.",
                    "Inspiration incoming! 🔥"],
    "nostalgic":   ["A trip down memory lane. 📼 These classics never get old.",
                    "Nostalgia mode activated. ✨"],
    "dark":        ["Going deep. 🖤 Intense, gritty, unforgettable.",
                    "Not for the faint-hearted. 🌑"],
    "scared":      ["Brave soul! 👻 Don't watch alone...",
                    "You asked for it. 🕯️ Sleep optional."],
    "thrilling":   ["Buckle up. 🕵️ These will keep you guessing.",
                    "Twist after twist. 🌀"],
    "excited":     ["Hold on tight! 🚀 High-octane picks incoming.",
                    "Let's go! ⚡ Adrenaline guaranteed."],
    "adventurous": ["Adventure awaits! 🗺️ Beyond imagination.",
                    "Pack your bags. 🧭 Epic journeys ahead."],
    "bored":       ["Let's fix that! 🎲 Something totally different.",
                    "Boredom? Not anymore. 🎬"],
}

def get_persona_response(mood, language, count, reason=""):
    intro    = random.choice(_INTROS.get(mood, ["Here are some great picks:"]))
    genre    = MOOD_GENRE_LABEL.get(mood, "")
    lang_str = f" in {language}" if language else ""
    empathy  = ""
    if reason:
        r = reason.lower()
        if any(w in r for w in ["office","work","tired","stress","exhausted"]):
            empathy = "Work can be exhausting — you deserve this. "
        elif any(w in r for w in ["sad","alone","lonely","miss"]):
            empathy = "You're not alone. "
    genre_str = f" ({genre})" if genre else ""
    return f"{empathy}{intro} Here are {count}{genre_str} films{lang_str}:"