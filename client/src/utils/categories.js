// Categories a payment can belong to. Bills use the first group; expenses and budgets
// can use any.
export const BILL_CATEGORIES = ['utilities', 'insurance', 'subscriptions', 'rent/mortgage', 'loans', 'other'];
export const SPEND_CATEGORIES = [
  'groceries', 'dining', 'transport', 'health', 'shopping', 'entertainment', ...BILL_CATEGORIES,
];
