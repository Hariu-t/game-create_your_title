// 音声管理ユーティリティ

class SoundManager {
  private bgmAudio: HTMLAudioElement | null = null;
  private startSound: HTMLAudioElement | null = null;
  private endSound: HTMLAudioElement | null = null;

  // シンキングタイム開始の音
  playStartSound() {
    try {
      // 音声ファイルが存在する場合はそれを使用
      const startSoundPath = '/sounds/thinking-start.mp3';
      const audio = new Audio(startSoundPath);
      audio.volume = 0.5;
      
      audio.play().catch(() => {
        // 音声ファイルが存在しない場合は、Web Audio APIで生成
        this.createStartSound();
      });
    } catch (error) {
      console.warn('開始音の再生に失敗しました:', error);
      this.createStartSound();
    }
  }

  // Web Audio APIで開始音を生成
  private createStartSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('開始音の生成に失敗しました:', error);
    }
  }

  // シンキングタイム中のBGM（ループ再生）
  startBGM() {
    try {
      // 既存のBGMを停止
      this.stopBGM();

      // 音声ファイルが存在する場合はそれを使用、なければWeb Audio APIで生成
      const bgmPath = '/sounds/thinking-bgm.mp3';
      
      // 音声ファイルの存在確認（実際のファイルがある場合は使用）
      this.bgmAudio = new Audio(bgmPath);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.3;
      
      this.bgmAudio.play().catch(() => {
        // 音声ファイルが存在しない場合は、Web Audio APIでBGMを生成
        console.log('音声ファイルが見つかりません。Web Audio APIでBGMを生成します。');
        this.createSyntheticBGM();
      });
    } catch (error) {
      console.warn('BGMの再生に失敗しました:', error);
      this.createSyntheticBGM();
    }
  }

  // Web Audio APIでBGMを生成（フォールバック用）
  private createSyntheticBGM() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const createTone = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 200;
        
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        gainNode.gain.value = 0.05; // 音量を低く設定

        oscillator.start();
        
        setTimeout(() => {
          oscillator.stop();
          if (this.bgmAudio) {
            createTone();
          }
        }, 2000);
      };

      createTone();
    } catch (error) {
      console.warn('合成BGMの生成に失敗しました:', error);
    }
  }

  // BGMを停止
  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
      this.bgmAudio = null;
    }
  }

  // シンキングタイム終了の音
  playEndSound() {
    try {
      // 音声ファイルが存在する場合はそれを使用
      const endSoundPath = '/sounds/thinking-end.mp3';
      const audio = new Audio(endSoundPath);
      audio.volume = 0.5;
      
      audio.play().catch(() => {
        // 音声ファイルが存在しない場合は、Web Audio APIで生成
        this.createEndSound();
      });
    } catch (error) {
      console.warn('終了音の再生に失敗しました:', error);
      this.createEndSound();
    }
  }

  // Web Audio APIで終了音を生成
  private createEndSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 2つの音を連続で再生
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);

        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };

      // 低い音
      playTone(400, 0, 0.3);
      // 高い音
      playTone(600, 0.2, 0.3);
    } catch (error) {
      console.warn('終了音の生成に失敗しました:', error);
    }
  }

  // すべての音を停止
  stopAll() {
    this.stopBGM();
  }
}

export const soundManager = new SoundManager();

