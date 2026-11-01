"""FastAPI-server til DDP-planlægning.

Gemmer projekter som JSON-dokumenter i en lokal SQLite-fil og leverer siden fra src/.
Kør: uvicorn server.main:app --reload
"""
import json
import os
import sqlite3
import threading
from pathlib import Path

from fastapi import Body, FastAPI, HTTPException, Path as PathParam
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
ID_PATTERN = r"^[A-Za-z0-9_-]{1,64}$"


def ID():
    return PathParam(pattern=ID_PATTERN)


def deep_merge(target: dict, patch: dict) -> dict:
    """Fletter patch ind i target. Objekter flettes, alt andet (også lister) erstattes."""
    for k, v in patch.items():
        if isinstance(v, dict):
            if not isinstance(target.get(k), dict):
                target[k] = {}
            deep_merge(target[k], v)
        else:
            target[k] = v
    return target


class Store:
    def __init__(self, path: Path):
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.lock = threading.Lock()
        with self.lock, self.conn:
            self.conn.execute("CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT NOT NULL)")
            self.conn.execute("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL)")

    def projects(self) -> dict:
        with self.lock:
            rows = self.conn.execute("SELECT id, data FROM projects").fetchall()
        return {i: json.loads(d) for i, d in rows}

    def put(self, pid: str, data: dict):
        with self.lock, self.conn:
            self.conn.execute("INSERT OR REPLACE INTO projects (id, data) VALUES (?, ?)", (pid, json.dumps(data)))

    def patch(self, pid: str, patch: dict) -> bool:
        with self.lock, self.conn:
            row = self.conn.execute("SELECT data FROM projects WHERE id = ?", (pid,)).fetchone()
            if not row:
                return False
            data = deep_merge(json.loads(row[0]), patch)
            self.conn.execute("UPDATE projects SET data = ? WHERE id = ?", (json.dumps(data), pid))
        return True

    def delete(self, pid: str):
        with self.lock, self.conn:
            self.conn.execute("DELETE FROM projects WHERE id = ?", (pid,))

    def users(self) -> dict:
        with self.lock:
            return dict(self.conn.execute("SELECT id, name FROM users").fetchall())

    def put_user(self, uid: str, name: str):
        with self.lock, self.conn:
            self.conn.execute("INSERT OR REPLACE INTO users (id, name) VALUES (?, ?)", (uid, name))


def create_app(db_path: Path) -> FastAPI:
    store = Store(db_path)
    app = FastAPI(title="DDP-planlægning")

    @app.get("/api/projects")
    def list_projects():
        return store.projects()

    @app.put("/api/projects/{pid}")
    def put_project(pid: str = ID(), data: dict = Body(...)):
        store.put(pid, data)
        return {"ok": True}

    @app.patch("/api/projects/{pid}")
    def patch_project(pid: str = ID(), patch: dict = Body(...)):
        if not store.patch(pid, patch):
            raise HTTPException(404, "Projektet findes ikke")
        return {"ok": True}

    @app.delete("/api/projects/{pid}")
    def delete_project(pid: str = ID()):
        store.delete(pid)
        return {"ok": True}

    @app.get("/api/users")
    def list_users():
        return store.users()

    @app.put("/api/users/{uid}")
    def put_user(uid: str = ID(), body: dict = Body(...)):
        name = str(body.get("name", "")).strip()[:80]
        if not name:
            raise HTTPException(422, "Navn mangler")
        store.put_user(uid, name)
        return {"ok": True}

    app.mount("/", StaticFiles(directory=ROOT / "src", html=True), name="site")
    return app


app = create_app(Path(os.environ.get("DDP_DB", ROOT / "ddp.db")))
