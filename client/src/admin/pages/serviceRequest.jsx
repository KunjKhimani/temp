import { Helmet } from "react-helmet-async";
import { ServiceRequestView } from "../sections/serviceRequest/serviceRequestView";

export default function ServiceRequestPage() {
  return (
    <>
      <Helmet>
        <title> {`Service Requests - SpareWork`}</title>
      </Helmet>

      <ServiceRequestView />
    </>
  );
}
