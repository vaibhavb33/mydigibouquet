export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4 MB max stored cropped photo
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB max voice note
export const MAX_PHOTOS_PER_BOUQUET = 6;
export const MAX_VOICE_DURATION_SEC = 180;

export const ALLOWED_PHOTO_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_AUDIO_MIMES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
] as const;

export type AllowedPhotoMime = (typeof ALLOWED_PHOTO_MIMES)[number];
export type AllowedAudioMime = (typeof ALLOWED_AUDIO_MIMES)[number];

/**
 * Verifies raw file binary headers so spoofed extensions or XSS-prone XML/SVG
 * payloads can never pass photo validation.
 */
export function detectPhotoMimeFromBytes(bytes: Uint8Array): AllowedPhotoMime | null {
  if (bytes.length < 12) return null;

  // Reject any leading ASCII XML/HTML/SVG signatures explicitly
  const headAscii = Buffer.from(bytes.slice(0, 64)).toString("utf8").trimStart().toLowerCase();
  if (headAscii.startsWith("<svg") || headAscii.startsWith("<?xml") || headAscii.startsWith("<html")) {
    return null;
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Verifies raw container magic bytes for recorded or uploaded voice messages.
 */
export function detectAudioMimeFromBytes(
  bytes: Uint8Array,
  declaredMime?: string,
): AllowedAudioMime | null {
  if (bytes.length < 12) return null;

  // WebM / Matroska EBML header: 1A 45 DF A3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return "audio/webm";
  }

  // Ogg: OggS
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return "audio/ogg";
  }

  // RIFF....WAVE
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return "audio/wav";
  }

  // ISO BMFF (M4A/MP4): ....ftyp
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return "audio/mp4";
  }

  // MP3: ID3 tag or MPEG ADTS/frame sync
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0 && declaredMime?.includes("mpeg"))
  ) {
    return "audio/mpeg";
  }

  return null;
}

