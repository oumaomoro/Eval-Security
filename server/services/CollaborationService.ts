import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "../storage.js";

interface CollaborationClient extends WebSocket {
  workspaceId?: number;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
}

export class CollaborationService {
  private static wss: WebSocketServer | null = null;

  static init(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws/collaboration" });

    this.wss.on("connection", (ws: CollaborationClient) => {
      console.log("[COLLAB] New client connected via WebSocket");

      ws.on("message", async (message: string) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === "PRESENCE_INIT") {
            ws.workspaceId = data.workspaceId;
            ws.userId = data.userId;
            ws.resourceType = data.resourceType;
            ws.resourceId = data.resourceId;

            console.log(`[COLLAB] User ${ws.userId} is now present on ${ws.resourceType}:${ws.resourceId}`);
            
            // Broadcast to others in the same workspace/resource
            this.broadcastPresence(ws);
          }

          if (data.type === "CHAT_MESSAGE") {
             // Real-time chat sync across teams
             this.broadcastToWorkspace(ws.workspaceId, {
               type: "NEW_ACTIVITY",
               user: ws.userId,
               action: "sent a message",
               details: data.text
             });
          }
        } catch (e) {
          console.error("[COLLAB WS ERROR]", e);
        }
      });

      ws.on("close", () => {
        if (ws.workspaceId && ws.resourceType && ws.resourceId) {
          console.log(`[COLLAB] User ${ws.userId} disconnected`);
          this.broadcastPresence(ws); // Update others
        }
      });
    });
  }

  private static broadcastPresence(ws: CollaborationClient) {
    if (!this.wss) return;
    
    const presenceData = {
      type: "PRESENCE_UPDATE",
      resourceType: ws.resourceType,
      resourceId: ws.resourceId,
      // We can't easily count here without iterating, so we'll just notify others to refresh
    };

    this.wss.clients.forEach((client: CollaborationClient) => {
      if (client !== ws && client.readyState === WebSocket.OPEN && 
          client.workspaceId === ws.workspaceId && 
          client.resourceType === ws.resourceType && 
          client.resourceId === ws.resourceId) {
        client.send(JSON.stringify(presenceData));
      }
    });
  }

  public static broadcastToWorkspace(workspaceId: number | undefined, data: any) {
    if (!this.wss || !workspaceId) return;
    this.wss.clients.forEach((client: CollaborationClient) => {
      if (client.readyState === WebSocket.OPEN && client.workspaceId === workspaceId) {
        client.send(JSON.stringify(data));
      }
    });
  }
}
