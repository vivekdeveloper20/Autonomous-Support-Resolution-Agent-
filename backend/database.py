"""Database setup and session management."""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./support_agent.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
else:
    engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True, pool_recycle=300)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
