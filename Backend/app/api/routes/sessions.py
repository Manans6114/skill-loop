from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.database import User, Session as DBSession, SessionStatus, SessionType, CreditTransaction
from app.schemas.schemas import SessionResponse, SessionCreate, SessionUpdate, SessionRatingRequest

router = APIRouter()

# Credit rates per duration (in minutes)
CREDIT_RATES = {
    15: 5,   # 15 min = 5 credits
    30: 10,  # 30 min = 10 credits
    60: 20,  # 60 min = 20 credits
}


def get_credits_for_duration(duration: int) -> int:
    """Get credit amount for a session duration"""
    return CREDIT_RATES.get(duration, duration // 3)  # Default: 1 credit per 3 minutes


@router.get("/", response_model=List[SessionResponse])
async def get_user_sessions(
    status_filter: SessionStatus = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sessions for current user (as organizer or participant)"""
    query = db.query(DBSession).filter(
        or_(
            DBSession.user_id == current_user.id,
            DBSession.participant_id == current_user.id
        )
    )
    
    if status_filter:
        query = query.filter(DBSession.status == status_filter)
    
    sessions = query.order_by(DBSession.created_at.desc()).all()
    return sessions


@router.get("/pending", response_model=List[SessionResponse])
async def get_pending_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pending session requests where I am the participant (need to accept/reject)"""
    sessions = db.query(DBSession).filter(
        and_(
            DBSession.participant_id == current_user.id,
            DBSession.status == SessionStatus.pending
        )
    ).order_by(DBSession.created_at.desc()).all()
    return sessions


@router.get("/sent", response_model=List[SessionResponse])
async def get_sent_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get session requests I sent (waiting for acceptance)"""
    sessions = db.query(DBSession).filter(
        and_(
            DBSession.user_id == current_user.id,
            DBSession.status == SessionStatus.pending
        )
    ).order_by(DBSession.created_at.desc()).all()
    return sessions


@router.get("/scheduled", response_model=List[SessionResponse])
async def get_scheduled_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all scheduled (accepted) sessions"""
    sessions = db.query(DBSession).filter(
        and_(
            or_(
                DBSession.user_id == current_user.id,
                DBSession.participant_id == current_user.id
            ),
            DBSession.status == SessionStatus.scheduled
        )
    ).order_by(DBSession.date, DBSession.time).all()
    return sessions


@router.get("/history", response_model=List[SessionResponse])
async def get_session_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get completed sessions"""
    sessions = db.query(DBSession).filter(
        and_(
            or_(
                DBSession.user_id == current_user.id,
                DBSession.participant_id == current_user.id
            ),
            DBSession.status == SessionStatus.completed
        )
    ).order_by(DBSession.updated_at.desc()).all()
    return sessions


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new session request.
    - If type is 'learning': current user wants to learn, participant will teach
    - If type is 'teaching': current user wants to teach, participant will learn
    """
    # Calculate credits for this session
    credits_amount = get_credits_for_duration(session_data.duration)
    
    # If user is learning, check if they have enough credits
    if session_data.type == SessionType.learning or session_data.type == "learning":
        if current_user.credits < credits_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient credits. You need {credits_amount} credits but have {current_user.credits}"
            )
    
    # Verify participant exists
    participant = db.query(User).filter(User.id == session_data.participant_id).first()
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )
    
    new_session = DBSession(
        title=session_data.title,
        user_id=current_user.id,
        participant_id=session_data.participant_id,
        participant_name=session_data.participant_name,
        skill=session_data.skill,
        date=session_data.date,
        time=session_data.time,
        duration=session_data.duration,
        credits_amount=credits_amount,
        type=session_data.type,
        status=SessionStatus.pending
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.post("/{session_id}/accept", response_model=SessionResponse)
async def accept_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a session request (only participant can accept)"""
    session = db.query(DBSession).filter(
        DBSession.id == session_id,
        DBSession.participant_id == current_user.id,
        DBSession.status == SessionStatus.pending
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session request not found or you cannot accept it"
        )
    
    # If participant (current user) will be learning, check their credits
    # session.type is from organizer's perspective
    # If organizer is teaching, participant is learning
    if session.type == SessionType.teaching:
        if current_user.credits < session.credits_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient credits. You need {session.credits_amount} credits but have {current_user.credits}"
            )
    
    session.status = SessionStatus.scheduled
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/reject", response_model=SessionResponse)
async def reject_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a session request (only participant can reject)"""
    session = db.query(DBSession).filter(
        DBSession.id == session_id,
        DBSession.participant_id == current_user.id,
        DBSession.status == SessionStatus.pending
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session request not found or you cannot reject it"
        )
    
    session.status = SessionStatus.rejected
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/cancel", response_model=SessionResponse)
async def cancel_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a session (organizer can cancel pending/scheduled, participant can cancel scheduled)"""
    session = db.query(DBSession).filter(
        DBSession.id == session_id,
        or_(
            DBSession.user_id == current_user.id,
            DBSession.participant_id == current_user.id
        ),
        DBSession.status.in_([SessionStatus.pending, SessionStatus.scheduled])
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or cannot be cancelled"
        )
    
    session.status = SessionStatus.cancelled
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/complete", response_model=SessionResponse)
async def complete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Complete a session and transfer credits.
    - Learner pays credits
    - Teacher receives credits
    """
    session = db.query(DBSession).filter(
        DBSession.id == session_id,
        or_(
            DBSession.user_id == current_user.id,
            DBSession.participant_id == current_user.id
        ),
        DBSession.status == SessionStatus.scheduled
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not in scheduled status"
        )
    
    # Determine who is teacher and who is learner
    # session.type is from organizer's (user_id) perspective
    if session.type == SessionType.teaching:
        # Organizer is teaching, participant is learning
        teacher_id = session.user_id
        learner_id = session.participant_id
    else:
        # Organizer is learning, participant is teaching
        teacher_id = session.participant_id
        learner_id = session.user_id
    
    teacher = db.query(User).filter(User.id == teacher_id).first()
    learner = db.query(User).filter(User.id == learner_id).first()
    
    if not teacher or not learner:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not find session participants"
        )
    
    credits_amount = session.credits_amount
    
    # Check if learner has enough credits
    if learner.credits < credits_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Learner has insufficient credits. Need {credits_amount}, have {learner.credits}"
        )
    
    # Transfer credits: deduct from learner, add to teacher
    learner.credits -= credits_amount
    teacher.credits += credits_amount
    
    # Create transaction for learner (spent)
    learner_transaction = CreditTransaction(
        user_id=learner_id,
        session_id=session.id,
        amount=-credits_amount,
        transaction_type="session_payment",
        description=f"Paid for learning session: {session.title} ({session.duration} min)",
        balance_after=learner.credits
    )
    db.add(learner_transaction)
    
    # Create transaction for teacher (earned)
    teacher_transaction = CreditTransaction(
        user_id=teacher_id,
        session_id=session.id,
        amount=credits_amount,
        transaction_type="session_earned",
        description=f"Earned from teaching session: {session.title} ({session.duration} min)",
        balance_after=teacher.credits
    )
    db.add(teacher_transaction)
    
    # Mark session as completed
    session.status = SessionStatus.completed
    
    db.commit()
    db.refresh(session)
    return session


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: UUID,
    session_update: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a session (only organizer can update, only pending/scheduled sessions)"""
    session = db.query(DBSession).filter(
        DBSession.id == session_id,
        DBSession.user_id == current_user.id,
        DBSession.status.in_([SessionStatus.pending, SessionStatus.scheduled])
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or cannot be updated"
        )
    
    # If duration is being updated, recalculate credits
    if session_update.duration and session_update.duration != session.duration:
        session.credits_amount = get_credits_for_duration(session_update.duration)
    
    for field, value in session_update.dict(exclude_unset=True).items():
        setattr(session, field, value)
    
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/rate", response_model=SessionResponse)
async def rate_session(
    session_id: UUID,
    rating_data: SessionRatingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rate a completed session"""
    session = db.query(DBSession).filter(
        DBSession.id == session_id,
        or_(
            DBSession.user_id == current_user.id,
            DBSession.participant_id == current_user.id
        ),
        DBSession.status == SessionStatus.completed
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not completed"
        )
    
    if session.rating is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session already rated"
        )
    
    session.rating = rating_data.rating
    session.feedback = rating_data.feedback
    session.rated_by = current_user.id
    
    # Update the rated user's overall rating
    rated_user_id = session.participant_id if session.user_id == current_user.id else session.user_id
    rated_user = db.query(User).filter(User.id == rated_user_id).first()
    
    if rated_user:
        # Get all ratings for this user
        all_sessions = db.query(DBSession).filter(
            and_(
                or_(
                    DBSession.participant_id == rated_user_id,
                    DBSession.user_id == rated_user_id
                ),
                DBSession.rating.isnot(None),
                DBSession.rated_by != rated_user_id  # Ratings given TO this user
            )
        ).all()
        
        all_ratings = [s.rating for s in all_sessions]
        if all_ratings:
            rated_user.rating = sum(all_ratings) / len(all_ratings)
    
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a session (only organizer can delete pending sessions)"""
    session = db.query(DBSession).filter(
        DBSession.id == session_id,
        DBSession.user_id == current_user.id,
        DBSession.status == SessionStatus.pending
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or cannot be deleted"
        )
    
    db.delete(session)
    db.commit()
    return None


@router.get("/credit-rates")
async def get_credit_rates():
    """Get credit rates for different session durations"""
    return {
        "rates": CREDIT_RATES,
        "description": "Credits required/earned per session duration in minutes"
    }
