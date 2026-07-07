import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

type MessageHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private url: string = "";
  private isConnecting = false;

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    const token = await SecureStore.getItemAsync("access_token");
    if (!token) return;

    const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
    const baseUrl = __DEV__
      ? `ws://${host}:4000/ws`
      : "wss://backend-production-d163.up.railway.app/ws";

    this.url = `${baseUrl}?token=${token}`;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[WS] Connected");
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.dispatch(message.type, message.data);

          if (message.type === "message:new") {
            this.dispatch("message:new", message);
          }
        } catch {}
      };

      this.ws.onclose = (event) => {
        console.log("[WS] Disconnected:", event.code);
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("[WS] Error:", error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error("[WS] Connection error:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 5000);
  }

  subscribe(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: `subscribe:${event}` }));
    }

    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  private dispatch(event: string, data: any) {
    this.handlers.get(event)?.forEach((handler) => {
      try { handler(data); } catch {}
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
