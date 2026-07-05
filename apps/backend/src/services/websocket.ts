import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  role?: string;
  organizationId?: string;
  isAlive?: boolean;
}

let wss: WebSocketServer | null = null;
const rooms = new Map<string, Set<AuthenticatedSocket>>();

function authenticate(token: string): { userId: string; role: string; organizationId?: string } | null {
  try {
    const secret = process.env.JWT_ACCESS_SECRET || "secret";
    const payload = jwt.verify(token.replace("Bearer ", ""), secret) as any;
    return { userId: payload.sub, role: payload.role, organizationId: payload.orgId };
  } catch {
    return null;
  }
}

export function initializeWebSocket(server: HTTPServer) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: AuthenticatedSocket, req) => {
    ws.isAlive = true;
    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token") || "";

    const user = authenticate(token);
    if (!user) {
      ws.close(4001, "Authentication failed");
      return;
    }

    ws.userId = user.userId;
    ws.role = user.role;
    ws.organizationId = user.organizationId;

    console.log(`[WS] User ${user.userId} (${user.role}) connected`);

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        await handleMessage(ws, msg);
      } catch (err) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      console.log(`[WS] User ${user.userId} disconnected`);
      for (const [, members] of rooms) {
        members.delete(ws);
      }
    });

    ws.send(JSON.stringify({ type: "connected", userId: user.userId, role: user.role }));
  });

  const interval = setInterval(() => {
    wss?.clients.forEach((ws) => {
      const sock = ws as AuthenticatedSocket;
      if (sock.isAlive === false) {
        sock.terminate();
        return;
      }
      sock.isAlive = false;
      sock.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  console.log("[WS] WebSocket server initialized");
  return wss;
}

async function handleMessage(ws: AuthenticatedSocket, msg: any) {
  switch (msg.type) {
    case "subscribe:meeting":
      if (msg.meetingId) {
        const room = `meeting:${msg.meetingId}`;
        if (!rooms.has(room)) rooms.set(room, new Set());
        rooms.get(room)!.add(ws);
        ws.send(JSON.stringify({ type: "subscribed", room }));
      }
      break;

    case "subscribe:organization":
      if (ws.organizationId) {
        const room = `org:${ws.organizationId}`;
        if (!rooms.has(room)) rooms.set(room, new Set());
        rooms.get(room)!.add(ws);
        ws.send(JSON.stringify({ type: "subscribed", room }));
      }
      break;

    case "subscribe:dashboard":
      if (ws.role === "SUPER_ADMIN" || ws.role === "DEPARTMENT_HEAD") {
        const room = `dashboard:${ws.organizationId || "global"}`;
        if (!rooms.has(room)) rooms.set(room, new Set());
        rooms.get(room)!.add(ws);
        ws.send(JSON.stringify({ type: "subscribed", room }));
      }
      break;

    default:
      ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${msg.type}` }));
  }
}

export function broadcast(room: string, event: string, data: any) {
  const members = rooms.get(room);
  if (!members) return;

  const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });
  members.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export function broadcastAttendance(organizationId: string, record: any) {
  broadcast(`org:${organizationId}`, "attendance:update", record);
  broadcast(`dashboard:${organizationId}`, "dashboard:update", record);
}

export function broadcastMeetingUpdate(meetingId: string, update: any) {
  broadcast(`meeting:${meetingId}`, "meeting:update", update);
}

export function getWSS(): WebSocketServer | null {
  return wss;
}
