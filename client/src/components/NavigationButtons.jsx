import { Box, Button } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const defaultButtons = [
  { label: "Open Service Requests", to: "/service-requests/browse" },
  { label: "Recently Added Services", to: "/services/browse" },
  { label: "Products for sale", to: "/products" },
  { label: "Requested Products", to: "/requested-products" },
];

const buttonSx = (isSelected) => ({
  px: { xs: 1, md: 1.5 },
  py: 1,
  fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.85rem" },
  fontWeight: 600,
  whiteSpace: "nowrap",
  borderBottom: "2px solid",
  borderColor: "primary.main",
  borderRadius: 0,
  transition: "background-color 0.2s ease, border-radius 0.2s ease",
  ...(isSelected && {
    backgroundColor: "#82d7f7", 
    borderColor: "primary.dark",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
  }),
  "&:hover": {
    backgroundColor: "#82d7f7",
    borderColor: "primary.dark",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
  },
});

const NavigationButtons = ({
  buttons = defaultButtons,
  selectedValue,
  onButtonClick,
}) => {
  const { pathname } = useLocation();

  const isButtonSelected = (button) => {
    if (selectedValue !== undefined) {
      return button.value === selectedValue;
    }

    if (!button.to) {
      return false;
    }

    if (button.exact) {
      return pathname === button.to;
    }

    return pathname === button.to || pathname.startsWith(`${button.to}/`);
  };

  const handleButtonClick = (button) => {
    if (!onButtonClick) {
      return;
    }

    onButtonClick(button.value ?? button.to, button);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: { xs: "flex-start", md: "center", lg: "flex-start" },
        flexWrap: "nowrap",
        overflowX: "auto",
        gap: { xs: 0.5, sm: 1, md: 1.5, lg: 2 },
        my: 4,
        width: "100%",
        "&::-webkit-scrollbar": {
          display: "none",
        },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {buttons.map((button) => {
        const isRouteButton = !onButtonClick && !!button.to;

        return (
          <Button
            key={`${button.to ?? button.value ?? button.label}-${button.label}`}
            {...(isRouteButton
              ? { component: RouterLink, to: button.to }
              : { onClick: () => handleButtonClick(button), type: "button" })}
            variant="text"
            disableRipple
            disableElevation
            color="inherit"
            sx={buttonSx(isButtonSelected(button))}
          >
            {button.label}
          </Button>
        );
      })}
    </Box>
  );
};

NavigationButtons.propTypes = {
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
      value: PropTypes.string,
      exact: PropTypes.bool,
    }),
  ),
  selectedValue: PropTypes.string,
  onButtonClick: PropTypes.func,
};

export default NavigationButtons;
