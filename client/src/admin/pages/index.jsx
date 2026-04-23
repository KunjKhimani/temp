import { Helmet } from "react-helmet-async";
import Dashboard from "../sections/dashboard/Dashboard";

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Dashboard - Dashboard`}</title>
        <meta
          name="description"
          //!This has to be changed in the future
          content="Welcome to Sparework"
        />
        <meta name="keywords" content="sparework,talent" />
      </Helmet>

      <Dashboard />
    </>
  );
}
