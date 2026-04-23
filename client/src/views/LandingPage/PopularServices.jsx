import "react-multi-carousel/lib/styles.css";
import { Typography, Box } from "@mui/material";
import Carousel from "react-multi-carousel";
import myImage from "../../assets/images/hero1.jpg";

const services = [
  { title: "Website Development", image: myImage, backgroundColor: "#DFF5E3" },
  { title: "Logo Design", image: myImage, backgroundColor: "#FCE5EC" },
  { title: "SEO", image: myImage, backgroundColor: "#E3F4FF" },
  {
    title: "Architecture & Interior Design",
    image: myImage,
    backgroundColor: "#FFE7E0",
  },
  {
    title: "Social Media Marketing",
    image: myImage,
    backgroundColor: "#E9F9E7",
  },
  { title: "Voice Over", image: myImage, backgroundColor: "#F8E2D4" },
];

const PopularServices = () => {
  return (
    <Box sx={{ width: "100%", margin: "32px 0" }}>
      <Typography
        sx={{
          marginBottom: "16px",
          fontWeight: "bold",
        }}
        variant="h5"
      >
        Popular Services
      </Typography>
      <Carousel
        additionalTransfrom={0}
        arrows
        autoPlaySpeed={3000}
        centerMode={false}
        className=""
        containerClass="container"
        dotListClass=""
        draggable
        focusOnSelect={false}
        infinite={false}
        itemClass=""
        keyBoardControl
        minimumTouchDrag={80}
        pauseOnHover
        renderArrowsWhenDisabled={false}
        renderButtonGroupOutside={false}
        renderDotsOutside={false}
        responsive={{
          desktop: {
            breakpoint: {
              max: 3000,
              min: 1024,
            },
            items: 4,
            partialVisibilityGutter: 30,
          },
          mobile: {
            breakpoint: {
              max: 464,
              min: 0,
            },
            items: 1,
            partialVisibilityGutter: 30,
          },
          tablet: {
            breakpoint: {
              max: 1024,
              min: 464,
            },
            items: 2,
            partialVisibilityGutter: 30,
          },
        }}
        rewind={false}
        rewindWithAnimation={false}
        rtl={false}
        shouldResetAutoplay
        showDots={false}
        sliderClass=""
        slidesToSlide={1}
        swipeable
      >
        {services.map((service, index) => (
          <div
            key={index}
            style={{
              backgroundColor: service.backgroundColor,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
              padding: "20px",
              borderRadius: "24px",
              margin: "0 8px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.3s ease",
            }}
            className="carousel-card"
          >
            <img
              src={service.image}
              alt={service.title}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "12px",
              }}
            />
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: "bold",
                textAlign: "center",
                color: "#333",
              }}
              variant="h6"
            >
              {service.title}
            </Typography>
          </div>
        ))}
      </Carousel>
    </Box>
  );
};

export default PopularServices;
