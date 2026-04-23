/* eslint-disable no-unused-vars */
import React from "react";
import { Helmet } from "react-helmet-async";
import { UserView } from "../sections/user/userView";
import { UserAnalyticsDashboard } from "../sections/user/UserAnalyticsCard"; // Import the new component

export default function UserPage() {
  return (
    <>
      <Helmet>
        <title> {`Users - SpareWork`}</title>
      </Helmet>
      <UserAnalyticsDashboard /> {/* Add the analytics dashboard here */}
      <UserView />
    </>
  );
}
