from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    username: str
    email: Optional[str] = None
    role: str
    allowed_apps: list[str] = []

class UserInDB(User):
    password_hash: str

class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    role: str = "READ"  # Default role

class PasswordChange(BaseModel):
    old_password: Optional[str] = None
    new_password: str

class UserScopeUpdate(BaseModel):
    allowed_apps: list[str]

class UserRoleUpdate(BaseModel):
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
