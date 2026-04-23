import { Helmet } from "react-helmet-async";
import HomepageView from "../sections/promotions/homepage/HomepageView";

export default function PromotionHomepagePage() {
  return (
    <>
      <Helmet>
        <title> Homepage Promotions | Admin </title>
      </Helmet>

      <HomepageView />
    </>
  );
}