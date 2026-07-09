import { EventEmitter, Subscription } from 'expo-modules-core';
import ExpoMediaSessionModule from './src/ExpoMediaSessionModule';

const emitter = new EventEmitter(ExpoMediaSessionModule);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MediaState {
  /** Empty string when no media session is active */
  title: string;
  artist: string;
  album: string;
  /** Base64 data URI (data:image/jpeg;base64,...) or null if unavailable */
  artwork: string | null;
  /** Total track duration in seconds */
  duration: number;
  /** Current playback position in seconds */
  position: number;
  isPlaying: boolean;
  /** Package name of the media app, e.g. "com.spotify.music" */
  packageName: string;
}

// ─── Playback Commands ────────────────────────────────────────────────────────

export function play(): void {
  ExpoMediaSessionModule.play();
}

export function pause(): void {
  ExpoMediaSessionModule.pause();
}

/** Toggle play/pause based on the current playback state */
export function playPause(): void {
  ExpoMediaSessionModule.playPause();
}

export function next(): void {
  ExpoMediaSessionModule.next();
}

export function previous(): void {
  ExpoMediaSessionModule.previous();
}

/** Seek to a position in the track @param positionSeconds in seconds */
export function seekTo(positionSeconds: number): void {
  ExpoMediaSessionModule.seekTo(Math.floor(positionSeconds));
}

// ─── Permission Helpers ───────────────────────────────────────────────────────

/** Returns true if the user has granted Notification Access to this app */
export function checkNotificationAccess(): boolean {
  return ExpoMediaSessionModule.checkNotificationAccess();
}

/** Opens the Android Notification Listener Settings screen */
export function promptNotificationAccess(): void {
  ExpoMediaSessionModule.promptNotificationAccess();
}

// ─── Event Listener ───────────────────────────────────────────────────────────

/**
 * Subscribe to real-time media state updates.
 * The listener is called immediately with the current state, and on every
 * playback or metadata change — driven by Android MediaController callbacks,
 * not polling.
 */
export function addMediaUpdateListener(listener: (event: MediaState) => void): Subscription {
  return emitter.addListener<MediaState>('onMediaUpdate', listener);
}
