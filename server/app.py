# server/app.py
import os
import secrets
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

# Import updated functions
from tmdb_client import (
    search_movie, discover_movies, get_extended_details, 
    detect_mood, detect_language, get_watch_providers, detect_count,
    get_trailer_key, get_recommendations, extract_year
)

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

app = Flask(__name__)
CORS(app)

basedir = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(basedir, 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True) 

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'filmobot.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-key')
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
mail = Mail(app)

# --- MODELS ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    profile_image = db.Column(db.String(120), default=None)
    reset_token = db.Column(db.String(100), nullable=True)
    token_expiry = db.Column(db.DateTime, nullable=True)
    
    # MEMORY CONTEXT
    last_mood = db.Column(db.String(50), nullable=True)
    last_language = db.Column(db.String(10), nullable=True)
    last_page = db.Column(db.Integer, default=1) # <--- NEW: Pagination Memory

class Watchlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    movie_id = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    poster_url = db.Column(db.String(500))
    overview = db.Column(db.Text)
    imdb_rating = db.Column(db.String(10))
    director = db.Column(db.String(100))
    duration = db.Column(db.String(50))
    cast = db.Column(db.String(500))
    where_to_watch = db.Column(db.String(500))
    trailer_key = db.Column(db.String(50))
    added_on = db.Column(db.DateTime, default=datetime.utcnow)
# --- ROUTES ---

@app.route('/')
def home(): return "FilmoBot API Running"

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    file = request.files.get('profileImage')

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400
    
    filename = None
    if file:
        filename = secure_filename(file.filename)
        filename = f"{datetime.now().timestamp()}_{filename}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, email=email, password_hash=hashed_password, profile_image=filename)
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully!"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(identity=str(user.id))
        image_url = f"http://localhost:5000/uploads/{user.profile_image}" if user.profile_image else None
        return jsonify({
            "access_token": access_token, 
            "username": user.username,
            "email": user.email, 
            "profile_image": image_url 
        }), 200
    return jsonify({"message": "Invalid credentials"}), 401


# In server/app.py

# --- NEW HELPER FOR HUMAN-LIKE REPLIES ---
def get_persona_response(mood, lang_name, count):
    """Generates a friendly, empathetic response based on mood."""
    
    # 1. Empathetic Intros
    intros = {
        "happy": ["That's awesome! Let's keep the good vibes rolling. 😎", "Glad to hear that! Here are some movies to match your energy."],
        "sad": ["I'm sorry you're feeling down. 🌧️ Sometimes a good movie helps let it all out.", "Sending you a virtual hug. 🫂 Here are some touching movies for you."],
        "excited": ["Love the energy! 🚀 Let's get your adrenaline pumping with these picks.", "Let's go! Here are some high-octane movies for you."],
        "scared": ["Ooh, brave choice! 👻 Don't watch these alone...", "Turning off the lights? Here are some spooky picks."],
        "relaxing": ["It sounds like you've had a long day. 😴 Let's help you unwind.", "Time to kick back and chill. 🍵 Here are some feel-good movies."],
        "funny": ["Ready to laugh? 😂 I've picked some hilarious ones for you.", "Laughter is the best medicine! Check these out."],
        "romantic": ["Love is in the air! ❤️ Here are some romantic picks.", "Aww, perfect for a date night (or a self-love night!)."],
        "thrilling": ["On the edge of your seat? 🕵️‍♀️ Let's solve some mysteries.", "Get ready for some twists and turns!"],
        "bored": ["Let's cure that boredom with something totally different. 🎲", "I've got just the thing to spark your interest."]
    }

    # Select Intro
    intro = random.choice(intros.get(mood, ["Here are some great movies for you."]))
    
    # Add Language Context
    lang_str = f" in {lang_name}" if lang_name else ""
    
    return f"{intro} Here are {count} highly-rated movies{lang_str}:"

# server/app.py

