import StoreExperience from "@/components/store/StoreExperience";
import { MOCK_PRODUCTS } from "@/lib/mock-data";

export default function Home() {
  return <StoreExperience products={MOCK_PRODUCTS} />;
}
