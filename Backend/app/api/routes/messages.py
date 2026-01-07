from typing import List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.database import User
from app.models.messaging import Conversation, Message
from app.schemas.messaging import (
    MessageCreate, MessageResponse, MessageWithSender,
    ConversationResponse, ConversationWithMessages, 
    StartConversationRequest, ConversationParticipant
)

router = APIRouter()


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for the current user"""
    conversations = db.query(Conversation).filter(
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).order_by(desc(Conversation.updated_at)).all()
    
    result = []
    for conv in conversations:
        # Determine the other user
        other_user = conv.user2 if conv.user1_id == current_user.id else conv.user1
        
        # Get last message
        last_msg = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(desc(Message.created_at)).first()
        
        # Count unread messages
        unread = db.query(func.count(Message.id)).filter(
            and_(
                Message.conversation_id == conv.id,
                Message.sender_id != current_user.id,
                Message.is_read == False
            )
        ).scalar()
        
        result.append(ConversationResponse(
            id=conv.id,
            other_user=ConversationParticipant(
                id=other_user.id,
                name=other_user.name,
                email=other_user.email,
                avatar=other_user.avatar
            ),
            last_message=last_msg.content if last_msg else None,
            last_message_time=last_msg.created_at if last_msg else None,
            unread_count=unread or 0,
            created_at=conv.created_at or datetime.utcnow(),
            updated_at=conv.updated_at or conv.created_at or datetime.utcnow()
        ))
    
    return result


@router.post("/conversations", response_model=ConversationResponse)
async def start_conversation(
    request: StartConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new conversation with another user (must be connected)"""
    from app.models.database import Match, MatchStatus
    
    target_user_id = request.user_id
    
    if str(target_user_id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start conversation with yourself"
        )
    
    # Check if other user exists
    other_user = db.query(User).filter(User.id == target_user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User not found: {target_user_id}"
        )
    
    # Check if users are connected (accepted match)
    # Get all matches involving both users
    all_matches = db.query(Match).filter(
        or_(
            Match.user_id == current_user.id,
            Match.matched_user_id == current_user.id
        )
    ).all()
    
    # Find the connection between these two users
    connection = None
    for m in all_matches:
        if (str(m.user_id) == str(current_user.id) and str(m.matched_user_id) == str(target_user_id)) or \
           (str(m.user_id) == str(target_user_id) and str(m.matched_user_id) == str(current_user.id)):
            connection = m
            break
    
    # Check if connection exists and is accepted
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No connection found with this user. Send a connection request first."
        )
    
    if connection.status != MatchStatus.accepted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Connection is not accepted yet. Current status: {connection.status.value}"
        )
    
    # Check if conversation already exists
    all_convs = db.query(Conversation).filter(
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).all()
    
    existing = None
    for conv in all_convs:
        if (str(conv.user1_id) == str(current_user.id) and str(conv.user2_id) == str(target_user_id)) or \
           (str(conv.user1_id) == str(target_user_id) and str(conv.user2_id) == str(current_user.id)):
            existing = conv
            break
    
    if existing:
        # Return existing conversation
        return ConversationResponse(
            id=existing.id,
            other_user=ConversationParticipant(
                id=other_user.id,
                name=other_user.name,
                email=other_user.email,
                avatar=other_user.avatar
            ),
            last_message=None,
            last_message_time=None,
            unread_count=0,
            created_at=existing.created_at or datetime.utcnow(),
            updated_at=existing.updated_at or existing.created_at or datetime.utcnow()
        )
    
    # Create new conversation
    conversation = Conversation(
        user1_id=current_user.id,
        user2_id=target_user_id
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    # Send initial message if provided
    if request.initial_message:
        message = Message(
            conversation_id=conversation.id,
            sender_id=current_user.id,
            content=request.initial_message
        )
        db.add(message)
        db.commit()
    
    return ConversationResponse(
        id=conversation.id,
        other_user=ConversationParticipant(
            id=other_user.id,
            name=other_user.name,
            email=other_user.email,
            avatar=other_user.avatar
        ),
        last_message=request.initial_message,
        last_message_time=conversation.created_at if request.initial_message else None,
        unread_count=0,
        created_at=conversation.created_at or datetime.utcnow(),
        updated_at=conversation.updated_at or conversation.created_at or datetime.utcnow()
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation with all messages"""
    conversation = db.query(Conversation).filter(
        and_(
            Conversation.id == conversation_id,
            or_(
                Conversation.user1_id == current_user.id,
                Conversation.user2_id == current_user.id
            )
        )
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Mark messages as read
    db.query(Message).filter(
        and_(
            Message.conversation_id == conversation_id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        )
    ).update({"is_read": True})
    db.commit()
    
    # Get other user
    other_user = conversation.user2 if conversation.user1_id == current_user.id else conversation.user1
    
    # Get messages with sender info
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at).all()
    
    messages_with_sender = []
    for msg in messages:
        messages_with_sender.append(MessageWithSender(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender_name=msg.sender.name,
            sender_avatar=msg.sender.avatar
        ))
    
    return ConversationWithMessages(
        id=conversation.id,
        other_user=ConversationParticipant(
            id=other_user.id,
            name=other_user.name,
            email=other_user.email,
            avatar=other_user.avatar
        ),
        last_message=messages[-1].content if messages else None,
        last_message_time=messages[-1].created_at if messages else None,
        unread_count=0,
        created_at=conversation.created_at or datetime.utcnow(),
        updated_at=conversation.updated_at or conversation.created_at or datetime.utcnow(),
        messages=messages_with_sender
    )


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: UUID,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message in a conversation"""
    # Verify user is part of conversation
    conversation = db.query(Conversation).filter(
        and_(
            Conversation.id == conversation_id,
            or_(
                Conversation.user1_id == current_user.id,
                Conversation.user2_id == current_user.id
            )
        )
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Create message
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=message_data.content
    )
    db.add(message)
    
    # Update conversation timestamp
    conversation.updated_at = message.created_at
    
    db.commit()
    db.refresh(message)
    
    return message


@router.get("/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get total unread message count"""
    # Get all conversations for user
    conversations = db.query(Conversation.id).filter(
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).all()
    
    conv_ids = [c.id for c in conversations]
    
    if not conv_ids:
        return {"unread_count": 0}
    
    count = db.query(func.count(Message.id)).filter(
        and_(
            Message.conversation_id.in_(conv_ids),
            Message.sender_id != current_user.id,
            Message.is_read == False
        )
    ).scalar()
    
    return {"unread_count": count or 0}
