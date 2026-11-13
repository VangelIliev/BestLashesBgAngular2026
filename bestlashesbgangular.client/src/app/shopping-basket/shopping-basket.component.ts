import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { formatCurrencyPair } from '../shared/currency';

interface BasketItem {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  quantity: number;
  image: string;
  tag?: string;
}

interface DiscountDefinition {
  code: string;
  label?: string;
  percent?: number;
  amount?: number;
}

type DeliveryMethod = 'econt-office' | 'personal-address';

interface EcontCity {
  id: number;
  name: string;
  nameEn?: string;
  postCode?: string;
}

interface EcontOffice {
  id: number;
  code?: string;
  name: string;
  nameEn?: string;
  address?: {
    fullAddress?: string;
  };
}

interface CustomerDetails {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  isDataProcessingConsented: boolean;
}

type CheckoutFormValue = {
  firstName: string;
  lastName: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  econtCityId: number | null;
  econtOfficeId: number | null;
  gdprConsent: boolean;
};

interface OrderPayload {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  discountCode?: string | null;
  discountValue: number;
  total: number;
  customer: CustomerDetails;
}

@Component({
  selector: 'app-shopping-basket',
  standalone: false,
  templateUrl: './shopping-basket.component.html',
  styleUrl: './shopping-basket.component.css'
})
export class ShoppingBasketComponent implements OnInit, OnDestroy {

  readonly discounts: DiscountDefinition[] = [
    { code: 'NEW10', percent: 10 },
    { code: 'CHRISTMAS10', percent: 10 }
  ];

  readonly deliveryOptions: Array<{ value: DeliveryMethod; label: string }> = [
    { value: 'econt-office', label: 'Офис на Еконт' },
    { value: 'personal-address', label: 'Личен адрес' }
  ];

  readonly deliveryPlaceholders: Record<DeliveryMethod, string> = {
    'econt-office': 'Въведи точен офис на Еконт (град, улица, номер)',
    'personal-address': 'Въведи пълен адрес (град, улица, номер, вход)'
  };

  checkoutForm!: FormGroup;
  checkoutError = '';
  private readonly phonePattern = /^(\+359|0)(?:[\s-]?\d){9}$/;

  econtCities: EcontCity[] = [];
  econtOffices: EcontOffice[] = [];
  isLoadingCities = false;
  isLoadingOffices = false;
  econtLoadError = '';

  cityFilterText = '';
  filteredCities: EcontCity[] = [];
  showCityDropdown = false;

  private readonly storageKey = 'bestlashes-cart-items';
  private readonly discountStorageKey = 'bestlashes-cart-discount';
  private readonly customerStorageKey = 'bestlashes-checkout-customer';

  private readonly productCatalog: Record<string, Omit<BasketItem, 'quantity'>> = {
    'home-kit-light': {
      id: 'home-kit-light',
      name: 'Diva Миглопластика',
      subtitle: 'Мега обем мега гъстота за впечатляващ поглед',
      price: 29,
      image: '/assets/images/Diva_small.webp'
    },
    'home-kit-dark': {
      id: 'home-kit-dark',
      name: 'Dolce Миглопластика',
      subtitle: 'Класически ефект подходящ както за ежедневен така и за вечерен грим',
      price: 29,
      image: '/assets/images/Dolce_small.webp'
    },
    'home-kit-foxy': {
      id: 'home-kit-foxy',
      name: 'Foxy Миглопластика',
      subtitle: 'Ефект „очна линия“, L извивка',
      price: 29,
      image: '/assets/images/Foxy_Small.webp'
    },
    'promo-pack': {
      id: 'promo-pack',
      name: 'Миглопластика на лента',
      subtitle: 'Руски обем с "D" извивка, имитиращи 1 към 1 миглопластика',
      price: 25,
      image: '/assets/images/Migloplastika_Lenta.webp'
    }
  };

  items: BasketItem[] = [];

  appliedDiscount?: DiscountDefinition;
  discountMessage = '';
  discountState: 'idle' | 'success' | 'error' = 'idle';
  isSubmitting = false;

  private readonly subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly http: HttpClient,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.restoreItems();
    this.restoreDiscount();
    this.loadEcontCities();

    const existingCityId = this.getControl('econtCityId').value;
    if (existingCityId) {
      this.loadEcontOffices(existingCityId);
    }

