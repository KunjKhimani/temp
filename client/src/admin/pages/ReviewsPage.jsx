import React from "react";
import { Helmet } from "react-helmet-async";
import { AdminReviewsView } from "../sections/reviews/view/AdminReviewsView";

export default function ReviewsPage() {
  return (
    <>
      <Helmet>
        <title>Reviews - SpareWork Admin</title>
      </Helmet>
      <AdminReviewsView />
    </>
  );
}
