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

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")

SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1"

CORS(app)

# Connect to MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client.Spotilytics      # Database name
users_collection = db.users    # Collection for storing users and token info

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
    
    # track_attributes = {
    #     "danceability": 0,
    #     "energy": 0,
    #     "acousticness": 0,
    #     "valence": 0,
    #     "instrumentalness": 0,
    #     "loudness": 0,
    #     "speechiness": 0
    # }
    
    # Loop through top tracks
    # for track in top_tracks["items"]:            
    #         # Fetch artist details
    #         track_uri = [track["uri"]]
    #         print(track_uri)
    #         track_details = sp.audio_features(track_uri)

    #         track_attributes["danceability"] += track_details["danceability"]
    #         track_attributes["energy"] += track_details["energy"]
    #         track_attributes["acousticness"] += track_details["acousticness"]
    #         track_attributes["valence"] += track_details["valence"]
    #         track_attributes["instrumentalness"] += track_details["instrumentalness"]
    #         track_attributes["loudness"] += track_details["loudness"]
    #         track_attributes["speechiness"] += track_details["speechiness"]  

    # average_track_attributes = {key: (value / len(top_tracks["items"]) if len(top_tracks["items"]) > 0 else 0) 
    #                         for key, value in track_attributes.items()}


    # # Get the top 50 genres sorted by count
    # top_genres_list = sorted(top_genres.items(), key=lambda x: x[1], reverse=True)[:50]

    return jsonify({
        "topTracks": top_tracks_list,
        "topArtists": top_artists_list,
        "trackPopularity": round(average_track_popularity, 2),  
        "artistPopularity": round(average_artist_popularity, 2),
        # "trackDanceability": round(average_track_attributes["danceability"], 2),
        # "trackEnergy": round(average_track_attributes["energy"], 2),
        # "trackAcousticness": round(average_track_attributes["acousticness"], 2),
        # "trackValence": round(average_track_attributes["valence"], 2),
        # "trackInstrumentalness": round(average_track_attributes["instrumentalness"], 2),
        # "trackLoudness": round(average_track_attributes["loudness"], 2),
        # "trackSpeechiness": round(average_track_attributes["speechiness"], 2)

        #"topGenres": top_genres_list
    })

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
def get_song_lyric_langs():
    # Retrieve song title and artist name from query parameters
    song_title = request.args.get("song_title")
    artist_name = request.args.get("artist_name")

    if not song_title or not artist_name:
        return jsonify({"error": "Both song_title and artist_name parameters are required"}), 400

    # Genius API Base URL and Access Token
    GENIUS_ACCESS_TOKEN = os.getenv("GENIUS_ACCESS_TOKEN")
    BASE_URL = "https://api.genius.com"

    # Function to search for a song by title and artist
    def search_song(song_title, artist_name):
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
    def get_lyrics(song_path):
        song_url = f"https://genius.com{song_path}"
        print(song_url)
        page = requests.get(song_url)
        soup = BeautifulSoup(page.text, 'html.parser')
        lyrics = ""
        # Find the lyrics on the page- NEEDS FIXING
        lyrics_container = soup.find_all('div', attrs={'data-lyrics-container': 'true'})
        for element in lyrics_container:
            lyrics += element.get_text() + "\n"
        class_prefix = "ReferentFragment-desktop-sc"
        lyrics_elements = soup.find_all(class_=re.compile(f"^{class_prefix}")) 
        
        for element in lyrics_elements:
            lyrics += element.get_text() + "\n"

        if lyrics:
            return lyrics
        else:
            return "Lyrics not found."

    try:
        song_path = search_song(song_title, artist_name)
        lyrics = get_lyrics(song_path)
        detected_languages = detect_langs(lyrics)
        detected_languages_json = [{"language": lang.lang, "name": get_language_name(lang.lang), "confidence": lang.prob} for lang in detected_languages]

        return jsonify({"languages": detected_languages_json})
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

if __name__ == "__main__":
    app.run(debug=True)
