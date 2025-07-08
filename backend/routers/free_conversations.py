from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
import json
from datetime import datetime

from models import (
    FreeConversationCreate, FreeConversationResponse, FreeConversationMessageCreate,
    FreeConversationMessageResponse, FreeConversationStatus, UserResponse, ReferralResponse
)
from database import DatabaseManager
from auth_utils import get_current_user

router = APIRouter()

@router.post("/", response_model=FreeConversationResponse)
async def create_free_conversation(
    conversation_data: FreeConversationCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a free conversation for a rejected referral (candidate only)
    """
    # Verify user is a candidate
    if current_user["role"] != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can initiate free conversations"
        )
    
    try:
        # Get referral details and verify ownership
        referral = DatabaseManager.execute_query(
            "SELECT * FROM referrals WHERE id = ? AND candidate_id = ? AND status = 'rejected'",
            (conversation_data.referral_id, current_user["id"]),
            fetch_one=True
        )
        
        if not referral:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rejected referral not found or access denied"
            )
        
        # Check if free conversation already exists
        existing_conversation = DatabaseManager.execute_query(
            "SELECT id FROM free_conversations WHERE referral_id = ?",
            (conversation_data.referral_id,),
            fetch_one=True
        )
        
        if existing_conversation:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Free conversation already exists for this referral"
            )
        
        # Create free conversation
        conversation_id = DatabaseManager.execute_query(
            """INSERT INTO free_conversations 
               (referral_id, candidate_id, employee_id, status, message_count, max_messages, 
                candidate_message_count, employee_message_count, max_messages_per_user)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                conversation_data.referral_id,
                referral["candidate_id"],
                referral["employee_id"],
                FreeConversationStatus.ACTIVE,
                0,  # message_count
                20, # max_messages (total for both users)
                0,  # candidate_message_count
                0,  # employee_message_count
                10  # max_messages_per_user
            ),
            fetch_one=False
        )
        
        # Send initial system message
        DatabaseManager.execute_query(
            """INSERT INTO free_conversation_messages 
               (conversation_id, sender_id, sender_type, content, message_type)
               VALUES (?, ?, ?, ?, ?)""",
            (
                conversation_id,
                current_user["id"],
                "system",
                "Free conversation started. You each have 10 messages to discuss the referral feedback (20 total messages).",
                "system"
            )
        )
        
        # Send notification to employee
        DatabaseManager.execute_query(
            """INSERT INTO notifications (user_id, type, title, message, data, priority)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                referral["employee_id"],
                "free_conversation_started",
                "New Conversation Request",
                f"{current_user['name']} wants to discuss their rejected referral for {referral['position']}",
                json.dumps({
                    "conversation_id": conversation_id,
                    "referral_id": conversation_data.referral_id,
                    "candidate_name": current_user["name"]
                }),
                "medium"
            )
        )
        
        return await get_free_conversation(conversation_id, current_user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create free conversation: {str(e)}"
        )

@router.get("/{conversation_id}", response_model=FreeConversationResponse)
async def get_free_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get free conversation details
    """
    try:
        # Get conversation with related data
        conversation = DatabaseManager.execute_query(
            """SELECT fc.*, r.position, r.company,
                      u_candidate.name as candidate_name, u_candidate.email as candidate_email,
                      u_employee.name as employee_name, u_employee.email as employee_email
               FROM free_conversations fc
               LEFT JOIN referrals r ON fc.referral_id = r.id
               LEFT JOIN users u_candidate ON fc.candidate_id = u_candidate.id
               LEFT JOIN users u_employee ON fc.employee_id = u_employee.id
               WHERE fc.id = ?""",
            (conversation_id,),
            fetch_one=True
        )
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Free conversation not found"
            )
        
        # Check access
        if current_user["id"] not in [conversation["candidate_id"], conversation["employee_id"]]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Create referral object if data is available
        referral_obj = None
        if conversation.get("position") and conversation.get("company"):
            referral_obj = ReferralResponse(
                id=conversation["referral_id"],
                candidate_id=conversation["candidate_id"],
                employee_id=conversation["employee_id"],
                position=conversation["position"],
                company=conversation["company"],
                status="rejected",  # Since free conversations are only for rejected referrals
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        
        return FreeConversationResponse(
            id=conversation["id"],
            referral_id=conversation["referral_id"],
            candidate_id=conversation["candidate_id"],
            employee_id=conversation["employee_id"],
            status=FreeConversationStatus(conversation["status"]),
            message_count=conversation["message_count"],
            max_messages=conversation["max_messages"],
            candidate_message_count=conversation.get("candidate_message_count", 0),
            employee_message_count=conversation.get("employee_message_count", 0),
            max_messages_per_user=conversation.get("max_messages_per_user", 10),
            created_at=datetime.fromisoformat(conversation["created_at"]),
            updated_at=datetime.fromisoformat(conversation["updated_at"]),
            completed_at=datetime.fromisoformat(conversation["completed_at"]) if conversation["completed_at"] else None,
            referral=referral_obj,
            candidate=UserResponse(
                id=conversation["candidate_id"],
                email=conversation["candidate_email"],
                name=conversation["candidate_name"],
                role="candidate",
                created_at=datetime.now(),
                updated_at=datetime.now()
            ) if conversation["candidate_name"] else None,
            employee=UserResponse(
                id=conversation["employee_id"],
                email=conversation["employee_email"],
                name=conversation["employee_name"],
                role="employee",
                created_at=datetime.now(),
                updated_at=datetime.now()
            ) if conversation["employee_name"] else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get free conversation: {str(e)}"
        )

@router.get("/{conversation_id}/messages", response_model=List[FreeConversationMessageResponse])
async def get_conversation_messages(
    conversation_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get messages for a free conversation
    """
    try:
        # Verify access to conversation
        conversation = DatabaseManager.execute_query(
            "SELECT * FROM free_conversations WHERE id = ?",
            (conversation_id,),
            fetch_one=True
        )
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Free conversation not found"
            )
        
        # Check access
        if current_user["id"] not in [conversation["candidate_id"], conversation["employee_id"]]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get messages
        messages = DatabaseManager.execute_query(
            """SELECT fcm.*, u.name as sender_name
               FROM free_conversation_messages fcm
               LEFT JOIN users u ON fcm.sender_id = u.id
               WHERE fcm.conversation_id = ?
               ORDER BY fcm.created_at ASC""",
            (conversation_id,),
            fetch_all=True
        )
        
        result = []
        for msg in messages:
            result.append(FreeConversationMessageResponse(
                id=msg["id"],
                conversation_id=msg["conversation_id"],
                sender_id=msg["sender_id"],
                sender_type=msg["sender_type"],
                content=msg["content"],
                message_type=msg["message_type"],
                created_at=datetime.fromisoformat(msg["created_at"])
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get messages: {str(e)}"
        )

@router.post("/{conversation_id}/messages", response_model=FreeConversationMessageResponse)
async def send_message(
    conversation_id: int,
    message_data: FreeConversationMessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message in a free conversation
    """
    try:
        # Get conversation
        conversation = DatabaseManager.execute_query(
            "SELECT * FROM free_conversations WHERE id = ?",
            (conversation_id,),
            fetch_one=True
        )
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Free conversation not found"
            )
        
        # Check access
        if current_user["id"] not in [conversation["candidate_id"], conversation["employee_id"]]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if conversation is active
        if conversation["status"] != FreeConversationStatus.ACTIVE:
            if conversation["status"] == FreeConversationStatus.UPGRADE_REQUIRED:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Message limit reached. Upgrade to premium to continue conversation."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Conversation is not active"
                )
        
        # Determine sender type
        sender_type = "candidate" if current_user["id"] == conversation["candidate_id"] else "employee"
        
        # Check individual user message limit
        current_user_count_field = "candidate_message_count" if sender_type == "candidate" else "employee_message_count"
        current_user_count = conversation.get(current_user_count_field, 0)
        max_per_user = conversation.get("max_messages_per_user", 10)
        
        if current_user_count >= max_per_user:
            # Check if the other user has also reached their limit
            other_count_field = "employee_message_count" if sender_type == "candidate" else "candidate_message_count"
            other_user_count = conversation.get(other_count_field, 0)
            
            # If both users have reached their individual limits, mark as upgrade required
            if other_user_count >= max_per_user:
                DatabaseManager.execute_query(
                    "UPDATE free_conversations SET status = ? WHERE id = ?",
                    (FreeConversationStatus.UPGRADE_REQUIRED, conversation_id)
                )
            
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"You have reached your message limit ({max_per_user} messages). Upgrade to premium to continue conversation."
            )
        
        # Insert message
        message_id = DatabaseManager.execute_query(
            """INSERT INTO free_conversation_messages 
               (conversation_id, sender_id, sender_type, content, message_type)
               VALUES (?, ?, ?, ?, ?)""",
            (
                conversation_id,
                current_user["id"],
                sender_type,
                message_data.content,
                message_data.message_type
            ),
            fetch_one=False
        )
        
        # Update individual and total message counts
        new_user_count = current_user_count + 1
        new_total_count = conversation["message_count"] + 1
        
        # Check if conversation should be marked as upgrade required
        other_count_field = "employee_message_count" if sender_type == "candidate" else "candidate_message_count"
        other_user_count = conversation.get(other_count_field, 0)
        
        status_update = FreeConversationStatus.ACTIVE
        if new_user_count >= max_per_user and other_user_count >= max_per_user:
            status_update = FreeConversationStatus.UPGRADE_REQUIRED
        
        # Update the conversation with new counts
        update_query = f"""UPDATE free_conversations 
                          SET message_count = ?, {current_user_count_field} = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
                          WHERE id = ?"""
        
        DatabaseManager.execute_query(
            update_query,
            (new_total_count, new_user_count, status_update, conversation_id)
        )
        
        # Send notification to other user
        other_user_id = conversation["employee_id"] if sender_type == "candidate" else conversation["candidate_id"]
        DatabaseManager.execute_query(
            """INSERT INTO notifications (user_id, type, title, message, data, priority)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                other_user_id,
                "free_conversation_message",
                "New Message",
                f"{current_user['name']} sent you a message",
                json.dumps({
                    "conversation_id": conversation_id,
                    "sender_name": current_user["name"],
                    "message_preview": message_data.content[:100] + "..." if len(message_data.content) > 100 else message_data.content
                }),
                "medium"
            )
        )
        
        # Get the created message
        message = DatabaseManager.execute_query(
            """SELECT fcm.*, u.name as sender_name
               FROM free_conversation_messages fcm
               LEFT JOIN users u ON fcm.sender_id = u.id
               WHERE fcm.id = ?""",
            (message_id,),
            fetch_one=True
        )
        
        return FreeConversationMessageResponse(
            id=message["id"],
            conversation_id=message["conversation_id"],
            sender_id=message["sender_id"],
            sender_type=message["sender_type"],
            content=message["content"],
            message_type=message["message_type"],
            created_at=datetime.fromisoformat(message["created_at"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )

@router.get("/", response_model=List[FreeConversationResponse])
async def get_user_free_conversations(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all free conversations for current user
    """
    try:
        user_field = "candidate_id" if current_user["role"] == "candidate" else "employee_id"
        
        conversations = DatabaseManager.execute_query(
            f"""SELECT fc.*, r.position, r.company,
                       u_candidate.name as candidate_name, u_candidate.email as candidate_email,
                       u_employee.name as employee_name, u_employee.email as employee_email
                FROM free_conversations fc
                LEFT JOIN referrals r ON fc.referral_id = r.id
                LEFT JOIN users u_candidate ON fc.candidate_id = u_candidate.id
                LEFT JOIN users u_employee ON fc.employee_id = u_employee.id
                WHERE fc.{user_field} = ?
                ORDER BY fc.updated_at DESC""",
            (current_user["id"],),
            fetch_all=True
        )
        
        result = []
        for conv in conversations:
            # Create referral object if data is available
            referral_obj = None
            if conv.get("position") and conv.get("company"):
                referral_obj = ReferralResponse(
                    id=conv["referral_id"],
                    candidate_id=conv["candidate_id"],
                    employee_id=conv["employee_id"],
                    position=conv["position"],
                    company=conv["company"],
                    status="rejected",  # Since free conversations are only for rejected referrals
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
            
            result.append(FreeConversationResponse(
                id=conv["id"],
                referral_id=conv["referral_id"],
                candidate_id=conv["candidate_id"],
                employee_id=conv["employee_id"],
                status=FreeConversationStatus(conv["status"]),
                message_count=conv["message_count"],
                max_messages=conv["max_messages"],
                candidate_message_count=conv.get("candidate_message_count", 0),
                employee_message_count=conv.get("employee_message_count", 0),
                max_messages_per_user=conv.get("max_messages_per_user", 10),
                created_at=datetime.fromisoformat(conv["created_at"]),
                updated_at=datetime.fromisoformat(conv["updated_at"]),
                completed_at=datetime.fromisoformat(conv["completed_at"]) if conv["completed_at"] else None,
                referral=referral_obj,
                candidate=UserResponse(
                    id=conv["candidate_id"],
                    email=conv["candidate_email"],
                    name=conv["candidate_name"],
                    role="candidate",
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                ) if conv["candidate_name"] else None,
                employee=UserResponse(
                    id=conv["employee_id"],
                    email=conv["employee_email"],
                    name=conv["employee_name"],
                    role="employee",
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                ) if conv["employee_name"] else None
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get free conversations: {str(e)}"
        ) 