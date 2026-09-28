// Web Audio & Real Audio File Player for Grand Line Emergency Network

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private normalAudio: HTMLAudioElement | null = null;
  private emergencyAudio: HTMLAudioElement | null = null;
  private callCutAudio: HTMLAudioElement | null = null;
  private alertAudio: HTMLAudioElement | null = null;

  private isRinging: boolean = false;
  private isSirenActive: boolean = false;
  private speechSynth: SpeechSynthesis | null = null;
  private recognition: any = null;

  public onVolumeUpdate?: (volume: number) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      if ('speechSynthesis' in window) {
        this.speechSynth = window.speechSynthesis;
      }

      // Preload user's authentic mpeg audio files
      this.normalAudio = new Audio('/audio/normal_puru.mpeg');
      this.normalAudio.loop = true;

      this.emergencyAudio = new Audio('/audio/emergency_puru.mpeg');
      this.emergencyAudio.loop = true;

      this.callCutAudio = new Audio('/audio/call_cut.mpeg');
      this.alertAudio = new Audio('/audio/msg_sent_alert.mpeg');
    }
  }

  private ensureAudioContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // 1. DEN DEN MUSHI NORMAL PURUPURUPURU RINGTONE
  public startPurupuru() {
    if (this.isRinging) return;
    this.ensureAudioContext();
    this.isRinging = true;

    if (this.normalAudio) {
      this.normalAudio.currentTime = 0;
      this.normalAudio.play().catch(() => {
        // Fallback to synth oscillator if autoplay restricted
        this.playSynthPurupuru();
      });
    } else {
      this.playSynthPurupuru();
    }
  }

  public stopPurupuru() {
    this.isRinging = false;
    if (this.normalAudio) {
      this.normalAudio.pause();
      this.normalAudio.currentTime = 0;
    }
  }

  private playSynthPurupuru() {
    if (!this.audioCtx || !this.isRinging) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(820, now);
    gain.gain.setValueAtTime(0.2, now);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  // 2. DEN DEN MUSHI EMERGENCY / BUSTER CALL ALARM SIREN
  public startSiren() {
    if (this.isSirenActive) return;
    this.ensureAudioContext();
    this.isSirenActive = true;

    if (this.emergencyAudio) {
      this.emergencyAudio.currentTime = 0;
      this.emergencyAudio.play().catch(() => {
        this.playSynthSiren();
      });
    } else {
      this.playSynthSiren();
    }
  }

  public stopSiren() {
    this.isSirenActive = false;
    if (this.emergencyAudio) {
      this.emergencyAudio.pause();
      this.emergencyAudio.currentTime = 0;
    }
  }

  private playSynthSiren() {
    if (!this.audioCtx || !this.isSirenActive) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const lfo = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    lfo.frequency.setValueAtTime(2.2, now);

    gain.gain.setValueAtTime(0.2, now);
    lfo.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    lfo.start(now);
    osc.start(now);
  }

  // 3. CALL CUT TONE (HANG UP)
  public playGachal() {
    this.ensureAudioContext();
    if (this.callCutAudio) {
      this.callCutAudio.currentTime = 0;
      this.callCutAudio.play().catch(() => {});
    }
  }

  // 4. ALERT SENT TONE (OP THEME)
  public playAlertTone() {
    this.ensureAudioContext();
    if (this.alertAudio) {
      this.alertAudio.currentTime = 0;
      this.alertAudio.play().catch(() => {});
    }
  }

  // Speech synthesis with volume tick updates for real-time lip-sync
  public speak(
    text: string,
    pitch: number = 1.0,
    rate: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (!this.speechSynth) {
      if (onStart) onStart();
      if (onEnd) setTimeout(onEnd, 2000);
      return;
    }

    this.speechSynth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = Math.max(0.5, Math.min(2.0, pitch));
    utterance.rate = Math.max(0.6, Math.min(1.5, rate));

    const voices = this.speechSynth.getVoices();
    if (voices.length > 0) {
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural')));
      if (preferred) utterance.voice = preferred;
    }

    let volumeAnimId: number | null = null;

    utterance.onstart = () => {
      if (onStart) onStart();

      let tick = 0;
      const simulateVolume = () => {
        tick += 0.22;
        // Fluctuating speech amplitude tick for realistic lip-syncing
        const vol = (Math.sin(tick) * 0.45 + Math.sin(tick * 2.7) * 0.35 + 0.5) * 0.95;
        if (this.onVolumeUpdate) {
          this.onVolumeUpdate(Math.max(0.2, vol));
        }
        if (this.speechSynth?.speaking) {
          volumeAnimId = requestAnimationFrame(simulateVolume);
        } else {
          if (this.onVolumeUpdate) this.onVolumeUpdate(0);
        }
      };
      simulateVolume();
    };

    utterance.onend = () => {
      if (volumeAnimId) cancelAnimationFrame(volumeAnimId);
      if (this.onVolumeUpdate) this.onVolumeUpdate(0);
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      console.warn('Speech error:', err);
      if (this.onVolumeUpdate) this.onVolumeUpdate(0);
      if (onEnd) onEnd();
    };

    this.speechSynth.speak(utterance);
  }

  public stopSpeaking() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
    if (this.onVolumeUpdate) {
      this.onVolumeUpdate(0);
    }
  }

  public startListening(
    onResult: (text: string) => void,
    onError?: (err: any) => void,
    onEnd?: () => void
  ) {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      if (onError) onError('Speech Recognition is not supported.');
      return null;
    }

    try {
      this.stopListening();
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item && item[0]) {
            transcript += item[0].transcript;
          }
        }
        if (transcript.trim()) {
          onResult(transcript.trim());
        }
      };

      this.recognition.onerror = (err: any) => {
        if (err.error === 'no-speech') return;
        if (onError) onError(err);
      };

      this.recognition.onend = () => {
        if (onEnd) onEnd();
      };

      this.recognition.start();
      return this.recognition;
    } catch (e) {
      if (onError) onError(e);
      return null;
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
  }
}

export const soundEngine = new SoundEngine();
