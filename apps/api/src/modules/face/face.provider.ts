import crypto from 'crypto';
import { config } from '../../config/index.js';

export interface IFaceRecognitionProvider {
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number;
  normalizeVector(vector: number[]): number[];
  encryptEmbedding(vector: number[]): string;
  decryptEmbedding(encryptedData: string): number[];
  validateFaceQuality(qualityScore: number, faceCount: number): { valid: boolean; error?: string };
}

export class BiometricFaceProvider implements IFaceRecognitionProvider {
  private encryptionKey: Buffer;

  constructor() {
    // 32-byte key for AES-256-GCM
    const keyHex = config.encryptionKey.padEnd(64, '0').slice(0, 64);
    this.encryptionKey = Buffer.from(keyHex, 'hex');
  }

  /**
   * Calculates Cosine Similarity between two N-dimensional vectors
   * Result is between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized facial features)
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (!vectorA || !vectorB || vectorA.length === 0 || vectorB.length === 0) {
      return 0.0;
    }

    const minLen = Math.min(vectorA.length, vectorB.length);
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < minLen; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0.0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Normalizes a vector to unit length
   */
  normalizeVector(vector: number[]): number[] {
    let sumSq = 0.0;
    for (let i = 0; i < vector.length; i++) {
      sumSq += vector[i] * vector[i];
    }
    const magnitude = Math.sqrt(sumSq);
    if (magnitude === 0) return vector;
    return vector.map((v) => v / magnitude);
  }

  /**
   * Encrypts face embedding array using AES-256-GCM
   * Returns formatted string: "iv_hex:auth_tag_hex:ciphertext_hex"
   */
  encryptEmbedding(vector: number[]): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    const jsonStr = JSON.stringify(vector);
    let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts encrypted embedding string using AES-256-GCM
   */
  decryptEmbedding(encryptedData: string): number[] {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted biometric format');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Validates quality and single face presence
   */
  validateFaceQuality(qualityScore: number, faceCount: number): { valid: boolean; error?: string } {
    if (faceCount === 0) {
      return { valid: false, error: 'No face detected in camera view' };
    }
    if (faceCount > 1) {
      return { valid: false, error: 'Multiple faces detected. Ensure only one person is in frame' };
    }
    if (qualityScore < 0.5) {
      return { valid: false, error: `Face quality score too low (${Math.round(qualityScore * 100)}%). Ensure proper lighting` };
    }
    return { valid: true };
  }
}

export const faceProvider = new BiometricFaceProvider();
