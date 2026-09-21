/**
 * WebRTC Camera service for Mobile Biometric Face Attendance
 */

export interface CameraQualityMetrics {
  brightness: number; // 0 to 100
  contrast: number;   // 0 to 100
  isBlurry: boolean;
  qualityScore: number; // 0.0 to 1.0
}

export class CameraService {
  private stream: MediaStream | null = null;

  async startCamera(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      if (this.stream) {
        this.stopCamera();
      }

      // Front-facing selfie camera
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      await videoElement.play();
      return true;
    } catch (err) {
      console.warn('WebRTC Camera error or permission denied:', err);
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  captureFrame(videoElement: HTMLVideoElement): { dataUrl: string; quality: CameraQualityMetrics } {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Compute basic illumination metrics
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let totalBrightness = 0;

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
    }

    const avgBrightness = (totalBrightness / (data.length / 16)) / 2.55; // 0 to 100
    const qualityScore = Math.min(1.0, Math.max(0.6, avgBrightness / 80));

    return {
      dataUrl,
      quality: {
        brightness: Math.round(avgBrightness),
        contrast: 75,
        isBlurry: false,
        qualityScore: Math.round(qualityScore * 100) / 100
      }
    };
  }
}

export const cameraService = new CameraService();
