import { AfterViewInit, Component, ElementRef, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { formatCurrencyPair } from '../shared/currency';

@Component({
  selector: 'app-promo-package',
  standalone: false,
  templateUrl: './promo-package.component.html',
  styleUrl: './promo-package.component.css'
})
export class PromoPackageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('promoVideo') promoVideo?: ElementRef<HTMLVideoElement>;
  private removeInteractionListener?: () => void;

  constructor(private readonly renderer: Renderer2) {}

  readonly promoVideoSrc = '/assets/videos/Migloplastica_Lenta_Vid.mp4';
  readonly promoVideoPoster = '/assets/images/Migloplastika_Lenta.webp';
  readonly productImage = '/assets/images/Migloplastika_Lenta.webp';
  readonly promoPriceEur = 30;
  readonly freeShippingThresholdEur = 50;

  readonly perks: string[] = [
    'Мигли от естествен косъм',
    'Лесно поставяне за секунди',
    'Подходящо за многократна употреба'
  ];

  readonly whatsInside: string[] = [
    '4 модела руски обем',
    'Пинсета за поставяне',
    'Бързосъхнещо лепило'
  ];

  formatPrice(eur: number): string {
    return formatCurrencyPair(eur);
  }

  ngAfterViewInit(): void {
    const videoElement = this.promoVideo?.nativeElement;
    if (!videoElement) {
      return;
    }

    const tryEnableAudio = () => this.enableVideoAudio(videoElement);

    if (videoElement.readyState >= 2) {
      tryEnableAudio();
    } else {
      const onCanPlay = () => {
        tryEnableAudio();
        videoElement.removeEventListener('loadeddata', onCanPlay);
      };
      videoElement.addEventListener('loadeddata', onCanPlay);
    }

    this.removeInteractionListener = this.renderer.listen('window', 'pointerdown', () => {
      tryEnableAudio();
      this.removeInteractionListener?.();
      this.removeInteractionListener = undefined;
    });
  }

  ngOnDestroy(): void {
    this.removeInteractionListener?.();
  }

  private enableVideoAudio(video: HTMLVideoElement): void {
    if (!video || video.muted === false) {
      return;
    }

    video.muted = false;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        video.muted = true;
      });
    }
  }
}

