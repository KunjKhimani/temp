import { Helmet } from "react-helmet-async";
// import { Typography, Container } from "@mui/material";
import { ServiceRequestView } from "../sections/serviceRequest/serviceRequestView";

const ServiceRequestsPage = () => {
  return (
    <>
      <Helmet>
        <title> Service Requests | SpareWork </title>
      </Helmet>

      <ServiceRequestView />
    </>
  );
};

export default ServiceRequestsPage;
