import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled, useTheme } from "@mui/system";
import SearchMenu from "./components/SearchMenu";

// Import new Hero IMages
import HeroImage1 from "../../assets/images/new-hero/hero-01.jpg";
import HeroImage2 from "../../assets/images/new-hero/hero-2.jpg";
import HeroImage3 from "../../assets/images/new-hero/hero-001.jpg";
import HeroImage4 from "../../assets/images/new-hero/hero-5.jpg"; // Assuming a new image for the fourth slide

const heroImages = [HeroImage4, HeroImage1, HeroImage2, HeroImage3];

const heroTextData = [
  {
    headline: "Your Vision, Our Expertise",
    subHeadline:
      "Bringing your ideas to life with a network of trusted professionals.",
  },
  {
    headline: "Discover Skilled Professionals Instantly",
    subHeadline: "Connect with verified experts for any project, big or small.",
  },
  {
    headline: "Power Your Projects with Top Talent",
    subHeadline:
      "From creative tasks to technical support, find the right fit on Sparework.",
  },
  {
    headline: "Flexible Solutions for Every Need",
    subHeadline:
      "Access on-site and remote services tailored to your requirements.",
  },
];

const slideDuration = 5300;
const fadeDuration = 667; // Keep this at 2/3 of original 1000ms

// --- Main Wrapper for Hero Content ---
const HeroWrapper = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "currentImage" && prop !== "nextImage" && prop !== "isTransitioning",
})(({ theme, currentImage, nextImage, isTransitioning }) => ({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#121212", // Dark fallback to avoid white flash
  overflow: "hidden",

  // Desktop Styles
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
    minHeight: "70vh",
    alignItems: "center",
    justifyContent: "space-around",
    padding: theme.spacing(4),
    backgroundColor: "transparent",

    // Base layer (current image)
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundImage: `url(${currentImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      filter: "brightness(80%)",
      zIndex: 0,
    },

    // Overlapping layer (next image) that fades in
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundImage: `url(${nextImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      filter: "brightness(80%)",
      zIndex: 1,
      opacity: isTransitioning ? 1 : 0,
      transition: isTransitioning
        ? `opacity ${fadeDuration}ms ease-in-out`
        : "none",
    },
  },
}));

// --- Container for Image Area (Mobile) & Text Overlay ---
// --- This now primarily acts as a positioning context for the img and text ---
const ImageTextContainer = styled(Box)(({ theme }) => ({
  position: "relative", // Needed for absolute positioning of text
  width: "100%",
  backgroundColor: theme.palette.grey[900], // Background color for potential letterboxing around the img
  lineHeight: 0, // Prevent extra space below the image if text somehow causes it

  // Desktop Styles: Reverts to being the text container area
  [theme.breakpoints.up("md")]: {
    position: "relative", // Reset position or keep relative if needed
    backgroundColor: "transparent",
    padding: theme.spacing(4),
    textAlign: "left",
    flexBasis: "50%",
    order: 2,
    display: "flex", // Use flex to align text content
    justifyContent: "center",
    alignItems: "flex-start", // Align text left
    lineHeight: "initial", // Reset line height
  },
}));

// --- Styled Image specifically for Mobile View ---
const MobileHeroImage = styled("img", {
  shouldForwardProp: (prop) => prop !== "op" && prop !== "isOverlay",
})(({ theme, op, isOverlay }) => ({
  display: "block", // Ensure it behaves as a block element
  width: "100%", // Take full width
  height: "auto", // Maintain aspect ratio
  objectFit: "contain", // Fit within bounds, maintain aspect ratio
  opacity: op !== undefined ? op : 1,
  transition:
    op !== undefined ? `opacity ${fadeDuration}ms ease-in-out` : "none",
  filter: "brightness(90%)", // Apply brightness filter
  maxHeight: "70vh", // Optional: Add a max-height constraint if needed

  ...(isOverlay && {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
  }),
  filter: "brightness(90%)", // Apply brightness filter
  maxHeight: "70vh", // Optional: Add a max-height constraint if needed

  // Hide on desktop
  [theme.breakpoints.up("md")]: {
    display: "none",
  },
}));

