import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def database_url() -> str:
    if os.environ.get("DB_ENGINE") == "postgresql":
        return (
            f"postgresql+psycopg://{os.environ.get('DB_USERNAME', 'postgres')}:{os.environ.get('DB_PASSWORD', '')}"
            f"@{os.environ.get('DB_HOST', '127.0.0.1')}:{os.environ.get('DB_PORT', '5432')}/{os.environ.get('DB_DATABASE', '{{DB_NAME}}')}"
        )
    return f"sqlite:///{os.environ.get('DB_PATH', 'database.sqlite')}"


engine = create_engine(database_url())
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: `def route(db: Session = Depends(get_db))`."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
