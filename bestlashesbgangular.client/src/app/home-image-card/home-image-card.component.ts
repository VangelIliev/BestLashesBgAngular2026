import { Component } from '@angular/core';
import { formatCurrencyPair } from '../shared/currency';

type HomePackage = {
  id: string;
  name: string;
  priceBgn: number;
  oldPriceBgn?: number;
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
      priceBgn: 69,
      description: 'Всичко необходимо, за да направиш миглопластика вкъщи като професионалист.',
      image: '/assets/images/cover-image-2.jpg',
      imageAlt: 'Комплект за миглопластика вкъщи',
      link: '/home-lash-package',
      ctaLabel: 'Виж повече'
    },
    {
      id: 'promo-pack',
      name: 'Промо пакет',
      priceBgn: 69,
      description: 'Пълен комплект за магнетичен поглед + аксесоари за бързо приложение.',
      image: '/assets/images/cover-image-1.jpg',
      imageAlt: 'Промо пакет Best Lashes BG',
      link: '/promo-package',
      ctaLabel: 'Виж повече'
    }
  ];

  formatPrice(bgn: number): string {
    return formatCurrencyPair(bgn);
  }

  onImageError(pkg: HomePackage): void {
    pkg.image = undefined;
  }
}
