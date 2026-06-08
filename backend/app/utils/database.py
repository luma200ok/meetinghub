import sqlite3
from contextlib import contextmanager
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "meetinghub.db"


@contextmanager
def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db(schema_path: Path | None = None):
    path = schema_path or BASE_DIR / "sql" / "schema.sql"
    with get_connection() as connection:
        connection.executescript(path.read_text(encoding="utf-8"))