    const querySubscription = this.route.queryParamMap.subscribe((params) => {
      const addId = params.get('add');
      if (addId && this.productCatalog[addId]) {
        this.addItem(addId);
        this.router.navigate([], {
          queryParams: { add: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
    });
    this.subscriptions.add(querySubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get hasItems(): boolean {
    return this.items.length > 0;
  }

  get subtotal(): number {
    return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get discountValue(): number {
    if (!this.appliedDiscount) {
      return 0;
    }
    if (this.appliedDiscount.percent) {
      return (this.subtotal * this.appliedDiscount.percent) / 100;
    }
    if (this.appliedDiscount.amount) {
      return Math.min(this.appliedDiscount.amount, this.subtotal);
    }
    return 0;
  }

  get total(): number {
    const value = this.subtotal - this.discountValue;
    return value > 0 ? value : 0;
  }

  formatPrice(eur: number): string {
    return formatCurrencyPair(eur);
  }

  applyDiscount(code: string): void {
    const normalized = code.trim().toUpperCase();

    if (!normalized) {
      this.setDiscountFeedback('Моля, въведете код.', 'error');
      return;
    }

    const found = this.discounts.find((d) => d.code === normalized);

    if (!found) {
      this.appliedDiscount = undefined;
      this.setDiscountFeedback('Невалиден код. Проверете правописа.', 'error');
      localStorage.removeItem(this.discountStorageKey);
      return;
    }

    this.appliedDiscount = found;
    this.setDiscountFeedback(`Код ${found.code} е активиран${found.label ? ` (${found.label})` : ''}.`, 'success');
    this.persistDiscount(found.code);
  }

  adjustQuantity(item: BasketItem, delta: number): void {
    const next = item.quantity + delta;
    if (next <= 0) {
      this.removeItem(item.id);
      return;
    }
    item.quantity = Math.min(10, next);
    this.persistItems();
  }

  removeItem(id: string): void {
    this.items = this.items.filter((item) => item.id !== id);
    this.persistItems();
    if (!this.hasItems) {
      this.clearDiscount();
    }
  }

  clearDiscount(): void {
    this.appliedDiscount = undefined;
    this.discountState = 'idle';
    this.discountMessage = '';
    localStorage.removeItem(this.discountStorageKey);
  }

  checkout(): void {
    this.checkoutError = '';

    if (!this.hasItems || this.isSubmitting) {
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.checkoutError = 'Моля, попълни данните за доставка преди да финализираш поръчката.';
      return;
    }

    const payload = this.createOrderPayload();

    this.isSubmitting = true;

    this.http.post<{ success: boolean; orderId?: string }>('/api/ShoppingBasket/checkout', payload).subscribe({
      next: () => this.handleOrderSuccess(payload),
      error: (error) => {
        this.isSubmitting = false;
        this.checkoutError = this.resolveCheckoutError(error);
      }
    });
  }

  getControl(name: keyof CheckoutFormValue): AbstractControl {
    return this.checkoutForm.get(name) as AbstractControl;
  }

  get selectedDeliveryMethod(): DeliveryMethod {
    return (this.getControl('deliveryMethod').value as DeliveryMethod) ?? this.deliveryOptions[0].value;
  }

  get deliveryAddressPlaceholder(): string {
    return this.deliveryPlaceholders[this.selectedDeliveryMethod] ?? '';
  }

  private buildForm(): void {
    const stored = this.restoreCustomer();

    this.checkoutForm = this.fb.group({
      firstName: [stored?.firstName ?? '', [Validators.required, Validators.minLength(2)]],
      lastName: [stored?.lastName ?? '', [Validators.required, Validators.minLength(2)]],
      phone: [stored?.phone ?? '', [Validators.required, Validators.pattern(this.phonePattern)]],
      deliveryMethod: [stored?.deliveryMethod ?? this.deliveryOptions[0].value, Validators.required],
      deliveryAddress: [stored?.deliveryAddress ?? '', [Validators.minLength(6)]],
      econtCityId: [stored?.econtCityId ?? null],
      econtOfficeId: [stored?.econtOfficeId ?? null],
      gdprConsent: [stored?.gdprConsent ?? false, Validators.requiredTrue]
    });

    this.updateDeliveryValidators(this.checkoutForm.get('deliveryMethod')?.value as DeliveryMethod);

    const deliveryMethodSub = this.checkoutForm.get('deliveryMethod')!.valueChanges.subscribe((method: DeliveryMethod) => {
      this.updateDeliveryValidators(method);
    });
    this.subscriptions.add(deliveryMethodSub);

    const cityIdSub = this.checkoutForm.get('econtCityId')!.valueChanges.subscribe((cityId: number | null) => {
      this.getControl('econtOfficeId').setValue(null, { emitEvent: false });
      this.econtOffices = [];
      if (cityId) {
        this.loadEcontOffices(cityId);
      }
    });
    this.subscriptions.add(cityIdSub);

    const valueChangesSub = this.checkoutForm.valueChanges.subscribe((value) => {
      this.persistCustomer(value as CheckoutFormValue);
    });
    this.subscriptions.add(valueChangesSub);
  }

  private updateDeliveryValidators(method: DeliveryMethod): void {
    const addressControl = this.getControl('deliveryAddress');
    const cityControl = this.getControl('econtCityId');
    const officeControl = this.getControl('econtOfficeId');

    if (method === 'econt-office') {
      addressControl.clearValidators();
      addressControl.updateValueAndValidity({ emitEvent: false });
      cityControl.setValidators([Validators.required]);
      officeControl.setValidators([Validators.required]);
    } else {
      addressControl.setValidators([Validators.required, Validators.minLength(6)]);
      addressControl.updateValueAndValidity({ emitEvent: false });
      cityControl.clearValidators();
      officeControl.clearValidators();
    }

    cityControl.updateValueAndValidity({ emitEvent: false });
    officeControl.updateValueAndValidity({ emitEvent: false });
  }

  onCityInputFocus(): void {
    this.showCityDropdown = true;
    this.filterCities();
  }

  onCityInputChange(value: string): void {
    this.cityFilterText = value;
    this.showCityDropdown = true;

    if (this.getControl('econtCityId').value !== null) {
      this.getControl('econtCityId').setValue(null);
      this.econtOffices = [];
    }

    this.filterCities();
  }

  onCityInputBlur(): void {
    // delay so a mousedown selection on the list can register before it closes
    setTimeout(() => {
      this.showCityDropdown = false;
      this.getControl('econtCityId').markAsTouched();
    }, 150);
  }

  selectCity(city: EcontCity): void {
    this.cityFilterText = city.name;
    this.getControl('econtCityId').setValue(city.id);
    this.getControl('econtCityId').markAsTouched();
    this.showCityDropdown = false;
  }

  private filterCities(): void {
    const query = this.cityFilterText.trim().toLowerCase();
    this.filteredCities = query
      ? this.econtCities.filter((c) => c.name.toLowerCase().includes(query))
      : this.econtCities;
  }

  private loadEcontCities(): void {
    this.isLoadingCities = true;
    this.econtLoadError = '';

    const sub = this.http.get<EcontCity[]>('/api/Econt/cities').subscribe({
      next: (cities) => {
        this.econtCities = cities.sort((a, b) => a.name.localeCompare(b.name, 'bg'));
        this.filterCities();

        const selectedCityId = this.getControl('econtCityId').value as number | null;
        if (selectedCityId) {
          const selectedCity = this.econtCities.find((c) => c.id === selectedCityId);
          if (selectedCity) {
            this.cityFilterText = selectedCity.name;
          }
        }

        this.isLoadingCities = false;
      },
      error: () => {
        this.isLoadingCities = false;
        this.econtLoadError = 'Неуспешно зареждане на градовете на Еконт. Опитай отново по-късно.';
      }
    });
    this.subscriptions.add(sub);
  }

  private loadEcontOffices(cityId: number): void {
    this.isLoadingOffices = true;
    this.econtLoadError = '';

    const sub = this.http.get<EcontOffice[]>(`/api/Econt/offices/${cityId}`).subscribe({
      next: (offices) => {
        this.econtOffices = offices;
        this.isLoadingOffices = false;
      },
      error: () => {
        this.isLoadingOffices = false;
        this.econtLoadError = 'Неуспешно зареждане на офисите на Еконт. Опитай отново по-късно.';
      }
    });
    this.subscriptions.add(sub);
  }

  private createOrderPayload(): OrderPayload {
    const customer = this.mapCustomerDetails();

    return {
      items: this.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      })),
      subtotal: this.subtotal,
      discountCode: this.appliedDiscount?.code ?? null,
      discountValue: this.discountValue,
      total: this.total,
      customer
    };
  }

  private mapCustomerDetails(): CustomerDetails {
    const value = this.checkoutForm.getRawValue() as CheckoutFormValue;

    const deliveryAddress =
      value.deliveryMethod === 'econt-office'
        ? this.buildEcontOfficeAddress(value.econtOfficeId)
        : this.sanitizeAddress(value.deliveryAddress);

    return {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      phoneNumber: this.sanitizePhone(value.phone),
      deliveryMethod: value.deliveryMethod,
      deliveryAddress,
      isDataProcessingConsented: value.gdprConsent === true
    };
  }

  private buildEcontOfficeAddress(officeId: number | null): string {
    const office = this.econtOffices.find((o) => o.id === officeId);
    if (!office) {
      return '';
    }
    return [office.name, office.address?.fullAddress].filter(Boolean).join(', ');
  }

  private sanitizePhone(phone: string): string {
    return phone.trim().replace(/[\s-]+/g, '');
  }

  private sanitizeAddress(address: string): string {
    return address.replace(/\s+/g, ' ').trim();
  }

  private resolveCheckoutError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Нямаме връзка със сървъра. Провери интернет връзката си и опитай отново.';
      }

      if (error.status === 400) {
        if (typeof error.error === 'string' && error.error.length) {
          return error.error;
        }

        if (error.error?.errors) {
          const messages = Object.values(error.error.errors)
            .flat()
            .filter((message): message is string => typeof message === 'string');
          if (messages.length) {
            return messages[0];
          }
        }

        return 'Моля, провери въведената информация и опитай отново.';
      }

      if (error.status >= 500) {
        return 'Сървърът е временно недостъпен. Опитай отново след минута.';
      }
    }

    return 'Възникна неочаквана грешка. Опитай отново след малко.';
  }

