from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserRegister, UserLogin, TokenResponse
from security import hash_password, verify_password, create_access_token


router = APIRouter(prefix="/auth",tags=["auth"])

@router.post("/register",response_model=TokenResponse ,status_code=status.HTTP_201_CREATED)
def Register(payload: UserRegister,db :Session= Depends(get_db)):
    existing_user =db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte existe déjà avec cet email.",
        )
    user =User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,

                )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user=user)

@router.post("/login",response_model=TokenResponse )
def login(payload:UserLogin ,db: Session = Depends(get_db)):
    user =db.query(User).filter(User.email==payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user=user)