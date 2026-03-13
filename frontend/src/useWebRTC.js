import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebRTC() {
  const wsRef = useRef(null);
  const pcsRef = useRef({});
  const [streams, setStreams] = useState({ cam1: null, cam2: null });
  const [micState, setMicState] = useState(false);
  const [speakerState, setSpeakerState] = useState(false);

  useEffect(() => {
    // Connect to signaling server
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.action === 'answer') {
        const pc = pcsRef.current[msg.cameraId];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        }
      } else if (msg.action === 'speaker_state') {
        setSpeakerState(msg.state);
      }
    };
    ws.onclose = () => console.log('WebSocket disconnected');
    wsRef.current = ws;

    return () => {
      ws.close();
      Object.keys(pcsRef.current).forEach((id) => stopCamera(id));
    };
  }, []);

  const toggleCamera = async (cameraId, isOn) => {
    if (!isOn) {
      stopCamera(cameraId);
      return;
    }

    // Start Camera
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcsRef.current[cameraId] = pc;

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    pc.ontrack = (event) => {
      console.log(`Received track for ${cameraId}`, event.track.kind);
      setStreams((prev) => ({
        ...prev,
        [cameraId]: event.streams[0] || new MediaStream([event.track])
      }));
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    wsRef.current.send(JSON.stringify({
      action: 'offer',
      cameraId: cameraId,
      sdp: pc.localDescription
    }));
  };

  const stopCamera = (cameraId) => {
    if (pcsRef.current[cameraId]) {
      pcsRef.current[cameraId].close();
      delete pcsRef.current[cameraId];
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'stop', cameraId }));
    }
    setStreams((prev) => ({ ...prev, [cameraId]: null }));
  };

  const toggleClientMic = async (isOn) => {
    if (!isOn) {
      stopCamera('client_audio');
      setMicState(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcsRef.current['client_audio'] = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsRef.current.send(JSON.stringify({
        action: 'offer',
        cameraId: 'client_audio',
        sdp: pc.localDescription
      }));
      setMicState(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone.');
    }
  };

  const toggleSpeaker = (isOn) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'toggle_speaker', state: isOn }));
      // Optimistic update
      setSpeakerState(isOn);
    }
  };

  return {
    streams,
    toggleCamera,
    micState,
    toggleClientMic,
    speakerState,
    toggleSpeaker
  };
}
