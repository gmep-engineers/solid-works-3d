"""
Tripo3D AI Neural Generative 3D Service for ForgeAI Studio.
Uses the official tripo3d Python SDK (and direct OpenAPI fallback) to synthesize
watertight organic 3D meshes with PBR textures from arbitrary natural language text prompts.
"""

import os
import time
import json
import asyncio
import concurrent.futures
import urllib.request
import urllib.error
import trimesh
from typing import Optional, Dict, Any, Tuple

from database import (
    get_raw_tripo_key,
    get_tripo_config,
    update_tripo_config,
    complete_wallet_task,
    refund_wallet_task
)

try:
    import tripo3d
    from tripo3d import TripoClient, TaskStatus
except ImportError:
    tripo3d = None
    TripoClient = None
    TaskStatus = None


def _run_async(coro):
    """Safely runs an async coroutine from either synchronous or asynchronous contexts."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(asyncio.run, coro).result()
    else:
        return asyncio.run(coro)


class AITextTo3DService:
    """Connects ForgeAI to Tripo3D Neural Generative AI via SDK and REST API."""

    CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tripo_config.json")
    TRIPO_REST_V3_SUBMIT = "https://openapi.tripo3d.ai/v3/generation/text-to-model"
    TRIPO_REST_V3_TASKS = "https://openapi.tripo3d.ai/v3/tasks"

    @classmethod
    def get_api_key(cls, user_key: Optional[str] = None) -> Optional[str]:
        """Retrieves and cleans the Tripo3D API key from user request, database config, environment, or persistent config."""
        if user_key and str(user_key).strip():
            cleaned = str(user_key).strip()
            return cleaned

        # Check database admin configuration first
        try:
            db_key = get_raw_tripo_key()
            if db_key and str(db_key).strip():
                return str(db_key).strip()
        except Exception:
            pass

        key = os.getenv("TRIPO_API_KEY") or os.getenv("TRIPO3D_API_KEY")
        if key and key.strip():
            return key.strip()

        if os.path.exists(cls.CONFIG_FILE):
            try:
                with open(cls.CONFIG_FILE, "r") as f:
                    data = json.load(f)
                    cfg_key = data.get("tripo_api_key")
                    if cfg_key and str(cfg_key).strip():
                        return str(cfg_key).strip()
            except Exception:
                pass
        return None

    @classmethod
    def test_connection(cls, api_key: Optional[str] = None, base_url: Optional[str] = None) -> dict:
        """Pings Tripo3D API to verify key validity and retrieve live account balance."""
        key = cls.get_api_key(api_key)
        if not key:
            return {
                "success": False,
                "error": "No API key provided",
                "message": "Tripo3D API Key is empty. Please enter your API Key (starts with 'tsk_')."
            }
        effective_key = key if key.startswith("tsk_") else f"tsk_{key}"

        async def _ping():
            async with TripoClient(api_key=effective_key, v3_base_url=base_url) as client:
                bal = await client.get_balance()
                return bal

        try:
            bal = _run_async(_ping())
            credits = float(bal.balance) if hasattr(bal, "balance") else 0.0
            frozen = float(bal.frozen) if hasattr(bal, "frozen") else 0.0
            update_tripo_config(balance_credits=credits)
            return {
                "success": True,
                "balance_credits": credits,
                "frozen_credits": frozen,
                "message": f"Successfully connected to Tripo3D! Live balance: {credits:.1f} credits."
            }
        except Exception as e:
            err = str(e)
            if "[2]" in err or "Invalid API key" in err:
                msg = "Tripo3D Authentication Failed: Invalid API key (HTTP 401). Please check credentials on platform.tripo3d.ai."
            else:
                msg = f"Tripo3D Connection Failed: {err}"
            return {
                "success": False,
                "error": err,
                "message": msg
            }

    @classmethod
    def save_api_key(cls, key: str) -> None:
        """Persists the Tripo3D API key to config file and environment."""
        if not key or not str(key).strip():
            return
        cleaned = str(key).strip()
        os.environ["TRIPO_API_KEY"] = cleaned
        try:
            update_tripo_config(api_key=cleaned)
        except Exception:
            pass
        try:
            with open(cls.CONFIG_FILE, "w") as f:
                json.dump({"tripo_api_key": cleaned}, f)
        except Exception:
            pass

    @classmethod
    def is_available(cls, user_key: Optional[str] = None) -> bool:
        """Checks if a Tripo3D API key is configured."""
        key = cls.get_api_key(user_key)
        return bool(key and len(key) > 5)

    @classmethod
    def generate_mesh_from_prompt(
        cls,
        prompt: str,
        api_key: Optional[str] = None,
        target_height_mm: float = 60.0,
        timeout_seconds: int = 75,
        wallet_tx_id: Optional[str] = None
    ) -> Tuple[Optional[trimesh.Trimesh], Optional[str], Optional[str]]:
        """
        Synthesizes an organic 3D mesh using Tripo3D AI.
        Returns: (mesh, model_url_or_info, error_message)
        """
        key = cls.get_api_key(api_key)
        if not key:
            err_msg = "Tripo3D API Key not configured. Please enter your Tripo3D key (starts with 'tsk_') in Forge Studio."
            if wallet_tx_id:
                refund_wallet_task(wallet_tx_id, reason="Tripo3D key not configured")
            return None, None, err_msg

        # Attempt 1: Official tripo3d SDK
        sdk_err = None
        if tripo3d:
            try:
                mesh, url = _run_async(cls._generate_via_sdk(prompt, key, timeout_seconds))
                if mesh is not None:
                    if wallet_tx_id:
                        complete_wallet_task(wallet_tx_id, tripo_task_id=url or "task", tokens_used=10.0)
                    return mesh, url, None
            except Exception as e:
                sdk_err = str(e)
                print(f"[AITextTo3DService] Tripo SDK generation error: {e}, falling back to REST...")

        # Attempt 2: Direct REST OpenAPI v3
        try:
            mesh, url = cls._generate_via_rest(prompt, key, timeout_seconds)
            if mesh is not None:
                if wallet_tx_id:
                    complete_wallet_task(wallet_tx_id, tripo_task_id=url or "task", tokens_used=10.0)
                return mesh, url, None
            err_msg = sdk_err or "Tripo3D task did not complete successfully or returned empty mesh."
            if wallet_tx_id:
                refund_wallet_task(wallet_tx_id, reason=err_msg)
            return None, None, f"Tripo3D Generation Failed: {err_msg}"
        except Exception as e:
            err_msg = str(e)
            if "401" in err_msg:
                final_err = "Tripo3D Authentication Failed: Invalid API key (HTTP 401). Check key at https://platform.tripo3d.ai."
            elif "429" in err_msg:
                final_err = "Tripo3D Rate Limit Reached (HTTP 429): Insufficient balance or too many concurrent tasks."
            else:
                final_err = f"Tripo3D API generation failed: {err_msg}"
            if wallet_tx_id:
                refund_wallet_task(wallet_tx_id, reason=final_err)
            return None, None, final_err

    @classmethod
    async def _generate_via_sdk(cls, prompt: str, api_key: str, timeout_seconds: int) -> Tuple[Optional[trimesh.Trimesh], Optional[str]]:
        """Invokes official tripo3d SDK client."""
        effective_key = api_key if api_key.startswith("tsk_") else f"tsk_{api_key}"
        async with TripoClient(api_key=effective_key) as client:
            task_id = await client.text_to_model(
                prompt=prompt,
                texture=True,
                pbr=True,
                geometry_quality="standard"
            )
            task = await client.wait_for_task(task_id, polling_interval=2.0, timeout=float(timeout_seconds))

            if task.status == TaskStatus.SUCCESS and task.output:
                glb_url = (
                    task.output.model_url
                    or task.output.pbr_model
                    or task.output.model
                    or task.output.base_model
                )
                if glb_url:
                    mesh = cls._load_mesh_from_url(glb_url)
                    return mesh, glb_url
        return None, None

    @classmethod
    def _generate_via_rest(cls, prompt: str, api_key: str, timeout_seconds: int) -> Tuple[Optional[trimesh.Trimesh], Optional[str]]:
        """Submits prompt via REST OpenAPI v3 to Tripo3D."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

        # Submit task
        payload = json.dumps({
            "prompt": prompt,
            "texture": True,
            "pbr": True,
            "model_version": "v2.5-20250123"
        }).encode("utf-8")

        req = urllib.request.Request(cls.TRIPO_REST_V3_SUBMIT, data=payload, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            task_id = data.get("data", {}).get("task_id") or data.get("task_id")

        if not task_id:
            return None, None

        # Poll status
        start_time = time.time()
        glb_url = None
        while time.time() - start_time < timeout_seconds:
            time.sleep(2.5)
            poll_req = urllib.request.Request(f"{cls.TRIPO_REST_V3_TASKS}/{task_id}", headers=headers)
            with urllib.request.urlopen(poll_req, timeout=12) as p_resp:
                p_data = json.loads(p_resp.read().decode("utf-8"))
                res_data = p_data.get("data", {})
                status = res_data.get("status") or p_data.get("status")

                if status == "success" or status == "SUCCEEDED":
                    output = res_data.get("output", {})
                    glb_url = output.get("model_url") or output.get("pbr_model") or output.get("model") or output.get("base_model")
                    break
                elif status in ["failed", "cancelled", "FAILED"]:
                    return None, None

        if not glb_url:
            return None, None

        mesh = cls._load_mesh_from_url(glb_url)
        return mesh, glb_url

    @classmethod
    def _load_mesh_from_url(cls, glb_url: str) -> Optional[trimesh.Trimesh]:
        """Downloads a GLB model from a URL and converts it into a watertight trimesh.Trimesh."""
        req = urllib.request.Request(glb_url, headers={"User-Agent": "ForgeAI-3D-Downloader/1.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            mesh_bytes = resp.read()

        loaded = trimesh.load(trimesh.util.wrap_as_stream(mesh_bytes), file_type="glb")
        if isinstance(loaded, trimesh.Scene):
            # Dump all geometries into a single concatenated watertight mesh
            if len(loaded.geometry) > 0:
                geoms = [g for g in loaded.geometry.values() if isinstance(g, trimesh.Trimesh) and len(g.faces) > 0]
                if geoms:
                    combined = trimesh.util.concatenate(geoms)
                    return combined
            return loaded.dump(concatenate=True)
        elif isinstance(loaded, trimesh.Trimesh):
            return loaded
        return None
