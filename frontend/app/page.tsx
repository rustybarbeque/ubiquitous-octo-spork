import StoreExperience from "@/components/store/StoreExperience";
import { getProducts } from "@/lib/services/product-service";

export default async function Home() {
  const products = await getProducts();
  return <StoreExperience products={products} />;
}
