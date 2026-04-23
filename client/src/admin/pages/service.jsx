/* eslint-disable no-unused-vars */
import React from "react";
import { Helmet } from "react-helmet-async";
import { ServiceView } from "../sections/service/serviceView";
// import { ServiceAnalyticsDashboard } from "../sections/service/ServiceAnalyticsCard"; // If you create an analytics dashboard for services

export default function ServicePage() {
  return (
    <>
      <Helmet>
        <title> {`Services - SpareWork`}</title>
      </Helmet>
      {/* <ServiceAnalyticsDashboard /> */}{" "}
      {/* Add the analytics dashboard here if created */}
      <ServiceView />
    </>
  );
}
