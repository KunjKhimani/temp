import React from "react";
import Lottie from "lottie-react";
import ErrorAnimation from "../../assets/Error.json";

const NotFound = () => {
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
      }}
    >
      <div style={{ maxWidth: "400px" }}>
        <Lottie animationData={ErrorAnimation} loop={true} />
      </div>
      <h1 style={{ fontSize: "2rem", color: "#333" }}>404 - Page Not Found</h1>
      <p style={{ fontSize: "1.2rem", color: "#555" }}>
        We are currently working on our platform. This page will be available
        soon. Thank you for your patience!
      </p>
      <button style={{ padding: "10px 20px" }}>
        <a href="/" style={{ textDecoration: "none", color: "#000" }}>
          Go back to Home
        </a>
      </button>
    </div>
  );
};

export default NotFound;
