import { useState } from "react";
import { Grid, Typography, Box, TextField, Button } from "@mui/material";
import emailjs from "@emailjs/browser";
import Image from "../../../assets/images/contact.jpg";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    emailjs
      .send(
        "your_service_id", // Replace with your EmailJS Service ID
        "your_template_id", // Replace with your EmailJS Template ID
        {
          user_name: formData.name,
          user_email: formData.email,
          message: formData.message,
        },
        "your_user_id" // Replace with your EmailJS User ID (Public Key)
      )
      .then(
        (response) => {
          console.log("Email sent successfully!", response);
          alert("Your message has been sent!");
          setFormData({ name: "", email: "", message: "" });
        },
        (error) => {
          console.error("Failed to send email:", error);
          alert("Failed to send message. Please try again later.");
        }
      );
  };

  return (
    <Grid container sx={{ height: "70vh" }}>
      {/* Image Section (Hidden on small screens) */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: { xs: "none", md: "block" },
          backgroundImage: `url(${Image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100%",
        }}
      />

      {/* Contact Form Section */}
      <Grid
        item
        xs={12}
        md={6}
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ p: { xs: 2, md: 4 } }}
      >
        <Box
          component="form"
          onSubmit={handleFormSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="#333" mb={2}>
            Send us a message
          </Typography>
          <TextField
            label="Your Name"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            fullWidth
            required
          />
          <TextField
            label="Your Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleFormChange}
            fullWidth
            required
          />
          <TextField
            label="Your Message"
            name="message"
            value={formData.message}
            onChange={handleFormChange}
            multiline
            rows={4}
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ backgroundColor: "#000", color: "#fff" }}
          >
            Send Message
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default ContactForm;
