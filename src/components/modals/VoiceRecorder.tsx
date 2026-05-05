import { useEffect, useRef, useState, useCallback } from 'react';

export interface RecordedAudio {
  audioBlob: ArrayBuffer;
  audioMime: string;
}

interface Props {
  value: RecordedAudio | null;
  onChange: (next: RecordedAudio | null) => void;
}

const MAX_RECORD_MS = 10000;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ACCEPTED_AUDIO = 'audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/mp4,audio/m4a,audio/x-m4a,audio/ogg,audio/webm,audio/*';

type Status = 'idle' | 'recording' | 'denied' | 'error';

export function VoiceRecorder({ value, onChange }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // MediaRecorder availability — Safari iOS got support around 14.5; older WebViews
  // and very old Android browsers may lack it. When unavailable we hide the
  // record button and only offer Upload, per spec.
  const recordSupported = typeof window !== 'undefined'
    && typeof MediaRecorder !== 'undefined'
    && !!navigator.mediaDevices
    && typeof navigator.mediaDevices.getUserMedia === 'function';

  // Build/refresh the preview URL whenever the audio value changes. Probes
  // duration via a hidden Audio element so the UI can show "2.3 seconds".
  useEffect(() => {
    if (!value) {
      setPreviewUrl((cur) => { if (cur) URL.revokeObjectURL(cur); return null; });
      setDuration(null);
      setIsPlaying(false);
      return;
    }
    const blob = new Blob([value.audioBlob], { type: value.audioMime || 'audio/webm' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    const probe = new Audio(url);
    probe.onloadedmetadata = () => {
      // Some encoders report Infinity until we seek; clamp here for sanity.
      const d = isFinite(probe.duration) ? probe.duration : 0;
      setDuration(d > 0 ? d : null);
    };
    return () => { URL.revokeObjectURL(url); };
  }, [value]);

  // Stop and clean up everything on unmount so a recording-in-progress
  // doesn't survive a closed modal.
  useEffect(() => () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (tickTimerRef.current) { window.clearInterval(tickTimerRef.current); tickTimerRef.current = null; }
    if (stopTimerRef.current) { window.clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
    setStatus('idle');
  }, []);

  const startRecording = useCallback(async () => {
    if (!recordSupported) return;
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const buffer = await blob.arrayBuffer();
        onChange({ audioBlob: buffer, audioMime: blob.type });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorder.start();
      setStatus('recording');
      const startTs = Date.now();
      setElapsedMs(0);
      tickTimerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startTs);
      }, 100);
      stopTimerRef.current = window.setTimeout(() => stopRecording(), MAX_RECORD_MS);
    } catch (err) {
      const name = (err as Error).name;
      const isPermission = name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError';
      setStatus(isPermission ? 'denied' : 'error');
      setErrorMsg(isPermission
        ? 'Microphone access is needed to record. Please allow microphone access in your browser settings.'
        : `Could not start recording${name ? ` (${name})` : ''}.`);
    }
  }, [recordSupported, onChange, stopRecording]);

  const handleUpload = useCallback(async (file: File | null) => {
    if (!file) return;
    setErrorMsg(null);
    if (!file.type.startsWith('audio/')) {
      setErrorMsg('Please choose an audio file (MP3, WAV, M4A, OGG, or WEBM).');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorMsg(`Audio is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 2 MB.`);
      return;
    }
    const buffer = await file.arrayBuffer();
    onChange({ audioBlob: buffer, audioMime: file.type || 'audio/webm' });
  }, [onChange]);

  const handlePlayToggle = useCallback(() => {
    if (!previewUrl) return;
    if (isPlaying) {
      audioRef.current?.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }
    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
    audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
    audio.play().then(() => setIsPlaying(true)).catch(() => { /* ignore */ });
  }, [previewUrl, isPlaying]);

  const handleDelete = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
    onChange(null);
  }, [onChange]);

  // ── Recording in progress ──
  if (status === 'recording') {
    const seconds = (elapsedMs / 1000).toFixed(1);
    const pct = Math.min(100, (elapsedMs / MAX_RECORD_MS) * 100);
    return (
      <div className="voice-recorder">
        <div className="voice-rec-active">
          <div className="voice-rec-pulse" aria-hidden="true">
            <span className="voice-rec-dot" />
          </div>
          <button
            type="button"
            className="voice-rec-stop"
            onClick={stopRecording}
            aria-label="Stop recording"
          >
            <span className="voice-rec-stop-glyph" aria-hidden="true" />
            Stop
          </button>
          <div className="voice-rec-meter">
            <span className="voice-rec-time">{seconds}s / 10s</span>
            <div className="voice-rec-bar">
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Has a recording ──
  if (value) {
    return (
      <div className="voice-recorder">
        <div className="voice-rec-saved">
          <button
            type="button"
            className={`voice-rec-action voice-rec-play${isPlaying ? ' active' : ''}`}
            onClick={handlePlayToggle}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? '⏸' : '▶'}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          {recordSupported && (
            <button
              type="button"
              className="voice-rec-action voice-rec-redo"
              onClick={() => { handleDelete(); window.setTimeout(() => startRecording(), 50); }}
              aria-label="Re-record"
            >
              🔄 <span>Re-record</span>
            </button>
          )}
          <button
            type="button"
            className="voice-rec-action voice-rec-delete"
            onClick={handleDelete}
            aria-label="Delete recording"
          >
            🗑 <span>Delete</span>
          </button>
        </div>
        <p className="voice-rec-meta">
          {duration ? `Saved · ${duration.toFixed(1)} seconds` : 'Saved recording'}
        </p>
      </div>
    );
  }

  // ── Idle / no recording yet ──
  return (
    <div className="voice-recorder">
      <div className="voice-rec-actions">
        {recordSupported ? (
          <button
            type="button"
            className="voice-rec-record-btn"
            onClick={startRecording}
            aria-label="Start recording"
          >
            <span className="voice-rec-record-circle" aria-hidden="true">🎤</span>
            <span className="voice-rec-record-label">Record</span>
          </button>
        ) : null}
        <button
          type="button"
          className="voice-rec-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload audio file"
        >
          📁 Upload Audio
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_AUDIO}
          hidden
          onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
        />
      </div>
      <p className="voice-rec-hint">
        {recordSupported
          ? 'Tap Record to capture up to 10 seconds, or upload an audio file (MP3/WAV/M4A/OGG/WEBM, max 2 MB).'
          : 'Recording isn\'t supported on this browser — upload an audio file instead (MP3/WAV/M4A/OGG/WEBM, max 2 MB).'}
      </p>
      {status === 'denied' && errorMsg && (
        <p className="voice-rec-error">🎙 {errorMsg}</p>
      )}
      {status === 'error' && errorMsg && (
        <p className="voice-rec-error">{errorMsg}</p>
      )}
      {errorMsg && status === 'idle' && (
        <p className="voice-rec-error">{errorMsg}</p>
      )}
    </div>
  );
}
