"use client";

import React, { useEffect, useRef, useState } from "react";
import { ALLOWED_AUDIO_MIMES, MAX_AUDIO_BYTES } from "@/lib/media-validation";
import { useStudioScene } from "./StudioSceneProvider";

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export function VoiceMessageRecorder() {
  const { scene, setVoiceMessage } = useStudioScene();
  const voice = scene.voiceMessage ?? null;

  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState<
    "idle" | "requesting_mic" | "recording" | "uploading" | "permission_denied" | "unsupported"
  >("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const canRecord =
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== "undefined";
    setSupported(canRecord);
    if (!canRecord) {
      setStatus("unsupported");
    }
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const uploadVoiceBlob = async (fileOrBlob: Blob, filename: string, durationSec: number) => {
    setStatus("uploading");
    setErrorMsg(null);
    try {
      const form = new FormData();
      form.append("kind", "voice");
      form.append("durationSec", String(Math.max(1, Math.round(durationSec))));
      form.append("file", new File([fileOrBlob], filename, { type: fileOrBlob.type || "audio/webm" }));

      const res = await fetch("/api/media", { method: "POST", body: form });
      const data = (await res.json()) as {
        id?: string;
        url?: string;
        mimeType?: string;
        durationSec?: number;
        error?: string;
      };
      if (!res.ok || !data.id || !data.url || !data.mimeType) {
        throw new Error(data.error ?? "Voice upload failed.");
      }

      setVoiceMessage({
        id: data.id,
        url: data.url,
        mimeType: data.mimeType,
        durationSec: data.durationSec ?? durationSec,
      });
      setStatus(supported ? "idle" : "unsupported");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not attach voice note.");
      setStatus(supported ? "idle" : "unsupported");
    }
  };

  const handleStartRecording = async () => {
    setErrorMsg(null);
    if (!supported) {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting_mic");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      setElapsedSec(0);

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const cleanMime = (recorder.mimeType || "audio/webm").split(";")[0]!;
        const blob = new Blob(chunksRef.current, { type: cleanMime });
        if (blob.size > 0) {
          const ext = cleanMime.includes("mp4") ? "m4a" : cleanMime.includes("ogg") ? "ogg" : "webm";
          void uploadVoiceBlob(blob, `voice-note.${ext}`, duration);
        } else {
          setStatus("idle");
        }
      };

      recorder.start(250);
      setStatus("recording");
      timerRef.current = window.setInterval(() => {
        const secs = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsedSec(secs);
        if (secs >= 90 && recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      }, 400);
    } catch {
      setStatus("permission_denied");
      setErrorMsg(
        "Microphone permission was declined or unavailable. You can allow mic access or upload an audio clip below.",
      );
    }
  };

  const handleStopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const handleFallbackAudioSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const cleanMime = file.type.split(";")[0] ?? "";
    if (
      cleanMime &&
      !ALLOWED_AUDIO_MIMES.includes(cleanMime as (typeof ALLOWED_AUDIO_MIMES)[number])
    ) {
      setErrorMsg("Unsupported audio format. Please pick MP3, M4A, WAV, OGG, or WebM.");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setErrorMsg("Audio file exceeds the 5 MB limit.");
      return;
    }

    const tmpUrl = URL.createObjectURL(file);
    const probe = new Audio(tmpUrl);
    probe.onloadedmetadata = () => {
      const dur = Number.isFinite(probe.duration) ? Math.round(probe.duration) : 5;
      URL.revokeObjectURL(tmpUrl);
      void uploadVoiceBlob(file, file.name, dur);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(tmpUrl);
      void uploadVoiceBlob(file, file.name, 5);
    };
  };

  const handleTogglePlayPause = async () => {
    const el = audioElRef.current;
    if (!el) return;
    if (el.paused) {
      try {
        await el.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      el.pause();
    }
  };

  return (
    <div
      data-testid="voice-recorder-section"
      className="rounded-xl border border-[var(--border-hairline)] bg-white p-3 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Personal Voice Note
          </h4>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Record up to 90s for your recipient to play on their unboxing page.
          </p>
        </div>
      </div>

      {errorMsg && (
        <p
          data-testid="voice-error"
          role="alert"
          className="rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-fill)] px-2.5 py-1.5 text-[11px] text-[var(--status-warning-ink)]"
        >
          {errorMsg}
        </p>
      )}

      {!voice ? (
        <div className="space-y-2">
          {status === "recording" ? (
            <div className="flex items-center justify-between rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-fill)] px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--status-error-ink)]">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#B9342C]" />
                <span>Recording</span>
                <span data-testid="voice-duration-display" className="font-mono">
                  {formatDuration(elapsedSec)}
                </span>
              </div>
              <button
                type="button"
                data-testid="stop-recording-btn"
                onClick={handleStopRecording}
                className="rounded-lg bg-[#962D28] px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Stop &amp; Attach
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {supported && (
                <button
                  type="button"
                  data-testid="record-voice-btn"
                  disabled={status === "requesting_mic" || status === "uploading"}
                  onClick={handleStartRecording}
                  className="flex-1 min-h-[36px] rounded-lg border border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] px-3 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white disabled:opacity-55"
                >
                  {status === "requesting_mic"
                    ? "Requesting Mic Permission…"
                    : status === "uploading"
                      ? "Saving Voice Note…"
                      : "● Record Voice Message"}
                </button>
              )}

              <button
                type="button"
                data-testid="voice-upload-fallback-btn"
                disabled={status === "uploading"}
                onClick={() => fallbackInputRef.current?.click()}
                className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
              >
                {supported ? "Upload Audio File" : "Attach Audio File"}
              </button>
              <input
                ref={fallbackInputRef}
                data-testid="voice-fallback-upload-input"
                type="file"
                accept="audio/webm,audio/ogg,audio/mp4,audio/mpeg,audio/wav,.mp3,.m4a,.wav,.webm,.ogg"
                className="hidden"
                onChange={handleFallbackAudioSelected}
              />
            </div>
          )}

          {(status === "unsupported" || status === "permission_denied") && (
            <p
              data-testid="voice-fallback-banner"
              className="text-[11px] leading-relaxed text-[var(--text-muted)]"
            >
              {status === "unsupported"
                ? "Live browser recording is unavailable on this device—you can attach a short MP3, WAV, M4A, or WebM voice clip above."
                : "Microphone access is required for live recording, or upload a recorded voice file directly."}
            </p>
          )}
        </div>
      ) : (
        <div
          data-testid="attached-voice-box"
          className="flex items-center justify-between gap-2 rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary-soft)]/50 px-2.5 py-2"
        >
          <audio
            ref={audioElRef}
            src={voice.url}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              data-testid="voice-play-pause-btn"
              onClick={handleTogglePlayPause}
              className="min-h-[30px] rounded-full bg-[var(--accent-primary)] px-3 text-[11px] font-semibold text-white"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                Voice message attached
              </p>
              <p data-testid="attached-voice-duration" className="font-mono text-[10px] text-[var(--text-muted)]">
                {formatDuration(voice.durationSec)}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="voice-delete-btn"
            onClick={() => {
              if (audioElRef.current) {
                audioElRef.current.pause();
              }
              setIsPlaying(false);
              setVoiceMessage(null);
            }}
            className="min-h-[30px] rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-fill)] px-2.5 text-[11px] font-medium text-[var(--status-error-ink)]"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

