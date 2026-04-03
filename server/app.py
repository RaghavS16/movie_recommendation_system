# server/app.py
import os
import json
import random
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_mail import Mail, Message
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from tmdb_client import (
    search_movie, discover_movies, get_extended_details,
    get_watch_providers, get_trailer_key, get_recommendations,
    LANGUAGE_MAP, MOOD_GENRE_LABEL,
)
from ai_processor import analyze_message, get_persona_response
from movie_search import (
    smart_movie_search, did_you_mean,
    get_movies_by_actor, get_movies_by_director, find_movie_by_song,
)

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

app = Flask(__name__)
CORS(app)

basedir     = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(basedir, 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['SQLALCHEMY_DATABASE_URI']    = 'sqlite:///' + os.path.join(basedir, 'filmobot.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY']             = os.getenv('SECRET_KEY', 'default-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES']   = False
app.config['MAIL_SERVER']                = 'smtp.gmail.com'
app.config['MAIL_PORT']                  = 587
app.config['MAIL_USE_TLS']               = True
app.config['MAIL_USERNAME']              = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD']              = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER']        = ('FilmoBot', os.getenv('MAIL_USERNAME'))
app.config['UPLOAD_FOLDER']             = UPLOAD_FOLDER

db     = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt    = JWTManager(app)
mail   = Mail(app)

# ─── MODELS ───────────────────────────────────────────────────────────────────

class User(db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80),  unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    profile_image = db.Column(db.String(120), default=None)
    reset_token   = db.Column(db.String(100), nullable=True)
    token_expiry  = db.Column(db.DateTime,    nullable=True)
    last_mood     = db.Column(db.String(50),  nullable=True)
    last_language = db.Column(db.String(10),  nullable=True)
    last_page     = db.Column(db.Integer,     default=1)

