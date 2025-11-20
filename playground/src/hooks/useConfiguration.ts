import { useCallback } from 'react';
import { useConfigStore } from '../stores/configStore';
import type { SessionConfig, ModelType, VADType, AudioFormat } from '../types';

export function useConfiguration() {
  const {
    config,
    apiKey,
    region,
    deployment,
    setApiKey,
    setRegion,
    setDeployment,
    updateConfig,
    setModel,
    setVoice,
    setInstructions,
    setVADType,
    setVADThreshold,
    setVADSilenceDuration,
    setTemperature,
    setMaxTokens,
    setAudioFormat,
    enableDeepNoiseSuppression,
    enableEchoCancellation,
    resetConfig,
    loadPreset,
  } = useConfigStore();

  const updateConnectionSettings = useCallback((settings: {
    apiKey?: string;
    region?: string;
    deployment?: string;
  }) => {
    if (settings.apiKey !== undefined) setApiKey(settings.apiKey);
    if (settings.region !== undefined) setRegion(settings.region);
    if (settings.deployment !== undefined) setDeployment(settings.deployment);
  }, [setApiKey, setRegion, setDeployment]);

  const updateVADSettings = useCallback((settings: {
    type?: VADType;
    threshold?: number;
    silenceDuration?: number;
  }) => {
    if (settings.type) setVADType(settings.type);
    if (settings.threshold !== undefined) setVADThreshold(settings.threshold);
    if (settings.silenceDuration !== undefined) setVADSilenceDuration(settings.silenceDuration);
  }, [setVADType, setVADThreshold, setVADSilenceDuration]);

  const updateModelSettings = useCallback((settings: {
    model?: ModelType;
    temperature?: number;
    maxTokens?: number;
  }) => {
    if (settings.model) setModel(settings.model);
    if (settings.temperature !== undefined) setTemperature(settings.temperature);
    if (settings.maxTokens !== undefined) setMaxTokens(settings.maxTokens);
  }, [setModel, setTemperature, setMaxTokens]);

  const updateAudioSettings = useCallback((settings: {
    inputFormat?: AudioFormat;
    outputFormat?: AudioFormat;
    deepNoiseSuppression?: boolean;
    echoCancellation?: boolean;
  }) => {
    if (settings.inputFormat && settings.outputFormat) {
      setAudioFormat(settings.inputFormat, settings.outputFormat);
    }
    if (settings.deepNoiseSuppression !== undefined) {
      enableDeepNoiseSuppression(settings.deepNoiseSuppression);
    }
    if (settings.echoCancellation !== undefined) {
      enableEchoCancellation(settings.echoCancellation);
    }
  }, [setAudioFormat, enableDeepNoiseSuppression, enableEchoCancellation]);

  const exportConfig = useCallback(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  const importConfig = useCallback((configJson: string) => {
    try {
      const imported = JSON.parse(configJson) as Partial<SessionConfig>;
      updateConfig(imported);
    } catch (error) {
      console.error('Failed to import config:', error);
      throw new Error('Invalid configuration JSON');
    }
  }, [updateConfig]);

  return {
    // Current config
    config,
    apiKey,
    region,
    deployment,

    // Update methods
    updateConfig,
    setModel,
    setVoice,
    setInstructions,
    setTemperature,
    updateConnectionSettings,
    updateVADSettings,
    updateModelSettings,
    updateAudioSettings,

    // Presets
    loadPreset,
    resetConfig,

    // Import/Export
    exportConfig,
    importConfig,
  };
}
