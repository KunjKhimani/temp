/* eslint-disable react/prop-types */
import React from "react";
import ReviewModal from "../../components/ReviewModal";

const RatingModal = ({ open, onClose, order }) => {
  return (
    <ReviewModal
      open={open}
      onClose={onClose}
      orderId={order?._id}
      orderModel="Order"
      listingId={order?.service?._id}
      listingModel="Service"
      title="Rate This Service"
    />
  );
};

export default RatingModal;
