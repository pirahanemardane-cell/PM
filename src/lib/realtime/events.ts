export const RT = {
  cart: "pm:cart-changed",
  orders: "pm:orders-changed",
  payment: "pm:payment-changed",
  wishlist: "pm:wishlist-changed",
  stock: "pm:stock-changed",
  catalog: "pm:catalog-changed",
  reviews: "pm:reviews-changed",
  support: "pm:support-changed",
  returns: "pm:returns-changed",
  notifications: "pm:notifications-changed",
  blog: "pm:blog-changed",
} as const;

export type RtEvent = (typeof RT)[keyof typeof RT];
