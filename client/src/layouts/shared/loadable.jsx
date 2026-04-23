import { lazy, Suspense } from "react";
import { CircularProgress, Container } from "@mui/material";

const Loading = () => {
  return (
    <Container
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
    </Container>
  );
};
const Loadable = (Component) => (props) =>
  (
    <Suspense fallback={<Loading />}>
      <Component {...props} />
    </Suspense>
  );

export default Loadable;
