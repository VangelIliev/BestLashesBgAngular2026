export const BGN_TO_EUR_RATE = 1.95583;

export const toEuro = (bgn: number): number => bgn / BGN_TO_EUR_RATE;

export const formatCurrencyPair = (bgn: number): string =>
  `${toEuro(bgn).toFixed(2)} € / ${bgn.toFixed(2)} лв.`;

