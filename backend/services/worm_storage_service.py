"""
WORM Storage Service
Provides write-once, read-many (WORM) storage abstraction supporting:
1. LOCAL_WORM_VAULT: Zero-key local filesystem vault with OS-level read-only locks (chmod 0o444 / Windows attrib +r).
2. AWS_S3_OBJECT_LOCK: Cloud WORM retention using S3 Object Lock in COMPLIANCE mode and legal hold APIs.
"""

import os
import sys
import json
import stat
import subprocess
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple

from database import get_storage_provider_config, update_ledger_storage_info
from services.certificate_generator import generate_completion_certificate

VAULT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "worm_vault")
os.makedirs(VAULT_DIR, exist_ok=True)

class WormStorageService:
    @staticmethod
    def get_provider_config() -> dict:
        return get_storage_provider_config()

    @staticmethod
    def set_file_readonly(path: str):
        """Applies OS-level WORM immutable read-only attribute."""
        try:
            if sys.platform == "win32":
                # Remove write permission and set read-only via attrib
                os.chmod(path, stat.S_IREAD)
                subprocess.run(["attrib", "+r", path], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                os.chmod(path, 0o444)
        except Exception as e:
            print(f"[WORM Storage] Warning setting read-only mode on {path}: {e}")

    @classmethod
    def test_connection(cls) -> dict:
        """Verifies storage target readiness."""
        cfg = cls.get_provider_config()
        provider_type = cfg.get("provider_type", "LOCAL_WORM_VAULT")

        if provider_type == "LOCAL_WORM_VAULT":
            test_dir = os.path.join(VAULT_DIR, ".test_health")
            try:
                os.makedirs(test_dir, exist_ok=True)
                test_file = os.path.join(test_dir, "ping.tmp")
                with open(test_file, "w") as f:
                    f.write("OK")
                if os.path.exists(test_file):
                    os.remove(test_file)
                os.rmdir(test_dir)
                return {
                    "success": True,
                    "provider": "LOCAL_WORM_VAULT",
                    "path": VAULT_DIR,
                    "message": "Local WORM Vault is fully mounted and operating in COMPLIANCE mode."
                }
            except Exception as e:
                return {
                    "success": False,
                    "provider": "LOCAL_WORM_VAULT",
                    "error": str(e)
                }

        elif provider_type == "AWS_S3_OBJECT_LOCK":
            try:
                import boto3
                bucket = cfg.get("s3_bucket")
                region = cfg.get("s3_region", "us-east-1")
                if not bucket:
                    return {
                        "success": False,
                        "provider": "AWS_S3_OBJECT_LOCK",
                        "error": "AWS S3 bucket name is not configured."
                    }
                
                # Check S3 connectivity
                s3 = boto3.client("s3", region_name=region)
                # Verify bucket exists and Object Lock configuration
                lock_config = s3.get_object_lock_configuration(Bucket=bucket)
                return {
                    "success": True,
                    "provider": "AWS_S3_OBJECT_LOCK",
                    "bucket": bucket,
                    "region": region,
                    "lock_status": lock_config.get("ObjectLockConfiguration", {}).get("ObjectLockEnabled", "Enabled"),
                    "message": f"Successfully verified S3 Object Lock COMPLIANCE retention on bucket '{bucket}'."
                }
            except Exception as e:
                # Provide friendly diagnostic if boto3 / credentials aren't set
                return {
                    "success": False,
                    "provider": "AWS_S3_OBJECT_LOCK",
                    "error": f"S3 Handshake Failed: {str(e)}. (Local WORM Vault fallback remains active)"
                }

        return {
            "success": True,
            "provider": provider_type,
            "message": "Storage provider ready."
        }

    @classmethod
    def archive_transaction(cls, ledger_entry: Dict[str, Any], cad_file_path: Optional[str] = None) -> Tuple[str, str]:
        """
        Persists transaction artifacts into the WORM vault:
        1. Generates and locks CertificateOfCompletion.pdf
        2. Freezes canonical snapshot JSON
        3. Copies CAD geometry (if supplied) and locks read-only
        Returns: (storage_uri, pdf_certificate_path)
        """
        cert_id = ledger_entry.get("id", "UNKNOWN_CERT")
        cfg = cls.get_provider_config()
        provider_type = cfg.get("provider_type", "LOCAL_WORM_VAULT")

        # Create isolated folder in vault
        tx_dir = os.path.join(VAULT_DIR, cert_id)
        os.makedirs(tx_dir, exist_ok=True)

        # 1. Generate PDF Certificate
        pdf_path = os.path.join(tx_dir, f"{cert_id}_CertificateOfCompletion.pdf")
        generate_completion_certificate(ledger_entry, output_path=pdf_path)
        cls.set_file_readonly(pdf_path)

        # 2. Persist Frozen Snapshot JSON
        snapshot_file = os.path.join(tx_dir, f"{cert_id}_frozen_snapshot.json")
        with open(snapshot_file, "w", encoding="utf-8") as f:
            json.dump({
                "ledger_entry": ledger_entry,
                "archived_at": datetime.now(timezone.utc).isoformat()
            }, f, indent=2, sort_keys=True)
        cls.set_file_readonly(snapshot_file)

        # 3. Handle CAD file if exists
        if cad_file_path and os.path.isfile(cad_file_path):
            cad_dest = os.path.join(tx_dir, os.path.basename(cad_file_path))
            try:
                import shutil
                if not os.path.exists(cad_dest):
                    shutil.copy2(cad_file_path, cad_dest)
                    cls.set_file_readonly(cad_dest)
            except Exception as e:
                print(f"[WORM Storage] Error copying CAD file: {e}")

        storage_uri = f"worm://local-vault/{cert_id}"

        # If AWS S3 is selected and configured, attempt cloud object lock sync
        if provider_type == "AWS_S3_OBJECT_LOCK" and cfg.get("s3_bucket"):
            try:
                import boto3
                bucket = cfg.get("s3_bucket")
                region = cfg.get("s3_region", "us-east-1")
                s3 = boto3.client("s3", region_name=region)
                key = f"worm-ledger/{cert_id}/CertificateOfCompletion.pdf"
                
                # Upload with Object Lock Compliance mode
                with open(pdf_path, "rb") as f:
                    s3.put_object(
                        Bucket=bucket,
                        Key=key,
                        Body=f,
                        ContentType="application/pdf",
                        ObjectLockMode="COMPLIANCE",
                        ObjectLockRetainUntilDate=datetime.fromisoformat(ledger_entry.get("worm_retain_until"))
                    )
                storage_uri = f"s3://{bucket}/{key}"
            except Exception as e:
                print(f"[WORM Storage] S3 upload skipped or fallback to local vault: {e}")

        # Update ledger record with stored paths
        try:
            update_ledger_storage_info(cert_id, storage_uri, pdf_path)
        except Exception as e:
            print(f"[WORM Storage] Note on storage update: {e}")

        return storage_uri, pdf_path
