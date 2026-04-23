/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import AddService from "./AddService";
import { useDispatch, useSelector } from "react-redux";
import { fetchServiceById } from "../../store/thunks/serviceThunks";

const EditServicePage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await dispatch(fetchServiceById(serviceId)).unwrap();
        // response.data format from thunk seems to be { service, ... } OR just raw based on getServiceById
        const data = response.service || response;
        setService(data);
      } catch (err) {
        setError(err.message || "Failed to fetch service.");
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchServiceData();
    } else {
      setLoading(false);
      setError("No service ID provided.");
    }
  }, [serviceId, dispatch]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress /> <Typography ml={2}>Loading service...</Typography>
      </Box>
    );
  }

  if (error && !service) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to load service: {error}.
          <Button onClick={() => navigate(-1)} sx={{ ml: 1 }}>
            Back
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!service) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 3 }}>
          Service not found.
          <Button onClick={() => navigate(-1)} sx={{ ml: 1 }}>
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  // Authorization check: Only the owner can edit
  const isOwner = user && service.createdBy && (user._id === service.createdBy || user._id === service.createdBy?._id);
  
  if (!isOwner) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>
          You are not authorized to edit this service.
          <Button onClick={() => navigate(-1)} sx={{ ml: 1 }}>
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <AddService 
      initialData={service} 
      isEdit={true} 
    />
  );
};

export default EditServicePage;
