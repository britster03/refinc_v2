from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from typing import Dict, List, Optional, Any
import json
import asyncio
from datetime import datetime
import logging
from auth_utils import get_current_user
from database import DatabaseManager

router = APIRouter()
logger = logging.getLogger(__name__)

# Store active connections and call sessions
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.active_calls: Dict[str, Dict[str, Any]] = {}
        self.user_to_conversation: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str, conversation_id: str):
        await websocket.accept()
        connection_key = f"{user_id}_{conversation_id}"
        self.active_connections[connection_key] = websocket
        self.user_to_conversation[user_id] = conversation_id
        logger.info(f"User {user_id} connected to conversation {conversation_id}")

    def disconnect(self, user_id: str, conversation_id: str):
        connection_key = f"{user_id}_{conversation_id}"
        if connection_key in self.active_connections:
            del self.active_connections[connection_key]
        if user_id in self.user_to_conversation:
            del self.user_to_conversation[user_id]
        logger.info(f"User {user_id} disconnected from conversation {conversation_id}")

    async def send_to_user(self, target_user_id: str, conversation_id: str, message: dict):
        connection_key = f"{target_user_id}_{conversation_id}"
        if connection_key in self.active_connections:
            try:
                await self.active_connections[connection_key].send_text(json.dumps(message))
                return True
            except Exception as e:
                logger.error(f"Error sending message to user {target_user_id}: {e}")
                # Remove dead connection
                self.disconnect(target_user_id, conversation_id)
                return False
        return False

    async def broadcast_to_conversation(self, conversation_id: str, message: dict, exclude_user: Optional[str] = None):
        disconnected_users = []
        for connection_key, websocket in self.active_connections.items():
            user_id, conv_id = connection_key.split('_', 1)
            if conv_id == conversation_id and user_id != exclude_user:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id}: {e}")
                    disconnected_users.append((user_id, conv_id))
        
        # Clean up dead connections
        for user_id, conv_id in disconnected_users:
            self.disconnect(user_id, conv_id)

    def get_conversation_participants(self, conversation_id: str) -> List[str]:
        participants = []
        for connection_key in self.active_connections.keys():
            user_id, conv_id = connection_key.split('_', 1)
            if conv_id == conversation_id:
                participants.append(user_id)
        return participants

    def is_user_in_call(self, conversation_id: str, user_id: str) -> bool:
        return conversation_id in self.active_calls and user_id in self.active_calls[conversation_id].get('participants', [])

    def start_call(self, conversation_id: str, initiator_id: str):
        self.active_calls[conversation_id] = {
            'status': 'initiated',
            'initiator': initiator_id,
            'participants': [initiator_id],
            'started_at': datetime.utcnow().isoformat(),
            'call_data': {}
        }

    def join_call(self, conversation_id: str, user_id: str):
        if conversation_id in self.active_calls:
            if user_id not in self.active_calls[conversation_id]['participants']:
                self.active_calls[conversation_id]['participants'].append(user_id)
            self.active_calls[conversation_id]['status'] = 'active'

    def leave_call(self, conversation_id: str, user_id: str):
        if conversation_id in self.active_calls:
            participants = self.active_calls[conversation_id]['participants']
            if user_id in participants:
                participants.remove(user_id)
            
            # End call if no participants left
            if len(participants) == 0:
                del self.active_calls[conversation_id]
            elif len(participants) == 1:
                self.active_calls[conversation_id]['status'] = 'waiting'

manager = ConnectionManager()

