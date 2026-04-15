import { storage } from "../storage";
import fetch from "node-fetch";

/**
 * Enterprise Option C: Notification Webhooks Service
 * Manages dispatching autonomic alerts to organizational Slack or Microsoft Teams channels.
 */
export class NotificationService {
  
  static async dispatch(clientId: number, event: string, payload: any) {
    try {
      const channels = await storage.getNotificationChannels(clientId);
      if (!channels || channels.length === 0) return;

      const activeChannels = channels.filter(c => c.is_active && c.events && c.events.includes(event));
      
      for (const channel of activeChannels) {
        let messageBody = {};
        
        if (channel.provider === 'slack') {
          messageBody = this.formatSlackMessage(event, payload);
        } else if (channel.provider === 'teams') {
          messageBody = this.formatTeamsMessage(event, payload);
        } else {
          messageBody = payload;
        }

        fetch(channel.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageBody)
        }).catch(err => {
          console.error(`[WEBHOOK FIRED ERRROR] Failed to send ${event} to ${channel.provider}: ${err.message}`);
        });
      }
    } catch (err: any) {
      console.error(`[WEBHOOK DISPATCH FAILURE] Could not dispatch ${event}: ${err.message}`);
    }
  }

  private static formatSlackMessage(event: string, payload: any) {
    let text = `*New Enterprise Alert: ${event}*\n`;
    if (payload.title) text += `> ${payload.title}\n`;
    if (payload.details) text += `> ${payload.details}`;
    
    return { text, blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text }
      }
    ] };
  }

  private static formatTeamsMessage(event: string, payload: any) {
    return {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0076D7",
      "summary": `Enterprise Alert: ${event}`,
      "sections": [{
        "activityTitle": `New Event: ${event}`,
        "activitySubtitle": payload.title || "Platform Event",
        "text": payload.details || "No details provided."
      }]
    };
  }
}
