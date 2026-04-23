/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, ShoppingBag, CheckCircle } from "lucide-react";

const StyledModalContent = styled(Paper)(({ theme }) => ({
  width: 480,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[24],
  padding: theme.spacing(5),
  outline: "none",
  borderRadius: theme.shape.borderRadius * 2,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  [theme.breakpoints.down("sm")]: {
    width: "90%",
    padding: theme.spacing(4),
  },
}));

const OptionBox = styled(motion.div)(({ selected, theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  border: `2px solid ${
    selected ? theme.palette.primary.main : theme.palette.divider
  }`,
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  backgroundColor: selected ? theme.palette.primary.light : "transparent",
  transition: "0.3s ease",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const UserIntentModal = ({ open, onClose, onSubmit, isLoading, error }) => {
  const [intent, setIntent] = useState(""); // 'provide' or 'buy'
  const [selectedCategories, setSelectedCategories] = useState([]); // 'services', 'products'

  useEffect(() => {
    if (!open) {
      setIntent("");
      setSelectedCategories([]);
    }
  }, [open]);

  const handleIntentSelect = (value) => {
    setIntent(value);
    setSelectedCategories([]);
  };

  const toggleCategory = (value) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const handleSubmit = () => {
    if (intent && selectedCategories.length > 0) {
      onSubmit({ intent, categories: selectedCategories });
    } else {
      console.log("Please select an intent and at least one category.");
    }
  };

  return (
    <Modal
      open={open}
      disableEscapeKeyDown
      aria-labelledby="user-intent-modal-title"
      aria-describedby="user-intent-modal-description"
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }} // Ensure modal covers full viewport and centers content
      BackdropProps={{
        sx: {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <StyledModalContent
        as={motion.div}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <Typography variant="h5" textAlign="center">
          How do you intend to use Sparework?
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary">
          Select your main goal on the platform.
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <Box display="flex" flexDirection="column" gap={2}>
          <OptionBox
            selected={intent === "provide"}
            onClick={() => handleIntentSelect("provide")}
          >
            <Briefcase />
            <Typography>Provide services or products</Typography>
          </OptionBox>
          <OptionBox
            selected={intent === "buy"}
            onClick={() => handleIntentSelect("buy")}
          >
            <ShoppingBag />
            <Typography>Buy service or product</Typography>
          </OptionBox>
        </Box>

        <AnimatePresence>
          {intent && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography fontWeight={500}>Specifically:</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {["services", "products"].map((cat) => (
                  <OptionBox
                    key={cat}
                    selected={selectedCategories.includes(cat)}
                    onClick={() => toggleCategory(cat)}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CheckCircle
                      color={
                        selectedCategories.includes(cat) ? "green" : "gray"
                      }
                      size={20}
                    />
                    <Typography textTransform="capitalize">{cat}</Typography>
                  </OptionBox>
                ))}
              </Box>
            </Box>
          )}
        </AnimatePresence>

        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={isLoading || !intent || selectedCategories.length === 0}
          startIcon={
            isLoading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isLoading ? "Saving..." : "Continue"}
        </Button>
      </StyledModalContent>
    </Modal>
  );
};

export default UserIntentModal;
