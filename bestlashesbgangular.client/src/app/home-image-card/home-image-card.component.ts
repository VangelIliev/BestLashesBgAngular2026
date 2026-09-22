import { Component } from '@angular/core';
import { formatCurrencyPair } from '../shared/currency';

type HomePackage = {
  id: string;
  name: string;
  priceEur: number;
  oldPriceEur?: number;
  description: string;
  image?: string;
  imageAlt?: string;
  link?: string;
  ctaLabel?: string;
};

@Component({
  selector: 'app-home-image-card',
  standalone: false,
  templateUrl: './home-image-card.component.html',
  styleUrl: './home-image-card.component.css'
})
export class HomeImageCardComponent {
  readonly packages: HomePackage[] = [
    {
      id: 'home-lash-pack',
      name: 'Миглопластика вкъщи',
      priceEur: 35,
      description: 'Всичко необходимо, за да направиш миглопластика вкъщи като професионалист.',
      image: '/assets/images/Dolce.webp',
      imageAlt: 'Комплект за миглопластика вкъщи',
      link: '/home-lash-package',
      ctaLabel: 'Виж повече'
    },
    {
      id: 'promo-pack',
      name: 'Миглопластика на лента',
      priceEur: 30,
      description: 'Руски обем с „D“ извивка, имитиращи 1 към 1 миглопластика но само с едно поставяне на лентата.',
      image: '/assets/images/Migloplastika_Lenta.webp',
      imageAlt: 'Миглопластика на лента Best Lashes BG',
      link: '/migloplastika-lenta',
      ctaLabel: 'Виж повече'
    }
  ];

  formatPrice(eur: number): string {
    return formatCurrencyPair(eur);
  }

  onImageError(pkg: HomePackage): void {
    pkg.image = undefined;
  }
}
