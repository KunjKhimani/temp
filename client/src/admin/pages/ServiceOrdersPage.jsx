import { Helmet } from "react-helmet-async";
import { OrderView } from "../sections/order/orderView"; // Import the new OrderView component

// ----------------------------------------------------------------------

export default function ServiceOrdersPage() {
  return (
    <>
      <Helmet>
        <title> {`Orders - SpareWork`}</title>
      </Helmet>

      <OrderView />
    </>
  );
}
