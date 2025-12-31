import json
import os
from typing import Dict, List, Optional
from passlib.context import CryptContext
from ..models.user import User, UserInDB, UserCreate

# Password hashing context
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class UserService:
    def __init__(self):
        self.users_file = os.path.join(os.path.dirname(__file__), "..", "..", "users.json")
        self.users: Dict[str, UserInDB] = {}
        self._load_users()

    def _load_users(self):
        if os.path.exists(self.users_file):
            try:
                with open(self.users_file, 'r') as f:
                    data = json.load(f)
                    for username, user_data in data.items():
                        self.users[username] = UserInDB(**user_data)
            except Exception as e:
                print(f"Error loading users: {e}")
                self.users = {}
        
        # Ensure Admin user always exists
        if "Admin" not in self.users:
            admin_user = UserInDB(
                username="Admin",
                role="ADMIN",
                password_hash=pwd_context.hash("admin")
            )
            self.users["Admin"] = admin_user
            self._save_users()

    def _save_users(self):
        try:
            data = {username: user.dict() for username, user in self.users.items()}
            with open(self.users_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving users: {e}")

    def get_user(self, username: str) -> Optional[UserInDB]:
        return self.users.get(username)

    def get_users(self) -> List[User]:
        return [User(**user.dict()) for user in self.users.values()]

    def create_user(self, user_create: UserCreate) -> Optional[User]:
        if user_create.username in self.users:
            return None  # User already exists
        
        new_user = UserInDB(
            username=user_create.username,
            email=user_create.email,
            role=user_create.role,
            password_hash=pwd_context.hash(user_create.password)
        )
        self.users[user_create.username] = new_user
        self._save_users()
        return User(**new_user.dict())

    def update_password(self, username: str, new_password: str) -> bool:
        user = self.users.get(username)
        if not user:
            return False
        
        user.password_hash = pwd_context.hash(new_password)
        self._save_users()
        return True

    def update_user_scope(self, username: str, allowed_apps: List[str]) -> bool:
        user = self.users.get(username)
        if not user:
            return False
        
        user.allowed_apps = allowed_apps
        self._save_users()
        return True

    def update_user_role(self, username: str, role: str) -> bool:
        user = self.users.get(username)
        if not user:
            return False
        
        user.role = role
        self._save_users()
        return True

    def verify_password(self, plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)
