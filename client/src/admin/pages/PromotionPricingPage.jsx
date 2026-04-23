import { Helmet } from "react-helmet-async";
import PricingView from "../sections/promotions/pricing/PricingView";

export default function PromotionPricingPage() {
  return (
    <>
      <Helmet>
        <title> Pricing Settings | Admin </title>
      </Helmet>

      <PricingView />
    </>
  );
}