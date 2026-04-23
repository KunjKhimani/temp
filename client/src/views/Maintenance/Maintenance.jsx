import React from "react";
import Lottie from "lottie-react";
import ErrorAnimation from "../../assets/Error.json";

const Maintenance = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
        backgroundColor: "#f9f9f9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "400px" }}>
        <Lottie animationData={ErrorAnimation} loop={true} />
      </div>
      <h1 style={{ fontSize: "2rem", color: "#333" }}>Maintenance Mode</h1>
      <p style={{ fontSize: "1.2rem", color: "#555" }}>
        We are currently working on our platform. It will be available soon.
        Thank you for your patience!
      </p>
    </div>
  );
};

export default Maintenance;
