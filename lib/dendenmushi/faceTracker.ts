export interface FaceTrackingCoords {
  x: number; // -1 (left) to +1 (right)
  y: number; // -1 (down) to +1 (up)
  isDetected: boolean;
}

type TrackCallback = (coords: FaceTrackingCoords, video: HTMLVideoElement | null) => void;

class FaceTracker {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private callback: TrackCallback | null = null;
  private currentCoords: FaceTrackingCoords = { x: 0, y: 0, isDetected: false };
  private smoothedX: number = 0;
  private smoothedY: number = 0;
  private faceDetector: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        this.faceDetector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      } catch (e) {
        this.faceDetector = null;
      }
    }
  }

  public async start(cb: TrackCallback): Promise<boolean> {
    if (this.isRunning) {
      this.callback = cb;
      return true;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user'
        },
        audio: false
      });

      this.video = document.createElement('video');
      this.video.setAttribute('playsinline', 'true');
      this.video.setAttribute('autoplay', 'true');
      this.video.muted = true;
      this.video.srcObject = this.stream;

      await this.video.play();

      this.canvas = document.createElement('canvas');
      this.canvas.width = 64;
      this.canvas.height = 48;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

      this.isRunning = true;
      this.callback = cb;
      this.loop();
      return true;
    } catch (err) {
      console.warn('Face tracker camera error:', err);
      this.stop();
      return false;
    }
  }

  private loop = async () => {
    if (!this.isRunning || !this.video) return;

    if (this.video.readyState >= 2) {
      let detectedX = 0;
      let detectedY = 0;
      let isFaceFound = false;

      // Method 1: Try Native FaceDetector API (available in modern Chromium/Edge)
      if (this.faceDetector) {
        try {
          const faces = await this.faceDetector.detect(this.video);
          if (faces && faces.length > 0) {
            const face = faces[0].boundingBox;
            const centerX = face.x + face.width / 2;
            const centerY = face.y + face.height / 2;
            // Mirror X because camera is selfie view
            detectedX = -((centerX / this.video.videoWidth) * 2 - 1);
            detectedY = -((centerY / this.video.videoHeight) * 2 - 1);
            isFaceFound = true;
          }
        } catch (e) {}
      }

      // Method 2: Fast Skin Chroma & Brightness Centroid Detection (Universal Fallback)
      if (!isFaceFound && this.ctx && this.canvas) {
        this.ctx.drawImage(this.video, 0, 0, 64, 48);
        const imgData = this.ctx.getImageData(0, 0, 64, 48);
        const data = imgData.data;

        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;

        for (let y = 4; y < 44; y += 2) {
          for (let x = 4; x < 60; x += 2) {
            const idx = (y * 64 + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Skin tone heuristic check in RGB space
            const isSkin = r > 65 && g > 40 && b > 20 && r > g && (r - g) > 12 && (r - b) > 12;
            if (isSkin) {
              const weight = 1 + (r / 255);
              weightedX += x * weight;
              weightedY += y * weight;
              totalWeight += weight;
            }
          }
        }

        if (totalWeight > 20) {
          const avgX = weightedX / totalWeight;
          const avgY = weightedY / totalWeight;
          // Invert X for mirror effect
          detectedX = -((avgX / 64) * 2 - 1);
          detectedY = -((avgY / 48) * 2 - 1);
          isFaceFound = true;
        }
      }

      if (isFaceFound) {
        // Clamp bounds to [-1, 1]
        detectedX = Math.max(-1, Math.min(1, detectedX));
        detectedY = Math.max(-1, Math.min(1, detectedY));

        // Smooth with exponential filter
        this.smoothedX = this.smoothedX * 0.75 + detectedX * 0.25;
        this.smoothedY = this.smoothedY * 0.75 + detectedY * 0.25;

        this.currentCoords = {
          x: this.smoothedX,
          y: this.smoothedY,
          isDetected: true
        };
      } else {
        // Drift slowly back towards center if face temporarily lost
        this.smoothedX *= 0.95;
        this.smoothedY *= 0.95;
        this.currentCoords = {
          x: this.smoothedX,
          y: this.smoothedY,
          isDetected: false
        };
      }

      if (this.callback) {
        this.callback(this.currentCoords, this.video);
      }
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.callback = null;
    this.currentCoords = { x: 0, y: 0, isDetected: false };
    this.smoothedX = 0;
    this.smoothedY = 0;
  }

  public getCoords(): FaceTrackingCoords {
    return this.currentCoords;
  }

  public getIsActive(): boolean {
    return this.isRunning;
  }
}

export const faceTracker = new FaceTracker();
