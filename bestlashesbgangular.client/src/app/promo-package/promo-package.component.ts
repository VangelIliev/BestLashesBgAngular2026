import { Component } from '@angular/core';
import { formatCurrencyPair } from '../shared/currency';

interface PackageSection {
  title: string;
  icon?: string;
  items: string[];
}

@Component({
  selector: 'app-promo-package',
  standalone: false,
  templateUrl: './promo-package.component.html',
  styleUrl: './promo-package.component.css'
})
export class PromoPackageComponent {
  readonly promoVideoSrc = '/assets/videos/promo-video.mp4';
  readonly promoVideoPoster = '/assets/images/night-and-day-promo.jpg';
  readonly productImage = this.promoVideoPoster;
  readonly promoPriceBgn = 69;
  readonly freeShippingThresholdBgn = 100;

  readonly daySection: PackageSection = {
    title: 'Комплект “Ден” ☀️',
    items: [
      'Мигли “естествено ОТВОРЕНО око” 8 – 10 mm',
      'Бежова магнитна очна линия за нежна визия'
    ]
  };

  readonly nightSection: PackageSection = {
    title: 'Комплект “Нощ” 🌙',
    items: [
      'Мигли “гъсто КОТЕШКО око” 12 – 14 mm',
      'Дълбока черна магнитна очна линия за драматичен ефект'
    ]
  };

  readonly perks: string[] = [
    'Мигли от естествен косъм',
    'Лесно поставяне за под 5 минути',
    'Подходящо за многократна употреба'
  ];

  readonly whatsInside: string[] = [
    '2 чифта магнитни мигли (ден и нощ)',
    '2 магнитни очни линии',
    'Апликатор за лесно поставяне',
    'Луксозна кутия за съхранение'
  ];

  formatPrice(bgn: number): string {
    return formatCurrencyPair(bgn);
  }
}

