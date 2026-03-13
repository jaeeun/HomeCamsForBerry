# Berry's Home Cams

Dual-camera surveillance system with real-time sync and two-way audio.

## 🚀 Execution Commands

### Backend (Server)
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000 --ssl-keyfile key.pem --ssl-certfile cert.pem --reload
```

### Frontend (Web UI)
```bash
cd frontend
npm run dev
```

---

## 🛑 Termination Commands (Port Cleanup)

If you see an "Address already in use" error, run these to forcefully clear the ports:

### Stop Backend (Port 8000)
```bash
fuser -k 8000/tcp
```

### Stop Frontend (Port 5173)
```bash
fuser -k 5173/tcp
```

---

## 📱 Mobile Connection Guide
1. Ensure your phone is on the same Wi-Fi.
2. Go to `https://<YOUR_UBUNTU_IP>:8000` in your phone's browser.
3. Click **Advanced** -> **Proceed to <IP> (unsafe)** to accept the certificate.
4. Go to the main app at `https://<YOUR_UBUNTU_IP>:5173`.
