from collections import defaultdict
import os
import time
from flask import Flask, redirect, request, jsonify, url_for
from dotenv import load_dotenv
import requests
from pymongo import MongoClient
from spotipy import Spotify
from spotipy.oauth2 import SpotifyOAuth
from flask_cors import CORS
from bs4 import BeautifulSoup
import re
from langdetect import detect_langs
from babel import Locale
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
from better_profanity import profanity
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from wordcloud import WordCloud
from io import BytesIO
import base64
import random
from lexicalrichness import LexicalRichness

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")

SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1"

CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Connect to MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["Spotilytics"]      # Database name
top_songs_collection = db["userTopSongData"]   
lyrics_collection = db["lyrics"]
users_collection = db["users"]
playlist_collection = db["playlists"]

sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIFY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIFY_REDIRECT_URI"),
    scope="user-read-private user-read-email user-top-read playlist-read-private playlist-read-collaborative",
    show_dialog=True,
    cache_path=None,
    cache_handler=None
)

@app.route('/')
def home():
    # redirect to Spotify auth 
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@app.route("/login")
def login():
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@app.route("/callback")
def callback():
    # after login with Spotify, redirect to the dashboard with the user_id as a query parameter
    # get the code from the query parameter
    code = request.args.get("code")
    if not code:
        return "Error: Authorization failed", 400

    # Retrieve token info using the provided code
    token_info = sp_oauth.get_access_token(code, check_cache=False)

    # Use the access token to fetch the current user's Spotify ID
    sp = Spotify(auth=token_info["access_token"])
    user_data = sp.current_user()
    user_id = user_data["id"]

    # Store token info in MongoDB, keyed by Spotify user_id
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "access_token": token_info["access_token"],
            "refresh_token": token_info["refresh_token"],
            "expires_at": token_info["expires_at"]
        }},
        upsert=True
    )
    # Redirect to your React dashboard with the user_id as a query parameter
    return redirect("http://localhost:3000/dashboard?user_id=" + user_id)

def get_spotify_client(user_id):
    #Retrieve an authenticated Spotify client using token info from MongoDB
    user = users_collection.find_one({"user_id": user_id})
    if not user:
        return None

    # Check if the access token has expired, and refresh if needed
    if time.time() > user["expires_at"]:
        new_token_info = sp_oauth.refresh_access_token(user["refresh_token"])
        users_collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "access_token": new_token_info["access_token"],
                "expires_at": new_token_info["expires_at"]
            }}
        )
        access_token = new_token_info["access_token"]
    else:
        access_token = user["access_token"]

    return Spotify(auth=access_token)

@app.route("/user")
def get_user_profile():
    # Retrieve userid from query parameter
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id parameter is required"}), 400

    sp = get_spotify_client(user_id)
    if not sp:
        return jsonify({"error": "User not authenticated"}), 401

    try:
        user_data = sp.current_user()
        return jsonify(user_data)
    except Exception as e:
        return jsonify({"error": "Failed to fetch user data", "details": str(e)}), 403
    

