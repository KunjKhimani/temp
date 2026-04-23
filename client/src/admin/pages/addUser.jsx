/* eslint-disable no-unused-vars */
import React from "react";
import { Helmet } from "react-helmet-async";
import AddUserView from "../sections/addUser/addUserView";

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Add Users - SpareWork`}</title>
      </Helmet>

      <AddUserView />
    </>
  );
}
