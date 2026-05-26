# 🎬 FilmoBot

An AI-powered movie recommendation chatbot that understands your mood, language, and context to suggest the perfect film — every time.

---

## ✨ Features

- **Mood Detection** — Describe how you feel in plain language ("I'm exhausted after work") and FilmoBot picks the right genre automatically
- **Smart Typo Search** — Finds movies even with misspellings (`usthad hotal` → *Ustad Hotel*, `shawshnk redemptn` → *The Shawshank Redemption*)
- **Multi-language Support** — Tamil, Hindi, English, Korean, Malayalam, Telugu, and 15+ more
- **Actor & Director Search** — "Vijay top movies" or "Nolan films" returns ranked filmographies
- **Song → Movie** — Know a song but not the movie? Just type the song name
- **Similar Movies** — "Movies like Interstellar" triggers a recommendation engine
- **Watchlist** — Save favourites and revisit them anytime
- **Chat History** — Sessions are synced to the cloud and persist across devices
- **Trailer Playback** — Watch YouTube trailers inline without leaving the app
- **Streaming Info** — Shows where to watch each film (Netflix, Prime, etc.)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| Backend | Python, Flask |
| AI / NLP | Groq API (LLaMA 3.1 8B) |
| Movie Data | TMDB API |
| Extended Metadata | OMDb API |
| Auth | JWT (Flask-JWT-Extended) |
| Email | Flask-Mail + Gmail SMTP |
| Contact Form | EmailJS |
| Database | SQLite (via Flask-SQLAlchemy) |
| Password Security | Flask-Bcrypt |

---

## 📁 Project Structure

```
filmobot/
├── client/                  # React frontend
│   └── src/
│       ├── App.jsx           # Routing and global state
│       ├── ChatPage.jsx      # Main chat interface
│       ├── MovieCard.jsx     # Movie card with trailer, watchlist toggle
│       ├── Sidebar.jsx       # Navigation + chat history
│       ├── WatchlistPage.jsx
│       ├── ProfilePage.jsx
│       ├── SettingsPage.jsx
│       ├── AboutPage.jsx
│       ├── ContactPage.jsx
│       ├── Login.jsx
│       ├── Signup.jsx
│       ├── ForgotPassword.jsx
│       ├── Splash.jsx
│       ├── Welcome.jsx
│       ├── theme.js          # Design tokens (colors, fonts, shared styles)
│       └── config.js         # API base URL
│
└── server/                  # Flask backend
    ├── app.py                # Main app, all routes
    ├── ai_processor.py       # Groq integration + rule-based fallback
    ├── tmdb_client.py        # TMDB API helpers, mood/genre mapping
    ├── tmdb_retry.py         # Retry logic for TMDB calls
    └── movie_search.py       # Smart fuzzy + phonetic movie/person search
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- API keys for: [TMDB](https://www.themoviedb.org/settings/api), [OMDb](https://www.omdbapi.com/apikey.aspx), [Groq](https://console.groq.com)
- A Gmail account for password reset emails
- An [EmailJS](https://www.emailjs.com/) account for the contact form

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/filmobot.git
cd filmobot
```

### 2. Backend setup

```bash
cd server
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
TMDB_API_KEY=your_tmdb_key
OMDB_API_KEY=your_omdb_key
GROQ_API_KEY=your_groq_key
SECRET_KEY=any_long_random_string
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_gmail_app_password
```

> **Gmail app password:** Go to Google Account → Security → 2-Step Verification → App Passwords.

Start the server:

```bash
python app.py
```

The API runs on `http://localhost:5000`.

---

### 3. Frontend setup

```bash
cd client
npm install
```

Create `client/.env`:

```env
REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key
```

Start the dev server:

```bash
npm start
```

The app runs on `http://localhost:3000`.

---

## 💬 Example Queries

| What you type | What FilmoBot does |
|---|---|
| `I'm tired after a long day at office` | Detects **relaxing** mood → suggests feel-good comedies |
| `Tamil romantic movies 2023` | Discovers Tamil romance films from 2023 |
| `usthad hotal` | Fuzzy-matches to **Ustad Hotel** |
| `vijay top movies` | Returns Vijay's top-rated filmography |
| `movies like Interstellar` | Fetches TMDB recommendations for Interstellar |
| `I want something scary` | Detects **horror** mood |

---

## ⚙️ Settings

Users can configure the following from the Settings page (persisted to `localStorage`):

- **Default language** — pre-filters recommendations to a preferred language
- **Movies per response** — 3, 5, 7, or 10
- **Notification preferences** — new releases, trending digest
- **Chat history** — toggle saving, or clear all sessions

---

## 🔐 Authentication

- JWT tokens are issued on login and stored in `localStorage`
- Password reset uses a 6-digit OTP sent via Gmail SMTP, valid for 10 minutes
- Profile images are uploaded to the server's `static/uploads/` folder

---

## 🧠 How the AI Works

1. **Groq LLaMA 3.1 8B** parses the user message into a structured JSON intent (mood, language, year, count, query type, etc.)
2. If Groq is unavailable, a **rule-based fallback** handles typo correction, mood keyword matching, and regex extraction
3. The intent drives one of five search paths: `discover`, `search`, `similar`, `person_search`, or `song_search`
4. Results are fetched from TMDB, enriched with IMDb ratings and cast from OMDb, then sorted by rating before being returned

---

## 📜 License

MIT — free to use, modify, and distribute.

---

## 🙌 Acknowledgements

- [TMDB](https://www.themoviedb.org/) for the movie database
- [OMDb API](https://www.omdbapi.com/) for IMDb ratings and cast data
- [Groq](https://groq.com/) for fast LLM inference
- [EmailJS](https://www.emailjs.com/) for the client-side contact form
