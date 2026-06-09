from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

# Sharing Schemas
class DocumentShareCreate(BaseModel):
    username: str
    permission: str = Field(default="Viewer", pattern="^(Editor|Viewer)$")

class DocumentShareResponse(BaseModel):
    id: int
    document_id: int
    user_id: int
    permission: str
    user: UserResponse

    class Config:
        from_attributes = True

# Document Schemas
class DocumentBase(BaseModel):
    title: str
    content: str

class DocumentCreate(BaseModel):
    title: str = "Untitled Document"
    content: str = ""

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    title: str
    content: str
    owner_id: int
    created_at: datetime
    updated_at: datetime
    owner: UserResponse
    shares: List[DocumentShareResponse] = []

    class Config:
        from_attributes = True

class DocumentListItemResponse(BaseModel):
    id: int
    title: str
    owner_id: int
    created_at: datetime
    updated_at: datetime
    owner: UserResponse
    user_permission: str  # "Owner", "Editor", or "Viewer" for the querying user

    class Config:
        from_attributes = True

# History Schemas
class DocumentHistoryResponse(BaseModel):
    id: int
    document_id: int
    content: str
    version: int
    created_at: datetime
    updated_by: UserResponse

    class Config:
        from_attributes = True

# Activity Log Schemas
class ActivityLogResponse(BaseModel):
    id: int
    document_id: Optional[int] = None
    user_id: int
    action: str
    details: Optional[str] = None
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True
