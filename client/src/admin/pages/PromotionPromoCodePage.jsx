import { Helmet } from "react-helmet-async";
import PromoCodeView from "../sections/promotions/promo-code/PromoCodeView";

export default function PromotionPromoCodePage() {
  return (
    <>
      <Helmet>
        <title> Promo Code | Admin </title>
      </Helmet>

      <PromoCodeView />
    </>
  );
}
