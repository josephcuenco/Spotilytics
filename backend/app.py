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
from multiprocessing import Manager

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")

SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1"

CORS(app)

# Connect to MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["Spotilytics"]      # Database name
collection = db["users"]    # Collection for storing users and token info

sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIFY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIFY_REDIRECT_URI"),
    scope="user-read-private user-read-email user-top-read playlist-read-private playlist-read-collaborative",
    show_dialog=True
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
    token_info = sp_oauth.get_access_token(code)

    # Use the access token to fetch the current user's Spotify ID
    sp = Spotify(auth=token_info["access_token"])
    user_data = sp.current_user()
    user_id = user_data["id"]

    # Store token info in MongoDB, keyed by Spotify user_id
    collection.update_one(
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
    user = collection.find_one({"user_id": user_id})
    if not user:
        return None

    # Check if the access token has expired, and refresh if needed
    if time.time() > user["expires_at"]:
        new_token_info = sp_oauth.refresh_access_token(user["refresh_token"])
        collection.update_one(
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
    

@app.route("/user-top")
def get_user_top_data():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id parameter is required"}), 400

    # get time range from button, default to long term
    time_range = request.args.get("time_range", "long_term") 
    
    if time_range not in ["short_term", "medium_term", "long_term"]:
        return jsonify({"error": "invalid time range"}), 400
    
    sp = get_spotify_client(user_id)

    # Check if data already exists in MongoDB for caching
    # existing_data = collection.find_one({"user_id": user_id, "time_range": time_range})
    # if existing_data:
    #     existing_data["_id"] = str(existing_data["_id"])  # Convert ObjectId to string
    #     return jsonify(existing_data)

    # Fetch top tracks
    top_tracks = sp.current_user_top_tracks(limit=50, time_range=time_range)
    top_tracks_list = [{"name": track["name"], 
                        "artist": track["artists"][0]["name"], 
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

    # Store data in MongoDB
    # inserted_doc = collection.insert_one(data_to_store)
    # data_to_store["_id"] = str(inserted_doc.inserted_id)  # Convert ObjectId to string before returning

    
    return jsonify(data_to_store)

@app.route("/user-playlists")
def get_user_playlists():
    user_id = request.args.get("user_id")
    sp = get_spotify_client(user_id) 

    playlists_data = sp.current_user_playlists()
    playlists = [
        {
            "name": p["name"],
            "image": p["images"][0]["url"] if p["images"] else None,
            "id": p["id"],
            "tracks_total": p["tracks"]["total"],
            "url": p["external_urls"]["spotify"]
        }
        for p in playlists_data["items"]
    ]
    return jsonify(playlists)

@app.route("/song-lyrics")
def get_song_lyric_lang_data():
    # Retrieve time range from query parameters
    time_range = request.args.get("time_range")

    if not time_range:
        return jsonify({"error": "Time Range parameter is required"}), 400

    try:
        avg_lang_confidences= get_top_songs_language_distribution(time_range)

        return jsonify({"languages": dict(avg_lang_confidences)})

    except ValueError as e:
        # Catch specific errors like song not found
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        # Catch general errors
        print(f"Error: {str(e)}")  # Log to console
        return jsonify({"error": "Failed to fetch lyrics", "details": str(e)}), 500


def get_language_name(lang_code):
    try:
        return Locale(lang_code).english_name
    except:
        return "Error Determining Language Name"
    
    
def process_track(track, lyrics_cache):
    try:
        key = (track["name"].lower(), track["artist"].lower())
        if key in lyrics_cache:
            lyrics = lyrics_cache[key]
        else:
            song_path = search_song(track["name"], track["artist"])
            lyrics = get_lyrics1(track["name"], track["artist"])
            if not lyrics:
                lyrics = get_lyrics2(song_path)
            lyrics_cache[key] = lyrics  # cache it

        detected = detect_langs(lyrics)
        return [(lang.lang, round(lang.prob, 2)) for lang in detected]
    except Exception:
        return []

def get_top_songs_language_distribution(time_range):
    # parse through top songs from mongoDB and get the languages 
    data = collection.find({"time_range": time_range})

    lang_confidences = defaultdict(list)
    seen_tracks = set()
    lyrics_cache = {}

    def wrapped_process(track):
        key = (track["name"].lower(), track["artist"].lower())
        if key in seen_tracks:
            return []
        seen_tracks.add(key)
        return process_track(track, lyrics_cache)
    
    length = 0
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for doc in data:
            for track in doc.get("topTracks", []):
                futures.append(executor.submit(wrapped_process, track))

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
    return avg_confidences_names

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


if __name__ == "__main__":
    app.run(debug=True)
