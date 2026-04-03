export class NotifierService {
  /**
   * Dispatch a notification to a workspace's webhook (Slack/Teams).
   * Generates a rich, block-formatted message for premium presentation.
   */
  static async dispatch(
    webhookUrl: string | null | undefined, 
    enabled: boolean | null | undefined,
    title: string, 
    message: string, 
    severity: 'info' | 'warning' | 'critical' = 'info'
  ) {
    if (!enabled || !webhookUrl) return false;

    const colors = {
      info: "#3b82f6",     // blue
      warning: "#f59e0b",  // amber
      critical: "#ef4444"  // red
    };

    const payload = {
      attachments: [
        {
          color: colors[severity],
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: title,
                emoji: true
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: message
              }
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `*CyberOptimize Autonomic Engine* • ${new Date().toISOString()}`
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (err) {
      console.error("[NotifierService] Webhook dispatch failed:", err);
      return false;
    }
  }
}
