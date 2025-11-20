export class AudioAnalyzer {
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private animationFrameId: number | null = null;
  private onDataCallback: ((data: { volume: number; frequency: number[]; isSpeaking: boolean }) => void) | null = null;

  initialize(audioContext: AudioContext, sourceNode: AudioNode): void {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    sourceNode.connect(this.analyser);

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
  }

  startAnalysis(callback: (data: { volume: number; frequency: number[]; isSpeaking: boolean }) => void): void {
    if (!this.analyser || !this.dataArray) {
      console.warn('Analyzer not initialized');
      return;
    }

    this.onDataCallback = callback;
    this.analyze();
  }

  stopAnalysis(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.onDataCallback = null;
  }

  private analyze = (): void => {
    if (!this.analyser || !this.dataArray || !this.onDataCallback) return;

    this.animationFrameId = requestAnimationFrame(this.analyze);

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate volume (average of all frequencies)
    const sum = this.dataArray.reduce((a, b) => a + b, 0);
    const average = sum / this.dataArray.length;
    const volume = Math.round((average / 255) * 100);

    // Get frequency spectrum (sample every 8th value for visualization)
    const frequency: number[] = [];
    for (let i = 0; i < this.dataArray.length; i += 8) {
      frequency.push(this.dataArray[i]);
    }

    // Determine if speaking (volume above threshold)
    const isSpeaking = volume > 5; // Adjust threshold as needed

    this.onDataCallback({ volume, frequency, isSpeaking });
  };

  getVolume(): number {
    if (!this.analyser || !this.dataArray) return 0;

    this.analyser.getByteFrequencyData(this.dataArray);
    const sum = this.dataArray.reduce((a, b) => a + b, 0);
    const average = sum / this.dataArray.length;
    
    return Math.round((average / 255) * 100);
  }

  getFrequencyData(): number[] {
    if (!this.analyser || !this.dataArray) return [];

    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Sample every 8th value for manageable array size
    const frequency: number[] = [];
    for (let i = 0; i < this.dataArray.length; i += 8) {
      frequency.push(this.dataArray[i]);
    }
    
    return frequency;
  }

  disconnect(): void {
    this.stopAnalysis();
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    this.dataArray = null;
  }
}