  private persistCustomer(value: Partial<CheckoutFormValue>): void {
    try {
      localStorage.setItem(this.customerStorageKey, JSON.stringify(value));
    } catch (storageError) {
      console.warn('Неуспешно запазване на данните за клиента.', storageError);
    }
  }

  private restoreCustomer(): Partial<CheckoutFormValue> | undefined {
    const raw = localStorage.getItem(this.customerStorageKey);
    if (!raw) {
      return undefined;
    }

    try {
      return JSON.parse(raw) as Partial<CheckoutFormValue>;
    } catch (error) {
      console.warn('Неуспешно зареждане на данните за клиента от локално съхранение.', error);
      localStorage.removeItem(this.customerStorageKey);
      return undefined;
    }
  }

  private setDiscountFeedback(message: string, state: 'success' | 'error'): void {
    this.discountMessage = message;
    this.discountState = state;
  }

  private addItem(id: string): void {
    const product = this.productCatalog[id];
    if (!product) {
      return;
    }

    // домашните комплекти трябва да се добавят като отделни редове, без сумиране
    if (id.startsWith('home-kit')) {
      const newVariantItem: BasketItem = {
        ...product,
        quantity: 1
      };
      this.items = [...this.items, newVariantItem];
      this.persistItems();
      return;
    }

    const existing = this.items.find((item) => item.id === id);
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + 1);
    } else {
      const newItem: BasketItem = {
        ...product,
        quantity: 1
      };
      this.items = [...this.items, newItem];
    }
    this.persistItems();
  }

  private persistItems(): void {
    if (this.items.length) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  private restoreItems(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed: BasketItem[] = JSON.parse(raw);
      const restored: BasketItem[] = [];

      parsed.forEach((item) => {
        const catalogItem = this.productCatalog[item.id];
        if (!catalogItem) {
          return;
        }

        const restoredItem: BasketItem = {
          ...catalogItem,
          quantity: Number(item.quantity) || 1
        };

        // домашните комплекти се пазят като отделни редове, дори със същия id
        if (item.id.startsWith('home-kit')) {
          restored.push(restoredItem);
          return;
        }

        const existing = restored.find((existingItem) => existingItem.id === item.id);
        if (existing) {
          existing.quantity = Math.min(10, existing.quantity + restoredItem.quantity);
        } else {
          restored.push(restoredItem);
        }
      });

      this.items = restored;
    } catch (e) {
      console.warn('Неуспешно зареждане на количката от локално съхранение.', e);
      this.items = [];
      localStorage.removeItem(this.storageKey);
    }
  }

  private persistDiscount(code: string): void {
    localStorage.setItem(this.discountStorageKey, code);
  }

  private restoreDiscount(): void {
    const storedCode = localStorage.getItem(this.discountStorageKey);
    if (!storedCode) {
      return;
    }
    const found = this.discounts.find((d) => d.code === storedCode);
    if (found) {
      this.appliedDiscount = found;
      this.discountState = 'success';
      this.discountMessage = `Код ${found.code} е активиран${found.label ? ` (${found.label})` : ''}.`;
    } else {
      localStorage.removeItem(this.discountStorageKey);
    }
  }

  private handleOrderSuccess(payload: OrderPayload): void {
    this.persistOrderSummary(payload);
    this.items = [];
    this.persistItems();
    this.clearDiscount();
    localStorage.removeItem(this.customerStorageKey);
    this.checkoutForm.reset({
      firstName: '',
      lastName: '',
      phone: '',
      deliveryMethod: this.deliveryOptions[0].value,
      deliveryAddress: '',
      econtCityId: null,
      econtOfficeId: null,
      gdprConsent: false
    });
    this.econtOffices = [];
    this.cityFilterText = '';
    this.filterCities();
    this.checkoutError = '';
    this.isSubmitting = false;
    this.router.navigate(['/thank-you'], { state: { order: payload } });
  }

  private persistOrderSummary(payload: OrderPayload): void {
    try {
      localStorage.setItem('bestlashes-last-order', JSON.stringify(payload));
    } catch (error) {
      console.warn('Неуспешно запазване на информация за поръчката.', error);
    }
  }
}