@app.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    
    data = request.get_json()
    user_input = data.get('message', '').strip()
    
    # 0. SPECIAL HANDLERS
    
    # Handle "More Like This"
    if user_input.startswith("recommend_id:"):
        ref_movie_id = user_input.split(":")[1]
        results = get_recommendations(ref_movie_id, mood=user.last_mood)
        bot_response = f"Here are some similar movies:"
        return process_and_return(results, bot_response, 5, sort=False)

    # Handle Greetings
    greetings = ["hi", "hello", "hey", "hola"]
    if user_input.lower() in greetings:
        return jsonify({"bot_response": "Hello! I'm FilmoBot. 🎬 Tell me what you're in the mood for.", "movies": []})

    # Handle Reset
    if "reset" in user_input.lower() or "clear" in user_input.lower():
        user.last_mood = None
        user.last_language = None
        user.last_page = 1
        db.session.commit()
        return jsonify({"bot_response": "Memory wiped! 🧹 What do you want to watch?", "movies": []})

    # 1. ANALYZE INPUT
    new_mood = detect_mood(user_input)
    new_code, new_lang_name = detect_language(user_input)
    year = extract_year(user_input)
    count = detect_count(user_input)
    
    # Keywords that imply the user wants a LIST of recommendations
    discovery_keywords = ["suggest", "recommend", "show", "movie", "film", "best", "top", "find", "want", "more", "page"]
    
    # Check if user input implies Discovery
    has_discovery_keywords = any(word in user_input.lower() for word in discovery_keywords)
    wants_more = any(w in user_input.lower() for w in ["more", "next", "page"])
    
    # 2. DETERMINE INTENT (The Fix)
    # We only use Discovery Mode if the user EXPLICITLY asks for a genre, language, year, or uses keywords.
    # Otherwise, we assume they typed a specific Movie Title.
    year_wants_discovery = year and has_discovery_keywords

    is_discovery_intent = (new_mood or new_code or year_wants_discovery or wants_more or has_discovery_keywords)
    # 3. UPDATE MEMORY (Only if it's a discovery request)
    if is_discovery_intent:
        if new_mood or new_code or year:
            user.last_page = 1 # Reset page on new topic
            if new_mood: user.last_mood = new_mood
            if new_code: user.last_language = new_code
        elif wants_more:
            user.last_page = (user.last_page or 1) + 1
        db.session.commit()

    # 4. EXECUTE LOGIC
    results = []
    bot_response = ""

    if is_discovery_intent:
        # --- DISCOVERY MODE (Uses Memory) ---
        final_mood = user.last_mood
        final_lang = user.last_language
        current_page = user.last_page
        
        print(f"🔍 DISCOVER: Mood={final_mood}, Lang={final_lang}, Year={year}, Page={current_page}")
        results = discover_movies(mood=final_mood, language_code=final_lang, year=year, page=current_page)
        
        if not results and current_page > 1:
            return jsonify({"bot_response": "That's all the movies I could find for this category!", "movies": []})
            
        # Personalized Response
        mood_str = final_mood if final_mood else "popular"
        bot_response = get_persona_response(final_mood, final_lang, count) if final_mood else f"Here are {count} {mood_str} movies:"

    else:
        # --- SEARCH MODE (Specific Title) ---
        # Ignore memory, search exactly what the user typed
        print(f"🔎 SEARCH: '{user_input}'")
        user.last_mood = None 
        db.session.commit()
        results = search_movie(user_input)
        bot_response = f"Here are the top results for '{user_input}':"

        # Fallback: If search fails, but we have memory, offer a suggestion
        if not results and (user.last_mood or user.last_language):
            bot_response = f"I couldn't find a movie named '{user_input}'. But based on your preferences, here are some recommendations:"
            results = discover_movies(mood=user.last_mood, language_code=user.last_language)

    if not results:
        return jsonify({"bot_response": "I couldn't find anything matching that.", "movies": []})

    # For specific search, show exactly what was found (usually 1 or 2 relevant matches)
    # For discovery, show the requested count
    limit = 5 if not is_discovery_intent else count
    
    return process_and_return(results, bot_response, limit, sort=True)

