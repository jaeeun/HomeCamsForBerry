import asyncio
import json
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from rtc_manager import RTCManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rtc_manager = RTCManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Client connected")
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            action = message.get("action")
            
            if action == "offer":
                # Received WebRTC offer from client
                sdp = message.get("sdp")
                camera_id = message.get("cameraId") # 'cam1', 'cam2', or 'client_audio'
                
                answer = await rtc_manager.handle_offer(sdp, camera_id)
                await websocket.send_text(json.dumps({
                    "action": "answer",
                    "sdp": answer.sdp,
                    "cameraId": camera_id
                }))
                
            elif action == "stop":
                camera_id = message.get("cameraId")
                await rtc_manager.stop_connection(camera_id)
                await websocket.send_text(json.dumps({
                    "action": "stopped",
                    "cameraId": camera_id
                }))
                
            elif action == "toggle_speaker":
                # Toggle Ubuntu speaker ON/OFF
                state = message.get("state")
                rtc_manager.set_speaker_state(state)
                await websocket.send_text(json.dumps({
                    "action": "speaker_state",
                    "state": state
                }))
                
    except WebSocketDisconnect:
        logger.info("Client disconnected")
        await rtc_manager.cleanup()

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
