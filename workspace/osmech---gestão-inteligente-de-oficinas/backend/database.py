from sqlmodel import SQLModel, create_engine, Session
from contextlib import contextmanager
import os

# Usar caminho absoluto para o banco de dados
DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(DATABASE_DIR, "osmech.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(DATABASE_URL, echo=True, connect_args={"check_same_thread": False})

def create_db_and_tables():
    """Cria todas as tabelas no banco de dados"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency para injeção de sessão"""
    with Session(engine) as session:
        yield session

@contextmanager
def get_session_context():
    """Context manager para uso fora do FastAPI"""
    with Session(engine) as session:
        yield session
