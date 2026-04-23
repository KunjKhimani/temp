import { Helmet } from "react-helmet-async";
import { RevenueView } from "../sections/revenue/RevenueView";

export default function RevenuePage() {
  return (
    <>
      <Helmet>
        <title>{`Revenue - SpareWork`}</title>
      </Helmet>

      <RevenueView />
    </>
  );
}