@app.route("/store-user-top-data")
def store_user_top_data():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id parameter is required"}), 400

    # # get time range from button, default to long term
    time_range = request.args.get("time_range") 

    sp = get_spotify_client(user_id)

    # Fetch top tracks
    top_tracks = sp.current_user_top_tracks(limit=50, time_range=time_range)
    top_tracks_list = [{"name": track["name"], 
                        "artist": track["artists"][0]["name"],
                        "lyrics": None, 
                        # "languageDistribution": None,
                        "sentiment": None,
                        "lexicalRichness": {
                            "mtld": None,
                            "hdd": None,
                            "mattr": None
                        },
                        "profanity": {
                        "profane_word_count": None,
                        "profanity_ratio": None,
                        },
                        "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None} 
                    for track in top_tracks["items"]]

    # Fetch top artists
    top_artists = sp.current_user_top_artists(limit=50, time_range=time_range)
    top_artists_list = [{"name": artist["name"],
                        "image": artist["images"][0]["url"] if artist["images"] else None} 
                        for artist in top_artists["items"]]

    # Compute average track popularity
    track_popularities = [track["popularity"] for track in top_tracks["items"]]
    average_track_popularity = sum(track_popularities) / len(track_popularities) if track_popularities else 0

    artist_popularities = [artist["popularity"] for artist in top_artists["items"]]
    average_artist_popularity = sum(artist_popularities) / len(artist_popularities) if artist_popularities else 0

    data_to_store = {
        "user_id": user_id,
        "time_range": time_range,
        "topTracks": top_tracks_list,
        "topArtists": top_artists_list,
        "trackPopularity": round(average_track_popularity, 2),
        "artistPopularity": round(average_artist_popularity, 2)
    }

    top_songs_collection.update_one(
    {"user_id": user_id, "time_range": time_range},
    {"$set": data_to_store},
    upsert=True
    )

    return jsonify(data_to_store)

@app.route("/get-user-top-data")
def get_user_top_data():
    user_id = request.args.get("user_id")
    time_range = request.args.get("time_range")
    
    data = top_songs_collection.find_one({"user_id": user_id, "time_range": time_range})
    if not data:
        return jsonify({"error": "User not found"}), 404

    data["_id"] = str(data["_id"])  # Convert ObjectId to string
    return jsonify(data)


@app.route("/user-playlists")
def get_user_playlists():
    user_id = request.args.get("user_id")
    sp = get_spotify_client(user_id) 

    playlists_data = sp.current_user_playlists()
    playlists = []

    for p in playlists_data["items"]:
        playlist_id = p["id"]
        # Fetch tracks from the playlist
        tracks_response = sp.playlist_tracks(playlist_id, limit=50) 
        tracks = [
            {
                "name": t["track"]["name"],
                "artist": t["track"]["artists"][0]["name"],
                "lyrics": None
            }
            for t in tracks_response["items"] if t.get("track")  # handle null cases
        ]

        data_to_store = {
            "name": p["name"],
            "image": p["images"][0]["url"] if p["images"] else None,
            "id": p["id"],
            "tracks_total": p["tracks"]["total"],
            "url": p["external_urls"]["spotify"],
            "tracks_preview": tracks,
            "languageDistribution": None
        }

        playlists.append(data_to_store)

        playlist_collection.update_one(
        {"id": p["id"]},
        {"$set": data_to_store},
        upsert=True
        )
        
    return jsonify({"playlists": playlists})

@app.route("/get_playlist_language_distribution")
def get_playlist_language_distribution():
    # parse through top songs from mongoDB and get the languages 
    pId = request.args.get("playlist_id")
    data = playlist_collection.find({"id": pId})

    lang_confidences = defaultdict(list)
    
    length = 0
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = []
        for doc in data:
            for track in doc.get("tracks_preview", []):
                futures.append(executor.submit(process_track, track))

        for future in as_completed(futures):
            for lang, conf in future.result():
                lang_confidences[lang].append(conf)
                length += 1

    # Average confidence
    avg_confidences = {
        lang: round(sum(scores) / length, 4)
        for lang, scores in lang_confidences.items()
    }

    avg_confidences_names = {
        get_language_name(lang): round(conf * 100, 4)
        for lang, conf in avg_confidences.items()
    }
    return jsonify({"languages": avg_confidences_names})


def get_language_name(lang_code):
    try:
        return Locale(lang_code).english_name
    except:
        return "Error Determining Language Name"
    

@app.route("/get-lyrics")
def get_lyrics():
    name = request.args.get("name")
    artist = request.args.get("artist")

    if not name or not artist:
        return jsonify({"error": "Missing song_name or artist_name"}), 400

    # Check if lyrics already exist
    existing = lyrics_collection.find_one({
        "name": name,
        "artist": artist
    })

    if existing and "lyrics" in existing:
        existing["_id"] = str(existing["_id"])  # Convert ObjectId to string
        return jsonify(existing)

    # Fetch lyrics if not in DB
    song_path = search_song(name, artist)
    lyrics = get_lyrics1(name, artist)
    if not lyrics:
        lyrics = get_lyrics2(song_path)

    # Store in DB
    lyrics_collection.insert_one({
        "name": name,
        "artist": artist,
        "lyrics": lyrics
    })

    return jsonify({"lyrics": lyrics})


def process_track(track):
    try:
        # Check MongoDB
        result = lyrics_collection.find_one({
            "name": track["name"],
            "artist": track["artist"]
        })

        if result and "lyrics" in result:
            lyrics = result["lyrics"]
        else:
            song_path = search_song(track["name"], track["artist"])
            lyrics = get_lyrics1(track["name"], track["artist"])
            if not lyrics:
                lyrics = get_lyrics2(song_path)

            # Save to MongoDB
            lyrics_collection.insert_one({
                "name": track["name"],
                "artist": track["artist"],
                "lyrics": lyrics
            })
        detected = detect_langs(lyrics)
        return [(lang.lang, round(lang.prob, 2)) for lang in detected]

    except Exception as e:
        print(f"Error processing {track['name']} by {track['artist']}: {e}")
        return []


@app.route("/get_top_songs_language_distribution")
def get_top_songs_language_distribution():
    # parse through top songs from mongoDB and get the languages 
    time_range = request.args.get("time_range")
    user_id = request.args.get("user_id")
    data = top_songs_collection.find({"time_range": time_range, "user_id": user_id})

    lang_confidences = defaultdict(list)
    
    length = 0
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = []
        for doc in data:
            for track in doc.get("topTracks", []):
                futures.append(executor.submit(process_track, track))

        for future in as_completed(futures):
            for lang, conf in future.result():
                lang_confidences[lang].append(conf)
                length += 1

    # Average confidence
    avg_confidences = {
        lang: round(sum(scores) / length, 4)
        for lang, scores in lang_confidences.items()
    }

    avg_confidences_names = {
        get_language_name(lang): round(conf * 100, 4)
        for lang, conf in avg_confidences.items()
    }
    return jsonify({"languages": avg_confidences_names})


def get_lyrics1(track, artist):
    url = f"https://api.lyrics.ovh/v1/{artist}/{track}"
    response = requests.get(url)
    if response.status_code == 200:
        lyrics = response.json().get("lyrics")
        if lyrics is not None:
            lyrics = lyrics.replace('\n\n','\n')
    else:
        lyrics = None  # Lyrics not found
    return lyrics

# Function to search for a song by title and artist
def search_song(song_title, artist_name):
    # Genius API Base URL and Access Token
    GENIUS_ACCESS_TOKEN = os.getenv("GENIUS_ACCESS_TOKEN")
    BASE_URL = "https://api.genius.com"
    search_url = f"{BASE_URL}/search"

    params = {'q': f'{song_title} {artist_name}'}
    headers = {'Authorization': f'Bearer {GENIUS_ACCESS_TOKEN}'}

    response = requests.get(search_url, params=params, headers=headers)
    json_data = response.json()

     # Check if we got results from the API
    if json_data['response']['hits']:
        song_path = json_data['response']['hits'][0]['result']['path']
        return song_path
    else:
        raise ValueError("Song not found in Genius database")

# Function to get lyrics from the song URL
def get_lyrics2(song_path):
    song_url = f"https://genius.com{song_path}"
    print(song_url)
    page = requests.get(song_url)
    soup = BeautifulSoup(page.text, 'html.parser')
    lyrics = ""

    lyrics_containers = soup.find_all('div', attrs={'data-lyrics-container': 'true'})
    if lyrics_containers:
        for element in lyrics_containers:
            lyrics += element.get_text(separator="\n").strip() + "\n"

    clean = clean_lyrics(lyrics)

    if clean:
        return clean
    else:
        return "Lyrics not found."

def clean_lyrics(raw_lyrics):
    # Remove everything before the first section header ([Intro], [Verse], etc.)
    lyrics_start = re.search(r"\[[^\]]+\]", raw_lyrics)
    if lyrics_start:
        raw_lyrics = raw_lyrics[lyrics_start.start():]

    # Remove section headers like [Chorus], [Verse 1]
    cleaned = re.sub(r"\[.*?\]", "", raw_lyrics)

    #Remove excess newlines and whitespace
    cleaned = re.sub(r"\n{2,}", "\n", cleaned).strip()

    return cleaned

from better_profanity import profanity

@app.route("/get-top-songs-profanity")
def get_top_songs_profanity():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    profanity_results = {
        "short_term": [],
        "medium_term": [],
        "long_term": []
    }

    def compute_profanity_for_range(time_range):
        results = []
        term_data = top_songs_collection.find({"time_range": time_range, "user_id": user_id})

        for doc in term_data:
            for track in doc.get("topTracks", []):
                match = lyrics_collection.find_one({
                    "name": track["name"],
                    "artist": track["artist"]
                })

                lyrics = match.get("lyrics") if match else None
                if not lyrics or not isinstance(lyrics, str):
                    continue

                try:
                    profanity.load_censor_words()
                    # Count number of profane words
                    words = lyrics.split()
                    profane_count = sum(1 for word in words if profanity.contains_profanity(word))
                    total_words = len(words)

                    result = {
                        "name": track.get("name", "Unknown"),
                        "artist": track.get("artist", "Unknown"),
                        "profane_word_count": profane_count,
                        "profanity_ratio": round(profane_count / total_words, 3) if total_words > 0 else 0,
                    }

                    results.append(result)
                except Exception as e:
                    print(f"Error processing track '{track.get('name')}':", e)
                    continue

        return results

    try:
        profanity_results["short_term"] = compute_profanity_for_range("short_term")
        profanity_results["medium_term"] = compute_profanity_for_range("medium_term")
        profanity_results["long_term"] = compute_profanity_for_range("long_term")

        return jsonify(profanity_results)
    except Exception as e:
        print("Error in /get-top-songs-profanity:", e)
        return jsonify({"error": str(e)}), 500

      

@app.route("/get-sentiment")
def get_sentiment():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    sid = SentimentIntensityAnalyzer()

    sentiment = {
        "short_term": [],
        "medium_term": [],
        "long_term": []
    }
    def analyze_sentiment_for_range(time_range):
        results = []
        term_data = top_songs_collection.find({"time_range": time_range, "user_id": user_id})
        for doc in term_data:
            for track in doc.get("topTracks", []):
                match = lyrics_collection.find_one({
                    "name": track["name"],
                    "artist": track["artist"]
                })
                if  match:
                    lyrics = match.get("lyrics")
                else:
                    lyrics = None
                
                if not lyrics or not isinstance(lyrics, str):
                    continue
                ss = sid.polarity_scores(lyrics)
                results.append({
                    "name": track.get("name", "Unknown"),
                    "sentiment": ss,
                    "artist": track.get("artist", "Unknown")
                })
        return results

    try:
        sentiment["short_term"] = analyze_sentiment_for_range("short_term")

        sentiment["medium_term"] = analyze_sentiment_for_range("medium_term")

        sentiment["long_term"] = analyze_sentiment_for_range("long_term")

        return jsonify(sentiment)
    except Exception as e:
        print("Error in /get-sentiment:", e)
        return jsonify({"error": str(e)}), 500
    

@app.route("/get-wordclouds")
def get_wordclouds():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    wordclouds = {
        "short_term": None,
        "medium_term": None,
        "long_term": None
    }
    COLORS = ['#1DB954', '#FFFFFF' ]

    def random_color(word, font_size, position, orientation, font_path, random_state):
        return random.choice(COLORS)


    def generate_wordcloud_base64(text):
        wc = WordCloud(width=800, height=400, background_color='black', color_func=random_color).generate(text)
        buffer = BytesIO()
        wc.to_image().save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    def create_wordcloud_for_range(time_range):
        all_lyrics = []
        term_data = top_songs_collection.find({"time_range": time_range, "user_id": user_id})
        for doc in term_data:
            for track in doc.get("topTracks", []):
                match = lyrics_collection.find_one({
                    "name": track["name"],
                    "artist": track["artist"]
                })
                if match and isinstance(match.get("lyrics"), str):
                    all_lyrics.append(match["lyrics"])
        
        if not all_lyrics:
            return None
        
        full_text = " ".join(all_lyrics)
        return generate_wordcloud_base64(full_text)

    try:
        wordclouds["short_term"] = create_wordcloud_for_range("short_term")
        wordclouds["medium_term"] = create_wordcloud_for_range("medium_term")
        wordclouds["long_term"] = create_wordcloud_for_range("long_term")

        return jsonify(wordclouds)
    except Exception as e:
        print("Error in /get-wordclouds:", e)
        return jsonify({"error": str(e)}), 500
    

@app.route("/get-top-songs-lex-richness")
def get_top_songs_lex_richness():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    richness = {
        "short_term": [],
        "medium_term": [],
        "long_term": []
    }

    def compute_lexical_for_range(time_range):
        results = []
        term_data = top_songs_collection.find({"time_range": time_range, "user_id": user_id})

        for doc in term_data:
            for track in doc.get("topTracks", []):
                match = lyrics_collection.find_one({
                    "name": track["name"],
                    "artist": track["artist"]
                })

                lyrics = match.get("lyrics") if match else None

                if not lyrics or not isinstance(lyrics, str):
                    continue

                try:
                    lex = LexicalRichness(lyrics)
                    word_count = lex.words
                    safe_window = min(500, word_count if word_count >= 50 else 50)

                    result = {
                        "name": track.get("name", "Unknown"),
                        "artist": track.get("artist", "Unknown"),
                        "mtld": round(lex.mtld(), 2) if lex.mtld() else None,
                        "hdd": lex.hdd(draws=42),
                        "mattr": lex.mattr(window_size=safe_window) if word_count >= safe_window else None
                    }

                    results.append(result)
                except ZeroDivisionError:
                    continue  # skip too-short lyrics
        return results

    try:
        richness["short_term"] = compute_lexical_for_range("short_term")
        richness["medium_term"] = compute_lexical_for_range("medium_term")
        richness["long_term"] = compute_lexical_for_range("long_term")

        return jsonify(richness)
    except Exception as e:
        print("Error in /get-lexical-richness:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
