import { storage } from "../storage.js";

/**
 * SOVEREIGN NOTIFICATION SERVICE - Phase 26 Enterprise Gateway
 * Handles delivery of system events to external webhooks (Slack, MS Teams).
 */
export class NotificationService {
  /**
   * Broadcast a specific event to all configured channels for a workspace.
   */
  static async broadcastEvent(workspaceId: number, eventType: string, payload: {
    title: string;
    message: string;
    link?: string;
    severity?: "info" | "warning" | "critical";
  }) {
    try {
      const channels = await storage.getNotificationChannels(workspaceId);
      const workspaceChannels = channels.filter(c => c.is_active);

      if (!workspaceChannels.length) return;

      const promises = workspaceChannels.map(channel => {
        // Only send if the event type is subscribed or subscription is empty (all)
        if (channel.events && channel.events.length > 0 && !channel.events.includes(eventType)) {
          return Promise.resolve();
        }

        return this.sendToWebhook(channel.webhook_url, channel.provider, payload);
      });

      await Promise.allSettled(promises);
    } catch (error: any) {
      console.error(`[NOTIFICATION SERVICE] Broadcast failed for workspace ${workspaceId}:`, error.message);
    }
  }

  /**
   * Send a formatted payload to a specific webhook provider.
   */
  private static async sendToWebhook(url: string, provider: string, payload: any) {
    let body = {};

    if (provider === "slack") {
      body = {
        text: `*${payload.title}*\n${payload.message}${payload.link ? `\n<${payload.link}|View in Costloci>` : ""}`,
        attachments: payload.severity === "critical" ? [{ color: "#ef4444", text: "Urgent Attention Required" }] : []
      };
    } else if (provider === "teams") {
      body = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": payload.severity === "critical" ? "FF0000" : "0076D7",
        "summary": payload.title,
        "sections": [{
          "activityTitle": payload.title,
          "activitySubtitle": payload.message,
          "potentialAction": payload.link ? [{
            "@type": "OpenUri",
            "name": "View in Costloci",
            "targets": [{ "os": "default", "uri": payload.link }]
          }] : []
        }]
      };
    } else {
      // Generic Webhook
      body = payload;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }
  }
}
