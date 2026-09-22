import { Component } from '@angular/core';
import { formatCurrencyPair } from '../shared/currency';

@Component({
  selector: 'app-promo-package',
  standalone: false,
  templateUrl: './promo-package.component.html',
  styleUrl: './promo-package.component.css'
})
export class PromoPackageComponent {
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
}