@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    # Get user from query params (since WebSocket can't use Depends easily)
    try:
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=1008, reason="Missing authentication token")
            return

        # Verify token and get user (simplified for WebSocket)
        from auth_utils import AuthUtils
        user_data = AuthUtils.verify_token(token)
        if not user_data:
            await websocket.close(code=1008, reason="Invalid authentication token")
            return

        user_id = int(user_data["sub"])  # Convert to integer for database comparison
        
        # Verify user has access to this conversation
        db_manager = DatabaseManager()
        query = """
            SELECT * FROM premium_conversations 
            WHERE id = ? AND (employee_id = ? OR candidate_id = ?)
        """
        conversation = db_manager.execute_query(query, (conversation_id, user_id, user_id), fetch_one=True)
        
        if not conversation:
            await websocket.close(code=1008, reason="Access denied to conversation")
            return

        await manager.connect(websocket, str(user_id), conversation_id)
        
        # Notify others that user joined
        await manager.broadcast_to_conversation(
            conversation_id,
            {
                "type": "user_joined",
                "user_id": str(user_id),
                "timestamp": datetime.utcnow().isoformat()
            },
            exclude_user=str(user_id)
        )

        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                await handle_websocket_message(str(user_id), conversation_id, message)
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid message format"
                }))

    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        await websocket.close(code=1011, reason="Internal server error")
    finally:
        if 'user_id' in locals():
            manager.disconnect(str(user_id), conversation_id)
            # Notify others that user left
            await manager.broadcast_to_conversation(
                conversation_id,
                {
                    "type": "user_left",
                    "user_id": str(user_id),
                    "timestamp": datetime.utcnow().isoformat()
                },
                exclude_user=str(user_id)
            )

async def handle_websocket_message(user_id: str, conversation_id: str, message: dict):
    """Handle different types of WebSocket messages for video calling"""
    message_type = message.get("type")
    
    try:
        if message_type == "call_initiate":
            await handle_call_initiate(user_id, conversation_id, message)
        elif message_type == "call_accept":
            await handle_call_accept(user_id, conversation_id, message)
        elif message_type == "call_reject":
            await handle_call_reject(user_id, conversation_id, message)
        elif message_type == "call_end":
            await handle_call_end(user_id, conversation_id, message)
        elif message_type == "sdp_offer":
            await handle_sdp_offer(user_id, conversation_id, message)
        elif message_type == "sdp_answer":
            await handle_sdp_answer(user_id, conversation_id, message)
        elif message_type == "ice_candidate":
            await handle_ice_candidate(user_id, conversation_id, message)
        elif message_type == "media_state":
            await handle_media_state(user_id, conversation_id, message)
        elif message_type == "screen_share":
            await handle_screen_share(user_id, conversation_id, message)
        elif message_type == "chat_message":
            await handle_chat_message(user_id, conversation_id, message)
        else:
            logger.warning(f"Unknown message type: {message_type}")

    except Exception as e:
        logger.error(f"Error handling message type {message_type}: {e}")
        # Send error back to sender
        await manager.send_to_user(user_id, conversation_id, {
            "type": "error",
            "message": f"Failed to process {message_type}",
            "error": str(e)
        })

async def handle_call_initiate(user_id: str, conversation_id: str, message: dict):
    """Handle call initiation"""
    manager.start_call(conversation_id, user_id)
    
    # Get other participants in the conversation
    participants = manager.get_conversation_participants(conversation_id)
    other_participants = [p for p in participants if p != user_id]
    
    # Notify other participants about incoming call
    for participant_id in other_participants:
        await manager.send_to_user(participant_id, conversation_id, {
            "type": "incoming_call",
            "caller_id": user_id,
            "caller_name": message.get("caller_name", "Unknown"),
            "conversation_id": conversation_id,
            "timestamp": datetime.utcnow().isoformat()
        })

async def handle_call_accept(user_id: str, conversation_id: str, message: dict):
    """Handle call acceptance"""
    manager.join_call(conversation_id, user_id)
    
    # Notify all participants that call was accepted
    await manager.broadcast_to_conversation(conversation_id, {
        "type": "call_accepted",
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat()
    })

async def handle_call_reject(user_id: str, conversation_id: str, message: dict):
    """Handle call rejection"""
    # Notify all participants that call was rejected
    await manager.broadcast_to_conversation(conversation_id, {
        "type": "call_rejected",
        "user_id": user_id,
        "reason": message.get("reason", "Call declined"),
        "timestamp": datetime.utcnow().isoformat()
    })

async def handle_call_end(user_id: str, conversation_id: str, message: dict):
    """Handle call termination"""
    manager.leave_call(conversation_id, user_id)
    
    # Notify all participants that call ended
    await manager.broadcast_to_conversation(conversation_id, {
        "type": "call_ended",
        "ended_by": user_id,
        "timestamp": datetime.utcnow().isoformat()
    })

async def handle_sdp_offer(user_id: str, conversation_id: str, message: dict):
    """Handle WebRTC SDP offer"""
    target_user = message.get("target_user")
    sdp = message.get("sdp")
    
    if target_user and sdp:
        await manager.send_to_user(target_user, conversation_id, {
            "type": "sdp_offer",
            "from_user": user_id,
            "sdp": sdp,
            "timestamp": datetime.utcnow().isoformat()
        })

