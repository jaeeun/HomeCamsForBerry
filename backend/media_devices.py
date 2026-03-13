import platform
import logging
import cv2
import numpy as np
import fractions
import time
from aiortc import VideoStreamTrack, AudioStreamTrack
from av import VideoFrame

logger = logging.getLogger("media")

# We will create dummy video and audio tracks to simulate two cameras with mics 
# since testing on a Mac directly without 2 physical cameras is difficult,
# but the structure is ready to be swapped out for `cv2.VideoCapture(0)` 
# or `aiortc.contrib.media.MediaPlayer('/dev/video0', format='v4l2')`.

class ColorVideoTrack(VideoStreamTrack):
    """
    A simulated video track that returns a solid color frame with a changing timestamp.
    """
    def __init__(self, color=(0, 0, 255)): # Default red
        super().__init__()
        self.color = color
        
    async def recv(self):
        pts, time_base = await self.next_timestamp()
        
        # Create a basic 640x480 frame with the specified color
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        img[:] = self.color
        
        # Add some moving text to ensure it's playing
        cv2.putText(img, f"Simulated Camera TS: {pts}", (50, 240), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                    
        frame = VideoFrame.from_ndarray(img, format="bgr24")
        frame.pts = pts
        frame.time_base = time_base
        return frame

class DummyAudioTrack(AudioStreamTrack):
    """
    A simulated audio track (just silence or basic tone).
    """
    def __init__(self):
        super().__init__()
        
    async def recv(self):
        frame = await super().recv()
        # In a real scenario, this would read from PyAudio / sounddevice (ALSA hw:1,0)
        return frame

def get_video_track(camera_id: str):
    logger.info(f"Setting up video track for {camera_id}")
    if platform.system() == "Linux":
        # REAL HARDWARE IMPLEMENTATION PLACEHOLDER
        # from aiortc.contrib.media import MediaPlayer
        # device = '/dev/video0' if camera_id == 'cam1' else '/dev/video1'
        # return MediaPlayer(device, format='v4l2').video
        pass
        
    # Mac/Simulation Fallback
    if camera_id == "cam1":
        return ColorVideoTrack(color=(255, 0, 0)) # Blue for Cam 1
    elif camera_id == "cam2":
        return ColorVideoTrack(color=(0, 255, 0)) # Green for Cam 2
    return None

def get_audio_track(camera_id: str):
    logger.info(f"Setting up audio track for {camera_id}")
    if platform.system() == "Linux":
        # REAL HARDWARE IMPLEMENTATION PLACEHOLDER
        # return MediaPlayer('hw:1,0', format='alsa').audio
        pass
        
    # Simulation Fallback
    return DummyAudioTrack()

def play_audio_track(track, is_speaker_enabled_func):
    """
    Play the incoming audio track from the client to the Ubuntu speaker.
    Currently a simulated sink that logs when it receives data while speaker is enabled.
    """
    async def consume_track():
        while True:
            try:
                frame = await track.recv()
                if is_speaker_enabled_func():
                    # Play via PyAudio or SoundDevice internally.
                    # Currently just dropping the frame gracefully.
                    # logger.debug("Playing audio frame from client")
                    pass
            except Exception as e:
                logger.error(f"Error consuming track: {e}")
                break
                
    import asyncio
    asyncio.create_task(consume_track())