class Watchlist(db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    movie_id      = db.Column(db.String(20),  nullable=False)
    title         = db.Column(db.String(200), nullable=False)
    poster_url    = db.Column(db.String(500))
    overview      = db.Column(db.Text)
    imdb_rating   = db.Column(db.String(10))
    director      = db.Column(db.String(100))
    duration      = db.Column(db.String(50))
    cast          = db.Column(db.String(500))
    where_to_watch= db.Column(db.String(500))
    trailer_key   = db.Column(db.String(50))
    added_on      = db.Column(db.DateTime, default=datetime.utcnow)

class ChatSession(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_id = db.Column(db.String(50),  nullable=False)
    title      = db.Column(db.String(100), nullable=False)
    messages   = db.Column(db.Text,        nullable=False)
    updated_at = db.Column(db.DateTime,    default=datetime.utcnow)

# ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

@app.route('/')
def home():
    return "FilmoBot API Running"

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('username')
    email    = request.form.get('email')
    password = request.form.get('password')
    file     = request.files.get('profileImage')

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400

    filename = None
    if file:
        filename = f"{datetime.now().timestamp()}_{secure_filename(file.filename)}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    new_user = User(
        username=username, email=email,
        password_hash=bcrypt.generate_password_hash(password).decode('utf-8'),
        profile_image=filename,
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully!"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        token     = create_access_token(identity=str(user.id))
        image_url = f"http://localhost:5000/uploads/{user.profile_image}" if user.profile_image else None
        return jsonify({
            "access_token":  token,
            "username":      user.username,
            "email":         user.email,
            "profile_image": image_url,
        }), 200
    return jsonify({"message": "Invalid credentials"}), 401

# ─── CHAT ─────────────────────────────────────────────────────────────────────

# server/chat_route_v2.py
# Replace the entire @app.route('/chat') function in app.py with this.
#
# Top of app.py imports must include:
#   from tmdb_client import (
#       search_movie, discover_movies, get_extended_details,
#       get_watch_providers, get_trailer_key, get_recommendations,
#       LANGUAGE_MAP, MOOD_GENRE_LABEL
#   )
#   from ai_processor import analyze_message, get_persona_response
#   from movie_search import (
#       smart_movie_search, did_you_mean,
#       get_movies_by_actor, get_movies_by_director, find_movie_by_song
#   )

@app.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))

    data       = request.get_json()
    user_input = data.get('message', '').strip()
    if not user_input:
        return jsonify({"bot_response": "Please type something!", "movies": []})

    # ── 0. HARD-CODED SPECIAL COMMANDS ────────────────────────────────────────

    if user_input.startswith("recommend_id:"):
        ref_id  = user_input.split(":")[1]
        results = get_recommendations(ref_id, mood=user.last_mood)
        return process_and_return(results, "Movies you'll love:", 5, sort=False)

    if user_input.lower().strip("!?.") in {"hi","hello","hey","hola","sup","yo","howdy"}:
        return jsonify({
            "bot_response": (
                "Hey! I'm FilmoBot 🎬 — tell me:\n"
                "• How you feel: \"I'm tired after work, suggest something chill\"\n"
                "• A movie name: \"Tell me about Mersal\"\n"
                "• Actor/Director: \"Vijay top movies\" or \"Shankar films\"\n"
                "• A song: \"I know song Aura 10/10, which movie?\"\n"
                "• Similar films: \"Movies like Interstellar\""
            ),
            "movies": []
        })

    if any(w in user_input.lower() for w in ["reset","clear","start over","forget"]):
        user.last_mood = user.last_language = None
        user.last_page = 1
        db.session.commit()
        return jsonify({"bot_response": "Memory cleared! 🧹 What would you like to watch?", "movies": []})

    # ── 1. ANALYSE ────────────────────────────────────────────────────────────

    analysis, raw_input = analyze_message(user_input)

    intent       = analysis.get("intent", "discover")
    mood         = analysis.get("mood")
    language     = analysis.get("language")
    year         = analysis.get("year")
    # Frontend settings override AI count (user's preferred movie count)
    try:
        frontend_count = int(data.get('count') or 0)
    except (TypeError, ValueError):
        frontend_count = 0
    ai_count = int(analysis.get('count') or 5)
    count    = max(1, min(frontend_count if frontend_count > 0 else ai_count, 10))
    print(f"COUNT: frontend={frontend_count}, ai={ai_count}, final={count}")
    search_query = (analysis.get("search_query") or "").strip()
    person_query = (analysis.get("person_query") or "").strip()
    song_query   = (analysis.get("song_query")   or "").strip()
    reason       = analysis.get("reason", "")

    lang_code  = LANGUAGE_MAP.get(language) if language else None
    wants_more = any(w in user_input.lower() for w in ["more","next","show more","another","page"])

    # ── 2. UPDATE MEMORY ──────────────────────────────────────────────────────
    # Rule: any new context (mood/language/year) = FULL RESET of old context.
    # "More/next" = same context, next page.
    # Actor/Director/Song searches wipe mood context so they don't bleed.

    if intent in ("discover", "similar"):
        if wants_more and not (mood or lang_code or year):
            # Pure "show more" — same context, next page only
            user.last_page = (user.last_page or 1) + 1
        elif mood or lang_code or year:
            # New context — reset everything
            user.last_mood     = mood
            user.last_language = lang_code
            user.last_page     = 1
        db.session.commit()

    # Read back from DB (reflects the update above)
    final_mood = user.last_mood
    final_lang = user.last_language
    final_page = user.last_page or 1

    results      = []
    bot_response = ""

    # ── 3. EXECUTE INTENT ─────────────────────────────────────────────────────

    # ── ACTOR / PERSON — text reply only, no movie cards ────────────────────
    if intent == "person_search" and person_query:
        movies, real_name = get_movies_by_actor(person_query, limit=count)
        role = "actor"
        if not movies:
            movies, real_name = get_movies_by_director(person_query, limit=count)
            role = "director"
        if movies:
            label = "Top movies featuring" if role == "actor" else "Best films directed by"
            lines = [f"🎬 **{label} {real_name}:**\n"]
            for i, m in enumerate(movies, 1):
                year  = (m.get('release_date') or '')[:4]
                year_str = f" ({year})" if year else ""
                rating = m.get('vote_average', '')
                rating_str = f" ⭐ {rating:.1f}" if rating else ""
                lines.append(f"{i}. **{m.get('title','?')}**{year_str}{rating_str}")
            user.last_mood = user.last_language = None
            db.session.commit()
            return jsonify({"bot_response": "\n".join(lines), "movies": []})
        else:
            return jsonify({
                "bot_response": (
                    f"Couldn't find **'{person_query}'** in the database.\n"
                    "Try their full name, e.g. 'Thalapathy Vijay' or 'S. Shankar'."
                ),
                "movies": []
            })

    # ── SONG SEARCH — text reply only, no movie cards ───────────────────────
    elif intent == "song_search" and song_query:
        results = find_movie_by_song(song_query, limit=5)
        user.last_mood = user.last_language = None
        db.session.commit()
        if results:
            lines = [f"🎵 The song **\"{song_query}\"** is likely from one of these films:\n"]
            for i, m in enumerate(results, 1):
                year = (m.get('release_date') or '')[:4]
                year_str = f" ({year})" if year else ""
                rating = m.get('vote_average', '')
                rating_str = f" ⭐ {rating:.1f}" if rating else ""
                lines.append(f"{i}. **{m.get('title','?')}**{year_str}{rating_str}")
            lines.append("\nSearch any of these titles for full details!")
            return jsonify({"bot_response": "\n".join(lines), "movies": []})
        else:
            fallback = smart_movie_search(song_query, limit=3)
            if fallback:
                lines = [f"🎵 Couldn't find exact match for **\"{song_query}\"**, but these might be it:\n"]
                for i, m in enumerate(fallback, 1):
                    year = (m.get('release_date') or '')[:4]
                    lines.append(f"{i}. **{m.get('title','?')}** ({year})")
                return jsonify({"bot_response": "\n".join(lines), "movies": []})
            return jsonify({
                "bot_response": (
                    f"Couldn't match **\"{song_query}\"** to a movie.\n"
                    "Try adding the artist name or more words from the song!"
                ),
                "movies": []
            })

    # ── SPECIFIC MOVIE ────────────────────────────────────────────────────────
    elif intent == "search":
        query   = search_query or raw_input
        results = smart_movie_search(query, limit=5)
        if results:
            hint         = did_you_mean(query, results)
            top_title    = results[0].get('title', query)
            bot_response = hint if hint else f"Here's what I found for **{top_title}**:"
        else:
            return jsonify({
                "bot_response": (
                    f"Couldn't find **'{query}'**. 🤔\n"
                    "Check the spelling, or describe the movie's story and I'll find it!"
                ),
                "movies": []
            })

    # ── SIMILAR ───────────────────────────────────────────────────────────────
    elif intent == "similar":
        query = search_query or raw_input
        ref   = smart_movie_search(query, limit=1)
        if ref:
            ref_title    = ref[0].get('title', query)
            results      = get_recommendations(ref[0]['id'], mood=final_mood)
            hint         = did_you_mean(query, ref)
            bot_response = f"{hint}\n🎬 Similar to **{ref_title}**:" if hint else f"🎬 Similar to **{ref_title}**:"
        else:
            results      = discover_movies(mood=final_mood, language_code=final_lang)
            bot_response = f"Couldn't find '{query}', but here are picks based on your taste:"

    # ── DISCOVER ──────────────────────────────────────────────────────────────
    else:
        results = discover_movies(
            mood=final_mood,
            language_code=final_lang,
            year=year,
            page=final_page,
        )
        if not results and final_page > 1:
            user.last_page = 1
            db.session.commit()
            results      = discover_movies(mood=final_mood, language_code=final_lang, year=year, page=1)
            bot_response = "Reached the end! Starting from the top 🔄"
        else:
            if final_mood:
                bot_response = get_persona_response(final_mood, language, count, reason)
            else:
                lang_str     = f" {language}" if language else ""
                year_str     = f" from {year}" if year else ""
                bot_response = f"Here are {count} top-rated{lang_str} films{year_str}:"

    # ── 4. RETURN ─────────────────────────────────────────────────────────────

    if not results:
        lang_hint = f" in {language}" if language else ""
        year_hint = f" from {year}" if year else ""
        mood_hint = f" with a {final_mood} vibe" if final_mood else ""
        return jsonify({
            "bot_response": (
                f"No movies found{mood_hint}{lang_hint}{year_hint}. 🤔\n\n"
                "Try relaxing the filters — e.g. remove the year, or try a different language."
            ),
            "movies": []
        })

    preserve_order = intent in ("person_search","song_search","similar")
    return process_and_return(results, bot_response, count, sort=not preserve_order)

