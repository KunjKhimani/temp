import { Helmet } from "react-helmet-async";
import { RequestedProductView } from "../sections/requested-product/RequestedProductView";

export default function RequestedProductPage() {
  return (
    <>
      <Helmet>
        <title> {`Requested Products - SpareWork`}</title>
      </Helmet>
      <RequestedProductView />
    </>
  );
}