async def handle_sdp_answer(user_id: str, conversation_id: str, message: dict):
    """Handle WebRTC SDP answer"""
    target_user = message.get("target_user")
    sdp = message.get("sdp")
    
    if target_user and sdp:
        await manager.send_to_user(target_user, conversation_id, {
            "type": "sdp_answer",
            "from_user": user_id,
            "sdp": sdp,
            "timestamp": datetime.utcnow().isoformat()
        })

async def handle_ice_candidate(user_id: str, conversation_id: str, message: dict):
    """Handle WebRTC ICE candidates"""
    target_user = message.get("target_user")
    candidate = message.get("candidate")
    
    if target_user and candidate:
        await manager.send_to_user(target_user, conversation_id, {
            "type": "ice_candidate",
            "from_user": user_id,
            "candidate": candidate,
            "timestamp": datetime.utcnow().isoformat()
        })

async def handle_media_state(user_id: str, conversation_id: str, message: dict):
    """Handle media state changes (mute/unmute, video on/off)"""
    media_type = message.get("media_type")  # 'audio' or 'video'
    enabled = message.get("enabled", False)
    
    # Broadcast media state change to other participants
    await manager.broadcast_to_conversation(conversation_id, {
        "type": "media_state_changed",
        "user_id": user_id,
        "media_type": media_type,
        "enabled": enabled,
        "timestamp": datetime.utcnow().isoformat()
    }, exclude_user=user_id)

async def handle_screen_share(user_id: str, conversation_id: str, message: dict):
    """Handle screen sharing state changes"""
    sharing = message.get("sharing", False)
    
    # Broadcast screen share state to other participants
    await manager.broadcast_to_conversation(conversation_id, {
        "type": "screen_share_changed",
        "user_id": user_id,
        "sharing": sharing,
        "timestamp": datetime.utcnow().isoformat()
    }, exclude_user=user_id)

async def handle_chat_message(user_id: str, conversation_id: str, message: dict):
    """Handle chat messages during video call"""
    content = message.get("content", "")
    
    if content.strip():
        # Broadcast chat message to other participants
        await manager.broadcast_to_conversation(conversation_id, {
            "type": "chat_message",
            "user_id": user_id,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_user=user_id)

# REST API endpoints for call management
@router.get("/{conversation_id}/status")
async def get_call_status(conversation_id: str, current_user: dict = Depends(get_current_user)):
    """Get current call status for a conversation"""
    
    # Verify user has access to conversation
    db_manager = DatabaseManager()
    query = """
        SELECT * FROM premium_conversations 
        WHERE id = ? AND (employee_id = ? OR candidate_id = ?)
    """
    conversation = db_manager.execute_query(
        query, (conversation_id, current_user["id"], current_user["id"]), fetch_one=True
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get call status
    call_data = manager.active_calls.get(conversation_id, {})
    participants = manager.get_conversation_participants(conversation_id)
    
    return {
        "conversation_id": conversation_id,
        "call_active": conversation_id in manager.active_calls,
        "call_status": call_data.get("status", "inactive"),
        "participants": participants,
        "online_participants": len(participants),
        "call_started_at": call_data.get("started_at"),
        "initiator": call_data.get("initiator")
    }

@router.post("/{conversation_id}/start")
async def start_video_call(conversation_id: str, current_user: dict = Depends(get_current_user)):
    """Start a video call for a conversation"""
    
    # Verify user has access to conversation
    db_manager = DatabaseManager()
    query = """
        SELECT * FROM premium_conversations 
        WHERE id = ? AND (employee_id = ? OR candidate_id = ?) AND status = 'in_progress'
    """
    conversation = db_manager.execute_query(
        query, (conversation_id, current_user["id"], current_user["id"]), fetch_one=True
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found or not active")
    
    # Check if call already active
    if conversation_id in manager.active_calls:
        return {
            "message": "Call already active",
            "call_status": manager.active_calls[conversation_id]["status"]
        }
    
    # Start the call
    manager.start_call(conversation_id, str(current_user["id"]))
    
    return {
        "message": "Video call initiated",
        "conversation_id": conversation_id,
        "initiator": current_user["id"]
    } 