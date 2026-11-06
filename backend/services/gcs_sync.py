"""
Google Cloud Storage Persistence & Synchronization Service for TitanForge 3D.
Ensures the SQLite database and CAD assets are persisted to gs://hephillu3d-data.
"""

import os
import time
import threading
import logging

logger = logging.getLogger("gcs_sync")
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME", "hephillu3d-data")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "app.db")
GCS_DB_OBJECT = "app.db"

_client = None
_sync_thread = None
_stop_event = threading.Event()
_last_synced_mtime = 0.0

def get_storage_client():
    global _client
    if _client is None:
        try:
            from google.cloud import storage
            _client = storage.Client()
        except Exception as e:
            logger.warning(f"[GCS] Cloud Storage client not initialized (running locally?): {e}")
            return None
    return _client

def download_database_from_gcs() -> bool:
    """Restores app.db from Google Cloud Storage on container startup."""
    client = get_storage_client()
    if not client:
        return False
    try:
        bucket = client.bucket(BUCKET_NAME)
        blob = bucket.blob(GCS_DB_OBJECT)
        if blob.exists():
            logger.info(f"[GCS] Restoring database from gs://{BUCKET_NAME}/{GCS_DB_OBJECT}...")
            # Download to a temporary file first then atomically replace
            tmp_db = DB_PATH + ".tmp"
            blob.download_to_filename(tmp_db)
            if os.path.exists(tmp_db) and os.path.getsize(tmp_db) > 0:
                if os.path.exists(DB_PATH):
                    os.remove(DB_PATH)
                os.rename(tmp_db, DB_PATH)
                global _last_synced_mtime
                _last_synced_mtime = os.path.getmtime(DB_PATH)
                logger.info("[GCS] Database successfully restored from persistent storage.")
                return True
        else:
            logger.info(f"[GCS] No existing database in gs://{BUCKET_NAME}/{GCS_DB_OBJECT}. Initializing fresh.")
    except Exception as e:
        logger.error(f"[GCS] Error downloading database: {e}")
    return False

def upload_database_to_gcs() -> bool:
    """Uploads local app.db to Google Cloud Storage."""
    client = get_storage_client()
    if not client or not os.path.exists(DB_PATH):
        return False
    try:
        current_mtime = os.path.getmtime(DB_PATH)
        bucket = client.bucket(BUCKET_NAME)
        blob = bucket.blob(GCS_DB_OBJECT)
        blob.upload_from_filename(DB_PATH)
        global _last_synced_mtime
        _last_synced_mtime = current_mtime
        logger.info(f"[GCS] Synced app.db ({os.path.getsize(DB_PATH)} bytes) to gs://{BUCKET_NAME}/{GCS_DB_OBJECT}")
        return True
    except Exception as e:
        logger.error(f"[GCS] Error uploading database: {e}")
        return False

def _background_worker(interval_seconds: int = 30):
    global _last_synced_mtime
    logger.info(f"[GCS] Background persistence worker started (interval: {interval_seconds}s).")
    while not _stop_event.is_set():
        time.sleep(interval_seconds)
        if os.path.exists(DB_PATH):
            try:
                current_mtime = os.path.getmtime(DB_PATH)
                if current_mtime > _last_synced_mtime:
                    upload_database_to_gcs()
            except Exception as e:
                logger.warning(f"[GCS] Sync loop check error: {e}")

def start_persistence_sync():
    """Initializes GCS persistence and starts background auto-sync."""
    download_database_from_gcs()
    global _sync_thread
    if _sync_thread is None or not _sync_thread.is_alive():
        _stop_event.clear()
        _sync_thread = threading.Thread(target=_background_worker, daemon=True)
        _sync_thread.start()

def stop_persistence_sync():
    """Flushes final database state to GCS upon container shutdown."""
    logger.info("[GCS] Container shutdown triggered. Flushing database to GCS...")
    _stop_event.set()
    upload_database_to_gcs()

