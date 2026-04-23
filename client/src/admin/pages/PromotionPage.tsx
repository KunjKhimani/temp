import { Helmet } from "react-helmet-async";
import PromotionView from "../sections/promotions/PromotionView";

export default function PromotionPage() {
  return (
    <>
      <Helmet>
        <title> Promotion Rules | Admin </title>
      </Helmet>

      <PromotionView />
    </>
  );
}