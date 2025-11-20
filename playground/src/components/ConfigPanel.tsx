import React from 'react';
import { Settings, Sliders, Mic, Volume2 } from 'lucide-react';
import type { VADType } from '../types';

interface ConfigPanelProps {
  temperature: number;
  onTemperatureChange: (value: number) => void;
  vadType: VADType;
  onVADTypeChange: (value: VADType) => void;
  vadThreshold: number;
  onVADThresholdChange: (value: number) => void;
  vadSilenceDuration: number;
  onVADSilenceDurationChange: (value: number) => void;
  instructions: string;
  onInstructionsChange: (value: string) => void;
  disabled?: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  temperature,
  onTemperatureChange,
  vadType,
  onVADTypeChange,
  vadThreshold,
  onVADThresholdChange,
  vadSilenceDuration,
  onVADSilenceDurationChange,
  instructions,
  onInstructionsChange,
  disabled = false,
}) => {
  const vadTypes: { value: VADType; label: string; description: string }[] = [
    { value: 'server_vad', label: 'Server VAD', description: 'Basic voice activity detection' },
    { value: 'semantic_vad', label: 'Semantic VAD', description: 'Advanced context-aware detection' },
    { value: 'azure_semantic_vad', label: 'Azure Semantic', description: 'Azure enhanced semantic VAD' },
    { value: 'azure_semantic_vad_multilingual', label: 'Azure Multilingual', description: 'Multilingual semantic VAD' },
  ];

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          <Settings size={16} />
          Agent Instructions
        </label>
        <textarea
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder="Enter custom instructions for the agent..."
          className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Define the agent's personality, behavior, and knowledge
        </p>
      </div>

      {/* Temperature */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-2">
            <Sliders size={16} />
            Temperature
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-mono">{temperature.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Focused (0.0)</span>
          <span>Creative (1.0)</span>
        </div>
      </div>

      {/* VAD Type */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          <Mic size={16} />
          Voice Activity Detection
        </label>
        <select
          value={vadType}
          onChange={(e) => onVADTypeChange(e.target.value as VADType)}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {vadTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {vadTypes.find(t => t.value === vadType)?.description}
        </p>
      </div>

      {/* VAD Threshold */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-2">
            <Volume2 size={16} />
            VAD Threshold
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-mono">{vadThreshold.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={vadThreshold}
          onChange={(e) => onVADThresholdChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Sensitive (0.0)</span>
          <span>Strict (1.0)</span>
        </div>
      </div>

      {/* Silence Duration */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          <span>Silence Duration</span>
          <span className="text-blue-600 dark:text-blue-400 font-mono">{vadSilenceDuration}ms</span>
        </label>
        <input
          type="range"
          min="200"
          max="2000"
          step="100"
          value={vadSilenceDuration}
          onChange={(e) => onVADSilenceDurationChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Quick (200ms)</span>
          <span>Patient (2000ms)</span>
        </div>
      </div>
    </div>
  );
};
