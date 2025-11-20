export class AudioCapture {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private isCapturing = false;
  private onAudioDataCallback: ((data: ArrayBuffer) => void) | null = null;

  async start(onAudioData: (data: ArrayBuffer) => void): Promise<void> {
    if (this.isCapturing) {
      console.warn('Audio capture already started');
      return;
    }

    this.onAudioDataCallback = onAudioData;

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create processor for audio data
      const bufferSize = 4096;
      this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.processorNode.onaudioprocess = (event) => {
        if (!this.isCapturing) return;

        const inputData = event.inputBuffer.getChannelData(0);
        const pcm16Data = this.floatToPCM16(inputData);

        if (this.onAudioDataCallback) {
          this.onAudioDataCallback(pcm16Data.buffer as ArrayBuffer);
        }
      };

      // Connect nodes
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      this.isCapturing = true;
      console.log('Audio capture started');
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }

  stop(): void {
    if (!this.isCapturing) return;

    this.isCapturing = false;

    // Disconnect nodes
    if (this.sourceNode && this.processorNode) {
      this.sourceNode.disconnect();
      this.processorNode.disconnect();
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.sourceNode = null;
    this.processorNode = null;
    this.onAudioDataCallback = null;

    console.log('Audio capture stopped');
  }

  isActive(): boolean {
    return this.isCapturing;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  private floatToPCM16(float32Array: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to [-1, 1]
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to 16-bit PCM
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  }

  // Get current input volume level (0-100)
  getVolume(): number {
    if (!this.audioContext || !this.sourceNode) return 0;

    const analyser = this.audioContext.createAnalyser();
    this.sourceNode.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / dataArray.length;
    
    return Math.round((average / 255) * 100);
  }
}
