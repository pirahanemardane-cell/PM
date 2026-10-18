/** لینک رهگیری رسمی هر روش ارسال — استاندارد بازار ایران */

export const SHIPPING_TRACKING_URLS = {
  post: (code: string) => `https://tracking.post.ir/?id=${encodeURIComponent(code)}`,
  peyk: (code: string) => `https://tracking.peyk.com/?id=${encodeURIComponent(code)}`,
  alopeyk: (code: string) => `https://tracking.alopeyk.com/?id=${encodeURIComponent(code)}`,
  snappbox: (code: string) => `https://tracking.snappbox.com/?id=${encodeURIComponent(code)}`,
  tipax: (code: string) => `https://tracking.tipax.ir/?id=${encodeURIComponent(code)}`,
} as const;

export type ShippingCarrier = keyof typeof SHIPPING_TRACKING_URLS;

export function getTrackingUrl(carrier: ShippingCarrier, code: string): string {
  return SHIPPING_TRACKING_URLS[carrier](code);
}