// --- HeroText Component (Handles text opacity and styling, now absolute on mobile) ---
const HeroText = styled(Box, {
  shouldForwardProp: (prop) => prop !== "textOpacity",
})(({ theme, textOpacity }) => ({
  // --- Mobile Styling (Absolute Overlay) ---
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  padding: theme.spacing(2), // Padding inside the overlay
  color: theme.palette.common.white,
  textShadow: "1px 1px 4px rgba(0, 0, 0, 0.7)",
  zIndex: 1, // Ensure text is above the image
  opacity: textOpacity,
  transition: `opacity ${fadeDuration * 0.6}ms ease-in-out`,

  // --- Desktop Styling (Reset absolute, become normal flow content) ---
  [theme.breakpoints.up("md")]: {
    position: "relative", // Reset position
    width: "800px", // Reset width
    height: "auto", // Reset height
    textAlign: "left", // Alignment handled by parent container
    padding: theme.spacing(0, 0, 0, 0), // Reset padding, maybe add left padding
    maxWidth: "600px", // Keep max width constraint
    display: "block", // Reset display
  },
}));

// --- Container for the Search Bar (Unchanged) ---
const SearchAreaContainer = styled(Box)(({ theme }) => ({
  // Mobile Styles
  padding: theme.spacing(3, 2),
  backgroundColor: "#121212", // Match HeroWrapper dark fallback
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  zIndex: 1,

  // Desktop Styles
  [theme.breakpoints.up("md")]: {
    position: "relative",
    zIndex: 1,
    padding: theme.spacing(2),
    backgroundColor: "transparent",
    flexBasis: "50%",
    maxWidth: "550px",
    order: 1,
    transform: "scale(0.8)",
  },
}));

// --- Main Hero Component ---
const Hero = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [textOpacity, setTextOpacity] = useState(1);

  // Preload images to avoid delay on change
  useEffect(() => {
    heroImages.forEach((image) => {
      const img = new Image();
      img.src = image;
    });
  }, []);

  useEffect(() => {
    const mainInterval = setInterval(() => {
      // 1. Prepare for transition
      setIsTransitioning(true);
      setTextOpacity(0);

      // 2. Complete transition after fadeDuration
      const completeTimeout = setTimeout(() => {
        setCurrentImageIndex((prev) => {
          const nextIdx = (prev + 1) % heroImages.length;
          // Set next image for the next cycle
          setNextImageIndex((nextIdx + 1) % heroImages.length);
          return nextIdx;
        });
        setIsTransitioning(false);
        setTextOpacity(1);
      }, fadeDuration);

      return () => clearTimeout(completeTimeout);
    }, slideDuration);

    return () => clearInterval(mainInterval);
  }, []);

  const currentText = heroTextData[currentImageIndex];
  const currentImage = heroImages[currentImageIndex];

  return (
    // Pass currentImage for Desktop ::before, bgOpacity affects both mobile img and desktop ::before
    <HeroWrapper
      currentImage={heroImages[currentImageIndex]}
      nextImage={heroImages[nextImageIndex]}
      isTransitioning={isTransitioning}
    >
      {/* Container for Image & Text Overlay */}
      <ImageTextContainer>
        {/* Base Image for Mobile */}
        <MobileHeroImage src={heroImages[currentImageIndex]} alt="" />

        {/* Overlay Image for Mobile (Cross-fade) */}
        <MobileHeroImage
          src={heroImages[nextImageIndex]}
          alt={currentText.headline}
          op={isTransitioning ? 1 : 0}
          isOverlay={true}
        />

        {/* Text Overlay */}
        <HeroText textOpacity={textOpacity}>
          <Typography
            variant={isMobile ? "h5" : "h3"}
            component="h1"
            fontWeight="bold"
            gutterBottom
            sx={{ mb: 1 }}
          >
            {currentText.headline}
          </Typography>
          <Typography
            variant={isMobile ? "body2" : "h6"}
            component="p"
            sx={{ opacity: 0.9 }}
          >
            {currentText.subHeadline}
          </Typography>
        </HeroText>
      </ImageTextContainer>

      {/* Search Bar Area */}
      <SearchAreaContainer>
        <SearchMenu integrated={true} />
      </SearchAreaContainer>
    </HeroWrapper>
  );
};

export default Hero;
