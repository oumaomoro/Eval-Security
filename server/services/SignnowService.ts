/**
 * SignNow API Integration Service
 * Advanced e-Signature workflows for Costloci
 */

const SIGNNOW_API_BASE = 'https://api.signnow.com';
const SIGNNOW_TOKEN = process.env.SIGNNOW_API_KEY;

export class SignnowService {
  /**
   * Create an Embedded Signing Session
   * 1. Uploads document
   * 2. Creates a field (if needed, simplified for now)
   * 3. Generates embedded signing link
   */
  static async createEmbeddedSession(fileBuffer: Buffer, filename: string, signerEmail: string) {
    try {
      // 1. Upload Document
      const doc = await this.uploadDocument(fileBuffer, filename);
      const documentId = doc.id;

      // 2. Create Invite (Embedded)
      const inviteResponse = await fetch(`${SIGNNOW_API_BASE}/v2/documents/${documentId}/embedded-invites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SIGNNOW_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          invites: [{
            email: signerEmail,
            role: 'Signer',
            order: 1
          }]
        })
      });

      if (!inviteResponse.ok) {
        const errorText = await inviteResponse.text();
        throw new Error(`SignNow Embedded Invite Error: ${inviteResponse.status} - ${errorText}`);
      }

      const inviteData = await inviteResponse.json();
      
      // 3. Generate the actual link for the first invite
      const linkResponse = await fetch(`${SIGNNOW_API_BASE}/v2/documents/${documentId}/embedded-invites/${inviteData.data[0].id}/link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SIGNNOW_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auth_method: 'none', link_expiration: 30 })
      });

      if (!linkResponse.ok) {
        throw new Error('Failed to generate SignNow embedded link');
      }

      const linkData = await linkResponse.json();

      return {
        documentId,
        signingUrl: linkData.data.link,
        inviteId: inviteData.data[0].id
      };
    } catch (err: any) {
      console.error('[SignNow Service] Error:', err.message);
      throw err;
    }
  }

  static async uploadDocument(fileBuffer: Buffer, filename: string) {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const preBoundary = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: application/pdf\r\n\r\n`
    );
    const postBoundary = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartBody = Buffer.concat([preBoundary, fileBuffer, postBoundary]);

    const response = await fetch(`${SIGNNOW_API_BASE}/document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SIGNNOW_TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: multipartBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SignNow Upload Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}
