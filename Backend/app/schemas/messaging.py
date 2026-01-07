from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class MessageWithSender(MessageResponse):
    sender_name: str
    sender_avatar: Optional[str] = None


class ConversationParticipant(BaseModel):
    id: UUID
    name: str
    email: str
    avatar: Optional[str] = None
    
    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: UUID
    other_user: ConversationParticipant
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ConversationWithMessages(ConversationResponse):
    messages: List[MessageWithSender] = []


class StartConversationRequest(BaseModel):
    user_id: UUID
    initial_message: Optional[str] = None
