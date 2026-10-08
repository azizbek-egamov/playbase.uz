import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useClubWebSocket() {
  const { currentClub, user, setLiveTables } = useAppStore();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!currentClub?.id || !user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    const clubId = currentClub.id;

    const connectWebSocket = () => {
      // Determine ws / wss protocol
      const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
      let wsUrl: string;

      if (backendUrl.startsWith('https://')) {
        const host = backendUrl.replace('https://', '');
        wsUrl = `wss://${host}/ws/club/${clubId}/`;
      } else if (backendUrl.startsWith('http://')) {
        const host = backendUrl.replace('http://', '');
        wsUrl = `ws://${host}/ws/club/${clubId}/`;
      } else {
        const isHttps = window.location.protocol === 'https:';
        wsUrl = `${isHttps ? 'wss:' : 'ws:'}//${window.location.host}/ws/club/${clubId}/`;
      }

      console.log(`[WebSocket] Connecting to: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to club channel: ${clubId}`);
        // Ping every 25 seconds to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'tables_update' || data.type === 'initial_state') {
            if (Array.isArray(data.tables)) {
              setLiveTables(data.tables);
            }
          }
        } catch (e) {
          console.error('[WebSocket] Error parsing message:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WebSocket] Error:', err);
      };

      ws.onclose = (event) => {
        console.log(`[WebSocket] Closed (code: ${event.code}). Reconnecting in 3s...`);
        clearInterval(pingIntervalRef.current);
        // Auto-reconnect after 3s
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [currentClub?.id, user?.id]);
}
