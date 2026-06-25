import firebase_admin
from firebase_admin import credentials, firestore
import os

# To use this in reality, you must have a serviceAccountKey.json 
# or use default credentials if running on GCP.
_db = None

def init_firebase():
    global _db
    if not firebase_admin._apps:
        try:
            # Look for a local service account key for local dev
            if os.path.exists("serviceAccountKey.json"):
                cred = credentials.Certificate("serviceAccountKey.json")
                firebase_admin.initialize_app(cred)
            else:
                # Default init (relies on GOOGLE_APPLICATION_CREDENTIALS)
                firebase_admin.initialize_app()
            _db = firestore.client()
            print("Firebase initialized successfully.")
        except Exception as e:
            print(f"Warning: Firebase initialization failed: {e}. Running with mock DB.")

def get_db():
    if _db is None:
        init_firebase()
    return _db
