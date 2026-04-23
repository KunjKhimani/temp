import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";

export function PromotionCard({ title, description, color, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        borderRadius: 3,
        border: "1px solid",
        borderColor: `${color}.light`,
        transition: "0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box mb={1}>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

PromotionCard.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  color: PropTypes.string,
  onClick: PropTypes.func,
};