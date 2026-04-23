/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Grid,
  Link as MuiLink,
  Container,
  Divider,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  IconBrandFacebookFilled,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandTiktokFilled,
  IconBrandInstagram,
  IconPhoneFilled,
  IconMapPinFilled,
  IconMailFilled,
} from "@tabler/icons-react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsLoggedIn, selectUser } from "../store/slice/userSlice"; // Assuming correct path

// Component for individual Link Columns
const FooterLinkColumn = ({ title, links }) => (
  <Box>
    <Typography
      variant="h6"
      component="h3"
      gutterBottom
      sx={{
        fontWeight: 600,
        fontSize: "1.1rem",
        color: "text.primary",
        mb: 2,
      }}
    >
      {title}
    </Typography>
    <Stack spacing={1}>
      {links.map((link, idx) => (
        <MuiLink
          key={idx}
          component={link.url.startsWith("http") ? "a" : RouterLink}
          to={link.url}
          href={link.url.startsWith("http") ? link.url : undefined}
          target={link.url.startsWith("http") ? "_blank" : undefined}
          rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
          onClick={link.onClick}
          variant="body2"
          sx={{
            textDecoration: "none",
            color: "text.secondary",
            transition: "color 0.2s ease-in-out, transform 0.2s ease",
            display: "inline-block",
            "&:hover": {
              color: "primary.main",
              transform: "translateX(3px)",
            },
          }}
        >
          {link.label}
        </MuiLink>
      ))}
    </Stack>
  </Box>
);

// Component for Contact Info Items
const ContactItem = ({ icon: Icon, text }) => (
  <Stack direction="row" alignItems="center" spacing={1.5}>
    <Icon
      size={20}
      style={{ color: "var(--mui-palette-primary-main)", flexShrink: 0 }}
    />
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {text}
    </Typography>
  </Stack>
);

const Footer = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
  const isSeller = user?.isSeller;

  const handleListServiceClick = (event) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (event) event.preventDefault();
    if (!isLoggedIn) {
      navigate("/auth/signin");
    } else if (!isSeller) {
      alert(
        "You need a seller account to list services. You can upgrade your account in your profile."
      );
    } else {
      navigate("/user/profile");
    }
  };

  const footerData = [
    {
      title: "Navigate",
      links: [
        { label: "Find Services", url: "/services" },
        {
          label: "List Your Service",
          url: "/user/profile",
          onClick: handleListServiceClick,
        },
        { label: "Why SpareWork?", url: "/why-sparework" },
        { label: "Help & Resources", url: "/resources" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", url: "/why-sparework" },
        { label: "Terms of Service", url: "/terms" },
        { label: "Privacy Policy", url: "/privacy" },
        { label: "Partner With Us", url: "/partnerships" },
      ],
    },
  ];

  const socialLinks = [
    {
      Icon: IconBrandFacebookFilled,
      href: "https://facebook.com",
      color: "#1877F2",
      label: "Facebook",
    },
    {
      Icon: IconBrandX,
      href: "https://twitter.com",
      color: "#000000",
      label: "X (Twitter)",
    },
    {
      Icon: IconBrandInstagram,
      href: "https://instagram.com",
      color: "#E4405F",
      label: "Instagram",
    },
    {
      Icon: IconBrandLinkedin,
      href: "https://linkedin.com",
      color: "#0A66C2",
      label: "LinkedIn",
    },
    {
      Icon: IconBrandTiktokFilled,
      href: "https://tiktok.com",
      color: "#000000",
      label: "TikTok",
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "grey.50",
        color: "text.secondary",
        mt: "auto",
      }}
    >
      {/* --- Main Footer Content Area --- */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Changed Grid structure */}
        <Grid container spacing={{ xs: 4, md: 3 }}>
          {" "}
          {/* Adjust spacing if needed */}
          {/* Column 1 & 2: Footer Links */}
          {footerData.map((section) => (
            <Grid item xs={6} sm={3} md={2.5} key={section.title}>
              {" "}
              {/* Adjusted grid size */}
              <FooterLinkColumn title={section.title} links={section.links} />
            </Grid>
          ))}
          {/* Column 3: Contact Info (Text Only) */}
          <Grid item xs={12} sm={6} md={3}>
            {" "}
            {/* Adjusted grid size */}
            <Typography
              variant="h6"
              component="h3"
              gutterBottom
              sx={{
                fontWeight: 600,
                fontSize: "1.1rem",
                color: "text.primary",
                mb: 2,
              }}
            >
              Get In Touch
            </Typography>
            <Stack spacing={2}>
              <ContactItem icon={IconPhoneFilled} text="+1-707-727-4737" />
              <ContactItem icon={IconMailFilled} text="info@sparework.net" />
              {/* <ContactItem
                icon={IconMapPinFilled}
                text="Richmond City, Virginia, USA (23219)"
              /> */}
            </Stack>
          </Grid>
          {/* Column 4: Map Only */}
          <Grid item xs={12} sm={6} md={4}>
            {" "}
            {/* Adjusted grid size */}
            {/* Map - Adding slight top margin for spacing on smaller screens when it wraps */}
            <Box
              sx={{
                borderRadius: 1,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                mt: { xs: 2, sm: 0 }, // Add margin top on xs/sm when it wraps below contact
              }}
            >
              <iframe
                title="SpareWork Location"
                src="https://www.google.com/maps/embed?pb=!1m3!1m2!1m1!1sWorld!2m2!1d0!2d0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2set!4v1738835172896!5m2!1sen!2set"
                width="100%"
                height="180" // Can adjust height if needed
                style={{ border: 0, display: "block" }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* --- Bottom Bar (Remains the same) --- */}
      <Box
        sx={{
          bgcolor: "grey.100",
          py: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={{ xs: 2, sm: 1 }}
          >
            {/* Copyright */}
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: { xs: "center", sm: "left" },
              }}
            >
              © {new Date().getFullYear()} SpareWork. All Rights Reserved.
            </Typography>

            {/* Social Icons */}
            <Stack
              direction="row"
              spacing={1}
              justifyContent={{ xs: "center", sm: "flex-end" }}
            >
              {socialLinks.map(({ Icon, href, color, label }) => (
                <Tooltip title={label} arrow key={label}>
                  <IconButton
                    component="a"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    sx={{
                      color: color,
                      transition:
                        "transform 0.2s ease-in-out, background-color 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <Icon size={20} />
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
