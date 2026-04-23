export const validateSignUp = (data) => {
  const errors = {};
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!data.password || data.password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }
  if (!data.username || data.username.length < 1) {
    errors.username = "Name is required.";
  }
  return errors;
};
