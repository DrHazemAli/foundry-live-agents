import { useState, useCallback, useEffect, useRef } from 'react';
import { AudioCapture } from '../services/audioCapture';
import { useConnectionStore } from '../stores/connectionStore';

export function useAudioCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [volume, setVolume] = useState(0);
  const captureRef = useRef<AudioCapture | null>(null);
  const volumeIntervalRef = useRef<number | null>(null);
  
  const { addAudioBytesSent } = useConnectionStore();

  const startCapture = useCallback(async (onAudioData: (data: ArrayBuffer) => void) => {
    if (isCapturing) {
      console.warn('Already capturing');
      return;
    }

    try {
      const capture = new AudioCapture();
      captureRef.current = capture;

      await capture.start((data) => {
        onAudioData(data);
        addAudioBytesSent(data.byteLength);
      });

      setIsCapturing(true);

      // Start volume monitoring
      volumeIntervalRef.current = setInterval(() => {
        if (captureRef.current) {
          const currentVolume = captureRef.current.getVolume();
          setVolume(currentVolume);
        }
      }, 100) as unknown as number;

    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }, [isCapturing, addAudioBytesSent]);

  const stopCapture = useCallback(() => {
    if (captureRef.current) {
      captureRef.current.stop();
      captureRef.current = null;
    }

    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    setIsCapturing(false);
    setVolume(0);
  }, []);

  const toggleCapture = useCallback((onAudioData: (data: ArrayBuffer) => void) => {
    if (isCapturing) {
      stopCapture();
    } else {
      startCapture(onAudioData);
    }
  }, [isCapturing, startCapture, stopCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    isCapturing,
    volume,
    startCapture,
    stopCapture,
    toggleCapture,
    audioContext: captureRef.current?.getAudioContext() ?? null,
  };
}
