import { AfterViewInit, Component, ElementRef, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { formatCurrencyPair } from '../shared/currency';

interface LashVariant {
  id: string;
  name: string;
  description: string;
  image: string;
}

interface KitDetail {
  title: string;
  items: string[];
}

@Component({
  selector: 'app-home-lash-package',
  standalone: false,
  templateUrl: './home-lash-package.component.html',
  styleUrl: './home-lash-package.component.css'
})
export class HomeLashPackageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('demoVideo') demoVideo?: ElementRef<HTMLVideoElement>;
  private removeInteractionListener?: () => void;

  constructor(private readonly renderer: Renderer2) {}
  readonly demoVideoSrc = '/assets/videos/Migloplastika_vkushti.mp4';
  readonly demoVideoPoster = '/assets/images/Dolce_small.webp';
  readonly kitPriceEur = 29;
  readonly kitOldPriceEur = 35;
  readonly freeShippingThresholdEur = 50;

  readonly variants: LashVariant[] = [
    {
      id: 'home-kit-light',
      name: 'Diva Миглопластика',
      description: 'Мега обем мега гъстота за впечатляващ поглед',
      image: '/assets/images/Diva_small.webp'
    },
    {
      id: 'home-kit-dark',
      name: 'Dolce Миглопластика',
      description: 'Класически ефект подходящ както за ежедневен така и за вечерен грим',
      image: '/assets/images/Dolce_small.webp'
    },
    {
      id: 'home-kit-foxy',
      name: 'Foxy Миглопластика',
      description: 'Ефект „очна линия“, L изивка',
      image: '/assets/images/Foxy_Small.webp'
    },
  ];

  readonly kitDetails: KitDetail[] = [
    {
      title: 'Включва',
      items: [
        '120+ снопчета за многократно ползване',
        'Лепило тип „спирала“ и запечатващ гел',
        'Пинсета',
        'Четка за разресване',
        'Четка за почистване',
        'Remover за безопасно премахване'
      ]
    },
    {
      title: 'Предимства',
      items: [
        'Лесно поставяне под 10 минути в домашни условия',
        'Резултат до 2–3 седмици при правилна поддръжка',
        'Снопчетата могат да се използват повече от година'
      ]
    }
  ];

  activeVariant = this.variants[0];

  selectVariant(variant: LashVariant): void {
    this.activeVariant = variant;
  }

  formatPrice(eur: number): string {
    return formatCurrencyPair(eur);
  }

  ngAfterViewInit(): void {
    const videoElement = this.demoVideo?.nativeElement;
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

