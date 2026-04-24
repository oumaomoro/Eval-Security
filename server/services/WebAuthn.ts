/**
 * WebAuthnService — FIDO2 Passkey registration & authentication.
 * Compliant with @simplewebauthn/server v13 (SimpleWebAuthn v10+ API).
 * RP_ID is resolved at runtime from WEBAUTHN_RP_ID env var (costloci.com in prod).
 */
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { storage } from "../storage.js";

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const RP_NAME = 'Costloci Enterprise';
const EXPECTED_ORIGINS = [
  `https://${RP_ID}`,
  `http://localhost:5000`,
  `http://localhost:3000`,
];

export class WebAuthnService {
  /** Step 1 of registration flow — generate options for client */
  static async generateRegistration(userId: string) {
    const user = await (storage as any).getUser(userId);
    if (!user) throw new Error('User not found');

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      // v13: userID must be a Uint8Array
      userID: new TextEncoder().encode(userId),
      userName: user.email || 'user',
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    return options;
  }

  /** Step 2 of registration flow — verify attestation & persist credential */
  static async verifyRegistration(
    userId: string,
    body: RegistrationResponseJSON,
    currentChallenge: string
  ) {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: currentChallenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
    });

    if (verification.verified && verification.registrationInfo) {
      // v10+: credential lives at registrationInfo.credential
      const { credential, credentialDeviceType, credentialBackedUp } =
        verification.registrationInfo;

      await (storage as any).updateUser(userId, {
        // Store credential.id (base64url string) as webauthnId
        webauthnId: credential.id,
        // Store the full credential object for authentication
        webauthnCredential: JSON.stringify({
          publicKey: Buffer.from(credential.publicKey).toString('base64'),
          counter: credential.counter,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
        }),
        mfaEnabled: true,
      });
    }

    return verification;
  }

  /** Step 1 of authentication flow — generate challenge options */
  static async generateAuthentication(userId: string) {
    const user = await (storage as any).getUser(userId);
    if (!user || !user.webauthnId)
      throw new Error('MFA not provisioned for this account');

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      // v10+: id is a base64url string
      allowCredentials: [{ id: user.webauthnId }],
      userVerification: 'preferred',
    });

    return options;
  }

  /** Step 2 of authentication flow — verify assertion */
  static async verifyAuthentication(
    userId: string,
    body: AuthenticationResponseJSON,
    currentChallenge: string
  ) {
    const user = await (storage as any).getUser(userId);
    if (!user || !user.webauthnCredential || !user.webauthnId)
      throw new Error('User or MFA credential not found');

    const stored = JSON.parse(user.webauthnCredential);

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: currentChallenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
      // v10+: credential replaces the old 'authenticator' key
      credential: {
        id: user.webauthnId as string,
        publicKey: Buffer.from(stored.publicKey, 'base64'),
        counter: stored.counter as number,
      },
    });

    // Update counter after successful auth to prevent replay attacks
    if (verification.verified) {
      const newCounter = verification.authenticationInfo.newCounter;
      const updatedCredential = { ...stored, counter: newCounter };
      await (storage as any).updateUser(userId, {
        webauthnCredential: JSON.stringify(updatedCredential),
      });
    }

    return verification;
  }
}
