import api from "../client";

export type AdPlacement =
  | "SPLASH"
  | "HOME_BANNER"
  | "HOME_FEED"
  | "SEARCH_INLINE";

/** Shape the app renders in a slot — no advertiser money/contact details.
 *  Booking/payment is web-only (propertyloop.ng/advertise), which also keeps
 *  the iOS app clear of any external-purchase flow. */
export interface PublicAd {
  id: string;
  brandName: string;
  imageUrl: string;
  headline: string;
  body?: string | null;
  ctaLabel: string;
  ctaUrl: string;
  placement: AdPlacement;
}

const adsService = {
  serve(placement: AdPlacement): Promise<PublicAd[]> {
    return api
      .get<PublicAd[]>("/ads/serve", { params: { placement } })
      .then((r) => r.data);
  },
  /** Fire-and-forget beacons — never surface failures to the UI. */
  impression(id: string): void {
    void api.post(`/ads/${id}/impression`).catch(() => {});
  },
  click(id: string): void {
    void api.post(`/ads/${id}/click`).catch(() => {});
  },
};

export default adsService;
