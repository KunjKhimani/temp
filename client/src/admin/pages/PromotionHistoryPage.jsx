import { Helmet } from "react-helmet-async";
import HistoryView from "../sections/promotions/history/HistoryView";

export default function PromotionHistoryPage() {
  return (
    <>
      <Helmet>
        <title> Pricing History | Admin </title>
      </Helmet>

      <HistoryView />
    </>
  );
}