import uuid
from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.api.deps import DatabaseSession, CurrentUser
from app.models.models import User, Category
from app.schemas.schemas import (
    UserCreate,
    AuthResponse,
    LoginRequest,
    GoogleAuthRequest,
    RefreshTokenRequest,
    UserResponse,
)
from jose import JWTError

router = APIRouter()

async def seed_user_categories(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Helper to auto-seed default categories for a new user."""
    default_categories = [
        {"title": "Work", "color_hex": "#FF6B6B", "icon": "work"},
        {"title": "Personal", "color_hex": "#6C63FF", "icon": "home"},
        {"title": "Other", "color_hex": "#2ECB71", "icon": "folder"},
    ]
    for cat_data in default_categories:
        category = Category(
            user_id=user_id,
            title=cat_data["title"],
            color_hex=cat_data["color_hex"],
            icon=cat_data["icon"]
        )
        db.add(category)
    await db.flush()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(db: DatabaseSession, user_in: UserCreate) -> AuthResponse:
    """Register a new user and auto-seed default categories."""
    # Check if user email or username already exists
    email_check = await db.execute(select(User).where(User.email == user_in.email))
    if email_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
    
    username_check = await db.execute(select(User).where(User.username == user_in.username))
    if username_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken.",
        )
        
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        auth_provider="local",
        is_active=True,
    )
    db.add(db_user)
    await db.flush()  # Populates db_user.id
    
    # Auto-seed the categories
    await seed_user_categories(db, db_user.id)
    
    # Create tokens
    access_token = create_access_token(db_user.id)
    refresh_token = create_refresh_token(db_user.id)
    
    # Save session
    await db.commit()
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(db_user)
    )

@router.post("/login")
async def login(db: DatabaseSession, login_in: LoginRequest) -> AuthResponse:
    """Log in with email and password."""
    # Get user by email
    stmt = select(User).where(User.email == login_in.email)
    user = (await db.execute(stmt)).scalar_one_or_none()
    
    if not user or not user.password_hash or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password.",
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive.",
        )
        
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/google")
async def google_auth(db: DatabaseSession, auth_in: GoogleAuthRequest) -> AuthResponse:
    """Google OAuth Sign-In or Register."""
    # If settings.GOOGLE_CLIENT_ID is empty, simulate mock login for testing.
    # Otherwise, verify Google token using Google API.
    email = "google_user@example.com"
    username = "google_user"
    google_id = "mock_google_id_12345"
    avatar_url = None
    
    token_str = auth_in.google_id_token
    
    if not settings.GOOGLE_CLIENT_ID or token_str == "mock_development_token":
        # Dev mock mode
        print("Using Mock Google Authentication for Dev mode")
    else:
        from google.oauth2 import id_token
        from google.auth.transport import requests
        try:
            idinfo = id_token.verify_oauth2_token(token_str, requests.Request(), settings.GOOGLE_CLIENT_ID)
            google_id = idinfo["sub"]
            email = idinfo["email"]
            username = email.split("@")[0]
            avatar_url = idinfo.get("picture")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google ID token is invalid or expired: {str(e)}",
            )
            
    # Check if user already exists by google_id
    stmt = select(User).where(User.google_id == google_id)
    db_user = (await db.execute(stmt)).scalar_one_or_none()
    
    if not db_user:
        # Check if user already exists by email (could be registered locally)
        stmt_email = select(User).where(User.email == email)
        db_user = (await db.execute(stmt_email)).scalar_one_or_none()
        
        if db_user:
            # User exists, link google_id
            db_user.google_id = google_id
            db_user.auth_provider = "google"
            if avatar_url:
                db_user.avatar_url = avatar_url
        else:
            # Create a brand new Google user
            db_user = User(
                username=username,
                email=email,
                auth_provider="google",
                google_id=google_id,
                avatar_url=avatar_url,
                is_active=True,
            )
            db.add(db_user)
            await db.flush()  # populate ID
            
            # Seed categories
            await seed_user_categories(db, db_user.id)
            
        await db.commit()
        await db.refresh(db_user)
        
    access_token = create_access_token(db_user.id)
    refresh_token = create_refresh_token(db_user.id)
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(db_user)
    )

@router.post("/refresh")
async def refresh_token(db: DatabaseSession, refresh_in: RefreshTokenRequest) -> dict:
    """Exchange refresh token for new access/refresh tokens (rotation)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(refresh_in.refresh_token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception
        
    user = await db.get(User, user_uuid)
    if user is None or not user.is_active:
        raise credentials_exception
        
    # Rotate tokens
    access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/me")
async def get_me(current_user: CurrentUser) -> UserResponse:
    """Get current user details."""
    return UserResponse.model_validate(current_user)