def process_and_return(results, bot_response, count, sort=True):
    """
    Helper to fetch details and format response.
    sort=True  -> Sorts movies by Rating (Default behavior).
    sort=False -> Keeps original order (Good for 'Similar' movies).
    """
    candidate_movies = []
    
    # Optimization: If not sorting, we only need to fetch details for 'count' movies.
    # If sorting, we fetch 10 to find the best rated ones, then pick top 'count'.
    limit = 10 if sort else count 
    
    for movie in results[:limit]: 
        title = movie.get('title')
        year = movie.get('release_date', '')[:4]
        details = get_extended_details(title, year)
        
        candidate_movies.append({
            "id": movie.get('id'),
            "title": title,
            "overview": movie.get('overview'),
            "poster_path": movie.get('poster_path'),
            "tmdb_rating": movie.get('vote_average'),
            "imdb_rating": details['imdb_rating'],
            "cast": details['cast'],
            "director": details['director'],
            "duration": details['duration'],
        })

    # --- ONLY SORT IF REQUESTED ---
    if sort:
        candidate_movies.sort(key=lambda m: float(m['imdb_rating']) if m['imdb_rating'] != 'N/A' else m['tmdb_rating'] or 0, reverse=True)
    
    final_movies = []
    for movie in candidate_movies[:count]:
        movie['where_to_watch'] = get_watch_providers(movie['id'], movie['title'])
        movie['trailer_key'] = get_trailer_key(movie['id'])
        final_movies.append(movie)

    return jsonify({"bot_response": bot_response, "movies": final_movies})
@app.route('/add-watchlist', methods=['POST'])
@jwt_required()
def add_watchlist():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('movie_id') or not data.get('title'):
        return jsonify({"message": "Missing movie data"}), 400
        
    existing_entry = Watchlist.query.filter_by(user_id=int(current_user_id), movie_id=str(data['movie_id'])).first()
    if existing_entry:
        return jsonify({"message": "Movie already in watchlist"}), 409
        
    new_entry = Watchlist(
        user_id=int(current_user_id), 
        movie_id=str(data['movie_id']), 
        title=data['title'],
        poster_url=data.get('poster_path'), 
        overview=data.get('overview', 'No overview available'),
        imdb_rating=data.get('imdb_rating', 'N/A'), 
        director=data.get('director', 'N/A'),
        duration=data.get('duration', 'N/A'), 
        cast=data.get('cast', 'N/A'),
        where_to_watch=data.get('where_to_watch', 'N/A'),
        trailer_key=data.get('trailer_key', None) 
    )
    
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Movie added to watchlist!"}), 201

# 3. Update '/watchlist' to SEND the key back to frontend
@app.route('/watchlist', methods=['GET'])
@jwt_required()
def get_watchlist():
    current_user_id = get_jwt_identity()
    saved_movies = Watchlist.query.filter_by(user_id=int(current_user_id)).all()
    output = []
    for movie in saved_movies:
        output.append({
            "id": movie.id, 
            "movie_id": movie.movie_id, 
            "title": movie.title,
            "poster_path": movie.poster_url, 
            "overview": movie.overview,
            "imdb_rating": movie.imdb_rating, 
            "director": movie.director,
            "duration": movie.duration, 
            "cast": movie.cast, 
            "where_to_watch": movie.where_to_watch,
            "trailer_key": movie.trailer_key 
        })
    return jsonify(output), 200

@app.route('/watchlist/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_watchlist(entry_id):
    current_user_id = get_jwt_identity()
    entry = Watchlist.query.filter_by(id=entry_id, user_id=int(current_user_id)).first()
    if not entry: return jsonify({"message": "Entry not found"}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Movie removed"}), 200

@app.route('/request-reset', methods=['POST'])
def request_reset():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    if not user: return jsonify({"message": "If email exists, OTP sent."}), 200
    otp = str(random.randint(100000, 999999))
    user.reset_token = otp
    user.token_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.session.commit()
    try:
        msg = Message("FilmoBot Password Reset", recipients=[email])
        msg.body = f"Your OTP is: {otp}\nExpires in 10 mins."
        mail.send(msg)
        return jsonify({"message": "OTP sent"}), 200
    except: return jsonify({"message": "Error sending email"}), 500

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')
    user = User.query.filter_by(email=email).first()
    if not user or user.reset_token != otp or user.token_expiry < datetime.utcnow():
        return jsonify({"message": "Invalid OTP"}), 400
    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    user.reset_token = None
    user.token_expiry = None
    db.session.commit()
    return jsonify({"message": "Password updated"}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)