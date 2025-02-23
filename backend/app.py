import os
import time
from flask import Flask, redirect, request, jsonify, url_for
from dotenv import load_dotenv
import requests
from pymongo import MongoClient
from spotipy import Spotify
from spotipy.oauth2 import SpotifyOAuth
from flask_cors import CORS

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
    scope="user-read-private user-read-email",
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
    print("user_id: ", user_id)
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

if __name__ == "__main__":
    app.run(debug=True)
