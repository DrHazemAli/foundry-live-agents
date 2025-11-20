import React from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';

interface MicrophoneButtonProps {
  isCapturing: boolean;
  isProcessing?: boolean;
  volume: number;
  onToggle: () => void;
  disabled?: boolean;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isCapturing,
  isProcessing = false,
  volume,
  onToggle,
  disabled = false,
}) => {
  const getVolumeColor = () => {
    if (volume < 20) return 'bg-green-500';
    if (volume < 50) return 'bg-yellow-500';
    if (volume < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="microphone-button-container flex flex-col items-center gap-2">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          disabled
            ? 'bg-gray-300 cursor-not-allowed'
            : isCapturing
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isProcessing ? (
          <Loader className="text-white animate-spin" size={32} />
        ) : isCapturing ? (
          <Mic className="text-white" size={32} />
        ) : (
          <MicOff className="text-white" size={32} />
        )}

        {/* Volume ring indicator */}
        {isCapturing && !isProcessing && (
          <div
            className="absolute inset-0 rounded-full border-4 transition-all"
            style={{
              borderColor: `rgba(255, 255, 255, ${volume / 100})`,
              transform: `scale(${1 + volume / 200})`,
            }}
          />
        )}
      </button>

      {/* Volume bar */}
      {isCapturing && (
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${getVolumeColor()}`}
            style={{ width: `${Math.min(volume, 100)}%` }}
          />
        </div>
      )}

      {/* Status text */}
      <span className="text-sm font-medium text-gray-700">
        {disabled
          ? 'Disconnected'
          : isProcessing
          ? 'Processing...'
          : isCapturing
          ? 'Listening'
          : 'Click to speak'}
      </span>
    </div>
  );
};
