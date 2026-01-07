from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.database import User, Match, MatchStatus, Skill, SkillType
from app.schemas.schemas import MatchResponse, MatchCreate

router = APIRouter()


@router.get("/find", response_model=List[dict])
async def find_potential_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Find potential matches based on skill compatibility.
    Excludes users who already have a match request (sent or received).
    """
    # Get current user's skills
    user_teaching = db.query(Skill).filter(
        and_(Skill.user_id == current_user.id, Skill.type == SkillType.teaching)
    ).all()
    user_learning = db.query(Skill).filter(
        and_(Skill.user_id == current_user.id, Skill.type == SkillType.learning)
    ).all()
    
    teaching_names = {s.name.lower() for s in user_teaching}
    learning_names = {s.name.lower() for s in user_learning}
    
    # Get all other users
    other_users = db.query(User).filter(User.id != current_user.id).all()
    
    # Get existing matches (both sent and received) to exclude
    existing_matches = db.query(Match).filter(
        or_(
            Match.user_id == current_user.id,
            Match.matched_user_id == current_user.id
        )
    ).all()
    
    # Users we already have a connection with (either direction)
    connected_user_ids = set()
    for m in existing_matches:
        connected_user_ids.add(m.user_id)
        connected_user_ids.add(m.matched_user_id)
    connected_user_ids.discard(current_user.id)
    
    potential_matches = []
    
    for other_user in other_users:
        if other_user.id in connected_user_ids:
            continue
            
        # Get other user's skills
        other_teaching = db.query(Skill).filter(
            and_(Skill.user_id == other_user.id, Skill.type == SkillType.teaching)
        ).all()
        other_learning = db.query(Skill).filter(
            and_(Skill.user_id == other_user.id, Skill.type == SkillType.learning)
        ).all()
        
        other_teaching_names = {s.name.lower() for s in other_teaching}
        other_learning_names = {s.name.lower() for s in other_learning}
        
        # They teach what I want to learn
        they_teach_i_learn = other_teaching_names & learning_names
        # I teach what they want to learn
        i_teach_they_learn = teaching_names & other_learning_names
        
        common_skills = list(they_teach_i_learn | i_teach_they_learn)
        
        if common_skills:
            total_possible = len(learning_names) + len(teaching_names)
            if total_possible > 0:
                match_score = min(100, (len(common_skills) / total_possible) * 100 * 2)
            else:
                match_score = 50
            
            potential_matches.append({
                "user": {
                    "id": str(other_user.id),
                    "name": other_user.name,
                    "email": other_user.email,
                    "avatar": other_user.avatar,
                    "bio": other_user.bio,
                    "rating": other_user.rating,
                },
                "match_score": round(match_score, 1),
                "common_skills": common_skills,
                "they_can_teach": list(they_teach_i_learn),
                "they_want_to_learn": list(i_teach_they_learn),
            })
    
    potential_matches.sort(key=lambda x: x["match_score"], reverse=True)
    return potential_matches[:20]


@router.get("/sent")
async def get_sent_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get match requests I sent (waiting for others to accept)"""
    matches = db.query(Match).filter(
        and_(
            Match.user_id == current_user.id,
            Match.status == MatchStatus.pending
        )
    ).all()
    
    result = []
    for match in matches:
        other_user = db.query(User).filter(User.id == match.matched_user_id).first()
        result.append({
            "id": str(match.id),
            "matched_user": {
                "id": str(other_user.id),
                "name": other_user.name,
                "email": other_user.email,
                "avatar": other_user.avatar,
                "bio": other_user.bio,
                "rating": other_user.rating,
            } if other_user else None,
            "match_score": match.match_score,
            "common_skills": match.common_skills,
            "status": match.status.value,
            "created_at": match.created_at.isoformat(),
        })
    return result


@router.get("/received")
async def get_received_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get match requests I received (I need to accept/reject)"""
    matches = db.query(Match).filter(
        and_(
            Match.matched_user_id == current_user.id,
            Match.status == MatchStatus.pending
        )
    ).all()
    
    result = []
    for match in matches:
        sender = db.query(User).filter(User.id == match.user_id).first()
        result.append({
            "id": str(match.id),
            "sender": {
                "id": str(sender.id),
                "name": sender.name,
                "email": sender.email,
                "avatar": sender.avatar,
                "bio": sender.bio,
                "rating": sender.rating,
            } if sender else None,
            "match_score": match.match_score,
            "common_skills": match.common_skills,
            "status": match.status.value,
            "created_at": match.created_at.isoformat(),
        })
    return result


@router.get("/connections")
async def get_accepted_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all accepted connections (can message these users)"""
    matches = db.query(Match).filter(
        and_(
            or_(
                Match.user_id == current_user.id,
                Match.matched_user_id == current_user.id
            ),
            Match.status == MatchStatus.accepted
        )
    ).all()
    
    result = []
    for match in matches:
        # Get the other user
        other_user_id = match.matched_user_id if match.user_id == current_user.id else match.user_id
        other_user = db.query(User).filter(User.id == other_user_id).first()
        
        if other_user:
            result.append({
                "id": str(match.id),
                "user": {
                    "id": str(other_user.id),
                    "name": other_user.name,
                    "email": other_user.email,
                    "avatar": other_user.avatar,
                    "bio": other_user.bio,
                    "rating": other_user.rating,
                },
                "match_score": match.match_score,
                "common_skills": match.common_skills,
                "connected_at": match.updated_at.isoformat(),
            })
    return result


@router.get("/", response_model=List[MatchResponse])
async def get_user_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all matches involving current user"""
    matches = db.query(Match).filter(
        or_(
            Match.user_id == current_user.id,
            Match.matched_user_id == current_user.id
        )
    ).all()
    return matches


@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
async def create_match(
    match_data: MatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a connection request to another user"""
    # Check if match already exists in either direction
    existing = db.query(Match).filter(
        or_(
            and_(Match.user_id == current_user.id, Match.matched_user_id == match_data.matched_user_id),
            and_(Match.user_id == match_data.matched_user_id, Match.matched_user_id == current_user.id)
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connection request already exists"
        )
    
    new_match = Match(**match_data.dict(), user_id=current_user.id)
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    return new_match


@router.post("/{match_id}/accept", response_model=MatchResponse)
async def accept_match(
    match_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a connection request (only the receiver can accept)"""
    # The receiver is matched_user_id
    match = db.query(Match).filter(
        Match.id == match_id,
        Match.matched_user_id == current_user.id,  # Only receiver can accept
        Match.status == MatchStatus.pending
    ).first()
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match request not found or you cannot accept it"
        )
    
    match.status = MatchStatus.accepted
    db.commit()
    db.refresh(match)
    return match


@router.post("/{match_id}/reject", response_model=MatchResponse)
async def reject_match(
    match_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a connection request (only the receiver can reject)"""
    match = db.query(Match).filter(
        Match.id == match_id,
        Match.matched_user_id == current_user.id,  # Only receiver can reject
        Match.status == MatchStatus.pending
    ).first()
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match request not found or you cannot reject it"
        )
    
    match.status = MatchStatus.rejected
    db.commit()
    db.refresh(match)
    return match


@router.delete("/{match_id}")
async def cancel_match_request(
    match_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a connection request I sent (only sender can cancel)"""
    match = db.query(Match).filter(
        Match.id == match_id,
        Match.user_id == current_user.id,  # Only sender can cancel
        Match.status == MatchStatus.pending
    ).first()
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match request not found or you cannot cancel it"
        )
    
    db.delete(match)
    db.commit()
    return {"message": "Request cancelled"}
