export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private onPlaybackEndCallback: (() => void) | null = null;

  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    this.audioQueue.push(audioData);

    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  async playPCM16(pcm16Data: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    try {
      // Convert PCM16 to Float32Array for Web Audio API
      const int16Array = new Int16Array(pcm16Data);
      const float32Array = new Float32Array(int16Array.length);
      
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
      }

      // Create audio buffer
      const audioBuffer = this.audioContext!.createBuffer(
        1, // mono
        float32Array.length,
        this.audioContext!.sampleRate
      );

      audioBuffer.getChannelData(0).set(float32Array);

      // Play the buffer
      await this.playBuffer(audioBuffer);
    } catch (error) {
      console.error('Failed to play PCM16 audio:', error);
      throw error;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      if (this.onPlaybackEndCallback) {
        this.onPlaybackEndCallback();
      }
      return;
    }

    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;

    try {
      await this.playPCM16(audioData);
      // Continue to next item in queue
      this.processQueue();
    } catch (error) {
      console.error('Error processing audio queue:', error);
      this.processQueue(); // Continue despite error
    }
  }

  private playBuffer(audioBuffer: AudioBuffer): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve();
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      source.onended = () => {
        this.currentSource = null;
        resolve();
      };

      this.currentSource = source;
      source.start();
    });
  }

  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }

    this.audioQueue = [];
    this.isPlaying = false;
  }

  clear(): void {
    this.audioQueue = [];
  }

  onPlaybackEnd(callback: () => void): void {
    this.onPlaybackEndCallback = callback;
  }

  isActive(): boolean {
    return this.isPlaying;
  }

  getQueueLength(): number {
    return this.audioQueue.length;
  }

  async close(): Promise<void> {
    this.stop();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}
