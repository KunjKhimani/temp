import { Helmet } from "react-helmet-async";
import RulesView from "../sections/promotions/rules/RulesView";

export default function PromotionRulesPage() {
  return (
    <>
      <Helmet>
        <title> Promotion Rules | Admin </title>
      </Helmet>

      <RulesView />
    </>
  );
}