/* eslint-disable no-unused-vars */
import { Modal, Box, Typography, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux"; // Removed as onSelect handles dispatch
import PropTypes from "prop-types";
import {
  Handyman,
  Store,
  Work,
  Assignment,
  ShoppingCart,
  PersonSearch,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
// import { setFormSubmissionRequired } from "../../src/store/slice/navigationSlice"; // Removed as onSelect handles dispatch

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 450,
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 4,
  textAlign: "center",
  border: "none",
  background: "linear-gradient(145deg, #f5f7fa, #e4e7eb)",
  "&:focus": {
    outline: "none",
  },
};

const FirstRequestOfferModal = ({
  open,
  onClose,
  onSelect, // New prop
  // currentUser,
}) => {
  const navigate = useNavigate();
  // const dispatch = useDispatch(); // No longer needed here, onSelect handles it

  const currentUser = useSelector((state) => state.user.user);

  const isSeller = currentUser.isSeller;

  const handleButtonClick = (route) => {
    onSelect(route); // Call the new onSelect callback
    // navigate(route); // onSelect will handle navigation
    onClose();
  };
  currentUser;

  // Button style configuration
  const buttonStyle = {
    width: "100%",
    py: 1.5,
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "1rem",
    textTransform: "none",
    transition: "all 0.3s ease",
    boxShadow:
      "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow:
        "0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)",
    },
  };

  return (
    <Modal
      open={open}
      disableEscapeKeyDown
      disableBackdropClick
      aria-labelledby="first-request-offer-modal-title"
    >
      <Box sx={style}>
        <Typography
          id="first-request-offer-modal-title"
          variant="h5"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: "#2d3748",
            mb: 3,
            background: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ✨ List Your First Request or Offer! ✨
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{
            mb: 3,
            color: "#4a5568",
            fontWeight: 500,
          }}
        >
          Choose your category to get started:
        </Typography>

        <Stack spacing={2} direction="column" alignItems="center">
          {isSeller ? (
            <>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: "#2d3748",
                  alignSelf: "flex-start",
                  pl: 1,
                }}
              >
                Provide:
              </Typography>
              <Button
                variant="contained"
                onClick={() => handleButtonClick("/provider/services/add")}
                startIcon={<Handyman sx={{ fontSize: 28 }} />}
                sx={{
                  ...buttonStyle,
                  background:
                    "linear-gradient(45deg, #11998e 0%, #38ef7d 100%)",
                }}
              >
                Service
              </Button>
              <Button
                variant="contained"
                onClick={() => handleButtonClick("/products/add")}
                startIcon={<Store sx={{ fontSize: 28 }} />}
                sx={{
                  ...buttonStyle,
                  background:
                    "linear-gradient(45deg, #0072ff 0%, #00c6ff 100%)",
                }}
              >
                Product
              </Button>
              {/* <Button
                variant="contained"
                onClick={() => handleButtonClick("/user/profile/edit")}
                startIcon={<Work sx={{ fontSize: 28 }} />}
                sx={{
                  ...buttonStyle,
                  background:
                    "linear-gradient(45deg, #ff6b6b 0%, #ffa8a8 100%)",
                }}
              >
                Talent
              </Button> */}
            </>
          ) : (
            <>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: "#2d3748",
                  alignSelf: "flex-start",
                  pl: 1,
                }}
              >
                Request:
              </Typography>
              <Button
                variant="contained"
                onClick={() => handleButtonClick("/service-requests/create")}
                startIcon={<Assignment sx={{ fontSize: 28 }} />}
                sx={{
                  ...buttonStyle,
                  background:
                    "linear-gradient(45deg, #11998e 0%, #38ef7d 100%)",
                }}
              >
                Service
              </Button>
              <Button
                variant="contained"
                onClick={() => handleButtonClick("/requested-products/create")}
                startIcon={<ShoppingCart sx={{ fontSize: 28 }} />}
                sx={{
                  ...buttonStyle,
                  background:
                    "linear-gradient(45deg, #0072ff 0%, #00c6ff 100%)",
                }}
              >
                Product
              </Button>
              {/* <Button
                variant="contained"
                onClick={() => handleButtonClick("/user/profile/edit")}
                startIcon={<PersonSearch sx={{ fontSize: 28 }} />}
                sx={{
                  ...buttonStyle,
                  background:
                    "linear-gradient(45deg, #ff6b6b 0%, #ffa8a8 100%)",
                }}
              >
                Talent
              </Button> */}
            </>
          )}
        </Stack>
      </Box>
    </Modal>
  );
};

FirstRequestOfferModal.propTypes = {
  open: PropTypes.bool.isRequired,
  userCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired, // New prop type
};

export default FirstRequestOfferModal;
