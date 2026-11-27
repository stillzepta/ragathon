"""SQLite run results, progress events, and approval decisions."""

import json
import sqlite3
import time
from contextlib import contextmanager


class RunStore:
    def __init__(self, path: str):
        self.path = path
        with self.connection() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY, created REAL NOT NULL,
                    status TEXT NOT NULL, result TEXT
                );
                CREATE TABLE IF NOT EXISTS events (
                    seq INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
                    body TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS events_run_id ON events(run_id, seq);
            """)

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=5)
        db.execute("PRAGMA foreign_keys = ON")
        db.execute("PRAGMA secure_delete = ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    @staticmethod
    def add_event(db, run_id, body):
        db.execute("INSERT INTO events(run_id, body) VALUES (?, ?)", (run_id, json.dumps(body)))

    def create(self, run_id):
        with self.connection() as db:
            db.execute("INSERT INTO runs VALUES (?, ?, 'queued', NULL)", (run_id, time.time()))
            self.add_event(db, run_id, {"status": "queued"})

    def event(self, run_id, body):
        with self.connection() as db:
            if body["status"] == "running":
                db.execute("UPDATE runs SET status = 'running' WHERE id = ? AND status = 'queued'", (run_id,))
            self.add_event(db, run_id, body)

    def finish(self, run_id, status, result=None):
        with self.connection() as db:
            db.execute("UPDATE runs SET status = ?, result = ? WHERE id = ?", (status, json.dumps(result), run_id))
            self.add_event(db, run_id, {"status": status})

    def recover(self):
        with self.connection() as db:
            for (run_id,) in db.execute("SELECT id FROM runs WHERE status IN ('queued', 'running')").fetchall():
                db.execute("UPDATE runs SET status = 'failed' WHERE id = ?", (run_id,))
                self.add_event(db, run_id, {"status": "failed"})

    def prune(self, age_seconds):
        with self.connection() as db:
            db.execute("DELETE FROM runs WHERE created < ? AND status IN ('completed', 'failed')", (time.time() - age_seconds,))

    def get(self, run_id):
        with self.connection() as db:
            row = db.execute("SELECT status, result FROM runs WHERE id = ?", (run_id,)).fetchone()
        return {"status": row[0], "result": json.loads(row[1]) if row[1] else None} if row else None

    def events(self, run_id, after):
        with self.connection() as db:
            return [(seq, json.loads(body)) for seq, body in db.execute(
                "SELECT seq, body FROM events WHERE run_id = ? AND seq > ? ORDER BY seq", (run_id, after)
            )]

    def decide(self, run_id, status, payload):
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT result FROM runs WHERE id = ? AND status = 'completed'", (run_id,)).fetchone()
            if not row:
                return None
            result = json.loads(row[0])
            action = result["proposedAction"]
            if action["status"] != "pending":
                return action if action["status"] == status and (payload is None or payload == action["payloadPreview"]) else False
            action["status"] = status
            if payload is not None:
                action["payloadPreview"] = payload
            action["executionNote"] = f"{status.capitalize()}. Your decision was saved."
            db.execute("UPDATE runs SET result = ? WHERE id = ?", (json.dumps(result), run_id))
            return action
