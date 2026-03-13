import asyncio
import logging
from aiortc import RTCPeerConnection, RTCSessionDescription
from media_devices import get_video_track, get_audio_track, play_audio_track

logger = logging.getLogger("rtc")

class RTCManager:
    def __init__(self):
        self.pcs = set()
        self.camera_tracks = {} # Store initialized tracks
        self.speaker_enabled = False

    async def handle_offer(self, sdp: dict, camera_id: str):
        offer = RTCSessionDescription(sdp=sdp["sdp"], type=sdp["type"])
        pc = RTCPeerConnection()
        self.pcs.add(pc)
        
        # When connection closes
        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            logger.info(f"Connection state for {camera_id}: {pc.connectionState}")
            if pc.connectionState == "failed":
                await pc.close()
                self.pcs.discard(pc)
            elif pc.connectionState == "closed":
                self.pcs.discard(pc)

        if camera_id in ["cam1", "cam2"]:
            # Setup tracks for camera
            audio_track = get_audio_track(camera_id)
            video_track = get_video_track(camera_id)
            
            if audio_track:
                pc.addTrack(audio_track)
            if video_track:
                pc.addTrack(video_track)
                
        elif camera_id == "client_audio":
            # Receiving client audio
            @pc.on("track")
            def on_track(track):
                if track.kind == "audio":
                    logger.info("Received client audio track")
                    # Play this track if speaker is enabled
                    play_audio_track(track, lambda: self.speaker_enabled)
        
        await pc.setRemoteDescription(offer)
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        
        return pc.localDescription

    async def stop_connection(self, camera_id: str):
        # We might want more targeted teardown here, but for now we rely on the client closing the connection.
        # Typically the client stops tracks, then we notice connectionState 'failed' or 'closed'.
        pass
        
    def set_speaker_state(self, state: bool):
        self.speaker_enabled = state
        logger.info(f"Ubuntu Speaker Enabled: {self.speaker_enabled}")

    async def cleanup(self):
        coros = [pc.close() for pc in self.pcs]
        await asyncio.gather(*coros)
        self.pcs.clear()
