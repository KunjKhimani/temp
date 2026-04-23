import { Helmet } from "react-helmet-async";
import { ProductView } from "../sections/product/productView";

const ProductsPage = () => {
  return (
    <>
      <Helmet>
        <title> Product | Admin </title>
      </Helmet>

      <ProductView />
    </>
  );
};

export default ProductsPage;
