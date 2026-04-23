import { Box, Breadcrumbs, Grid, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";
import PopularCategories from "../LandingPage/PopularCatagories";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
// import { fetchLatestServices } from "../../store/slice/serviceSlice";
import ServiceCard from "../Service/ServiceCard";
import { fetchLatestServices } from "../../store/thunks/serviceThunks";

const Explore = () => {
  const dispatch = useDispatch();
  const latestServices = useSelector((state) => state.service.latestServices);

  useEffect(() => {
    if (!latestServices.length) {
      dispatch(fetchLatestServices());
    }
  }, [dispatch, latestServices]);
  console.log(latestServices);
  return (
    <Box p={3}>
      <Breadcrumbs
        separator={<ChevronRightIcon />}
        aria-label="breadcrumb"
        sx={{ mb: 3, fontSize: "1.1rem" }}
      >
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <HomeIcon fontSize="small" />
            <Typography>Home</Typography>
          </Box>
        </Link>
        <Typography color="textPrimary">Explore</Typography>
      </Breadcrumbs>
      <Typography variant="h4" fontWeight={"bold"} textAlign="center" mt={5}>
        Explore Our Services
      </Typography>
      {latestServices.length ? (
        <Box>
          <Typography variant="h5" fontWeight={"bold"} mt={3} mb={3}>
            Latest services from our providers
          </Typography>
          <Grid container spacing={3}>
            {latestServices.map((service, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={service._id || index}>
                <ServiceCard
                  service={service}
                  category={service.category}
                  subcategory={service.subcategory}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <></>
      )}
      <PopularCategories />
    </Box>
  );
};

export default Explore;