def process_and_return(results, bot_response, count, sort=True):
    limit = 10 if sort else count
    candidate_movies = []

    for movie in results[:limit]:
        title   = movie.get('title')
        year    = movie.get('release_date', '')[:4]
        details = get_extended_details(title, year)
        candidate_movies.append({
            "id":          movie.get('id'),
            "title":       title,
            "overview":    movie.get('overview'),
            "poster_path": movie.get('poster_path'),
            "tmdb_rating": movie.get('vote_average'),
            "imdb_rating": details['imdb_rating'],
            "cast":        details['cast'],
            "director":    details['director'],
            "duration":    details['duration'],
        })

    if sort:
        candidate_movies.sort(
            key=lambda m: float(m['imdb_rating']) if m['imdb_rating'] != 'N/A' else (m['tmdb_rating'] or 0),
            reverse=True,
        )

    final_movies = []
    for movie in candidate_movies[:count]:
        movie['where_to_watch'] = get_watch_providers(movie['id'], movie['title'])
        movie['trailer_key']    = get_trailer_key(movie['id'])
        final_movies.append(movie)

    return jsonify({"bot_response": bot_response, "movies": final_movies})

# ─── WATCHLIST ROUTES ─────────────────────────────────────────────────────────

@app.route('/add-watchlist', methods=['POST'])
@jwt_required()
def add_watchlist():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    if not data.get('movie_id') or not data.get('title'):
        return jsonify({"message": "Missing movie data"}), 400
    if Watchlist.query.filter_by(user_id=int(current_user_id), movie_id=str(data['movie_id'])).first():
        return jsonify({"message": "Movie already in watchlist"}), 409
    db.session.add(Watchlist(
        user_id=int(current_user_id), movie_id=str(data['movie_id']),
        title=data['title'], poster_url=data.get('poster_path'),
        overview=data.get('overview',''), imdb_rating=data.get('imdb_rating','N/A'),
        director=data.get('director','N/A'), duration=data.get('duration','N/A'),
        cast=data.get('cast','N/A'), where_to_watch=data.get('where_to_watch','N/A'),
        trailer_key=data.get('trailer_key'),
    ))
    db.session.commit()
    return jsonify({"message": "Movie added to watchlist!"}), 201

@app.route('/watchlist', methods=['GET'])
@jwt_required()
def get_watchlist():
    current_user_id = get_jwt_identity()
    movies = Watchlist.query.filter_by(user_id=int(current_user_id)).all()
    return jsonify([{
        "id": m.id, "movie_id": m.movie_id, "title": m.title,
        "poster_path": m.poster_url, "overview": m.overview,
        "imdb_rating": m.imdb_rating, "director": m.director,
        "duration": m.duration, "cast": m.cast,
        "where_to_watch": m.where_to_watch, "trailer_key": m.trailer_key,
    } for m in movies]), 200

@app.route('/watchlist/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_watchlist(entry_id):
    current_user_id = get_jwt_identity()
    entry = Watchlist.query.filter_by(id=entry_id, user_id=int(current_user_id)).first()
    if not entry:
        return jsonify({"message": "Entry not found"}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Movie removed"}), 200

# ─── PASSWORD RESET ───────────────────────────────────────────────────────────

@app.route('/request-reset', methods=['POST'])
def request_reset():
    data  = request.get_json()
    email = data.get('email')
    user  = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "If email exists, OTP sent."}), 200
    otp = str(random.randint(100000, 999999))
    user.reset_token  = otp
    user.token_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.session.commit()
    try:
        msg = Message("FilmoBot Password Reset", recipients=[email])
        msg.body = f"Your OTP is: {otp}\nExpires in 10 mins."
        mail.send(msg)
        return jsonify({"message": "OTP sent"}), 200
    except:
        return jsonify({"message": "Error sending email"}), 500

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data         = request.get_json()
    email        = data.get('email')
    otp          = data.get('otp')
    new_password = data.get('new_password')
    user         = User.query.filter_by(email=email).first()
    if not user or user.reset_token != otp or user.token_expiry < datetime.utcnow():
        return jsonify({"message": "Invalid OTP"}), 400
    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    user.reset_token   = None
    user.token_expiry  = None
    db.session.commit()
    return jsonify({"message": "Password updated"}), 200

# ─── PROFILE ──────────────────────────────────────────────────────────────────

@app.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user     = db.session.get(User, int(current_user_id))
    username = request.form.get('username')
    email    = request.form.get('email')
    if username: user.username = username
    if email:    user.email    = email
    file = request.files.get('profileImage')
    if file:
        filename        = f"{datetime.now().timestamp()}_{secure_filename(file.filename)}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        user.profile_image = filename
    db.session.commit()
    image_url = f"http://localhost:5000/uploads/{user.profile_image}" if user.profile_image else None
    return jsonify({
        "message": "Profile updated!", "username": user.username,
        "email": user.email, "profile_image": image_url,
    }), 200

# ─── CHAT SESSIONS ────────────────────────────────────────────────────────────

@app.route('/sync-session', methods=['POST'])
@jwt_required()
def sync_session():
    current_user_id = get_jwt_identity()
    data       = request.get_json()
    session_id = str(data.get('id'))
    title      = data.get('title')
    messages   = json.dumps(data.get('messages', []))
    session    = ChatSession.query.filter_by(user_id=int(current_user_id), session_id=session_id).first()
    if session:
        session.messages   = messages
        session.updated_at = datetime.utcnow()
    else:
        db.session.add(ChatSession(
            user_id=int(current_user_id), session_id=session_id,
            title=title, messages=messages,
        ))
    db.session.commit()
    return jsonify({"message": "Session synced"}), 200

@app.route('/get-sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    current_user_id = get_jwt_identity()
    sessions = ChatSession.query.filter_by(user_id=int(current_user_id)).order_by(ChatSession.updated_at.desc()).all()
    return jsonify([{
        "id":       int(s.session_id),
        "title":    s.title,
        "messages": json.loads(s.messages),
    } for s in sessions]), 200

@app.route('/delete-session/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_cloud_session(session_id):
    current_user_id = get_jwt_identity()
    session = ChatSession.query.filter_by(user_id=int(current_user_id), session_id=str(session_id)).first()
    if session:
        db.session.delete(session)
        db.session.commit()
    return jsonify({"message": "Deleted"}), 200

# ─── RUN ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)