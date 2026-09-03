import { Product } from "./types";

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  "Graphics Cards": { bg: "16532d", fg: "bbf7d0" },
  Processors: { bg: "1e3a8a", fg: "bfdbfe" },
  Motherboards: { bg: "581c87", fg: "e9d5ff" },
  Memory: { bg: "9a3412", fg: "fed7aa" },
  Storage: { bg: "115e59", fg: "99f6e4" },
  "Power Supplies": { bg: "7f1d1d", fg: "fecaca" },
  Cooling: { bg: "155e75", fg: "a5f3fc" },
  Cases: { bg: "27272a", fg: "d4d4d8" },
  Monitors: { bg: "312e81", fg: "c7d2fe" },
};

function placeholderImage(name: string, category: string) {
  const { bg, fg } = CATEGORY_COLORS[category] ?? { bg: "27272a", fg: "d4d4d8" };
  const label = encodeURIComponent(name.replace(/ /g, "\n"));
  return `https://placehold.co/600x600/${bg}/${fg}.png?text=${label}&font=roboto`;
}

interface ProductSeed {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  quantityAvailable: number;
  category: string;
}

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    id: "p1",
    name: "Vantage RTX 5090 Ti 32GB",
    description: "Flagship graphics card with 32GB GDDR7 and a triple-slot cooler.",
    price: 3899.99,
    salePrice: 3499.99,
    quantityAvailable: 4,
    category: "Graphics Cards",
  },
  {
    id: "p2",
    name: "Titanium Core i9-15900KX",
    description: "24-core flagship desktop processor, unlocked, 6.2GHz boost.",
    price: 1299.0,
    salePrice: null,
    quantityAvailable: 11,
    category: "Processors",
  },
  {
    id: "p3",
    name: "Apex X870E Extreme Motherboard",
    description: "E-ATX flagship board with PCIe 5.0, Wi-Fi 7, and 24-phase VRM.",
    price: 1499.99,
    salePrice: null,
    quantityAvailable: 0,
    category: "Motherboards",
  },
  {
    id: "p4",
    name: "Ryzen Threadripper 9980X",
    description: "64-core workstation CPU for rendering and simulation workloads.",
    price: 8999.0,
    salePrice: 7999.0,
    quantityAvailable: 2,
    category: "Processors",
  },
  {
    id: "p5",
    name: "Prism DDR5-8000 64GB Kit",
    description: "2x32GB low-latency RGB memory kit, CL32.",
    price: 799.0,
    salePrice: null,
    quantityAvailable: 38,
    category: "Memory",
  },
  {
    id: "p6",
    name: "Nova NVMe Gen5 4TB SSD",
    description: "PCIe 5.0 M.2 SSD, 14,000MB/s read with integrated heatsink.",
    price: 899.0,
    salePrice: 749.0,
    quantityAvailable: 16,
    category: "Storage",
  },
  {
    id: "p7",
    name: "Titan 1600W Platinum PSU",
    description: "Fully modular ATX 3.1 power supply with native 12V-2x6 cable.",
    price: 699.0,
    salePrice: null,
    quantityAvailable: 3,
    category: "Power Supplies",
  },
  {
    id: "p8",
    name: "Cryo 360 AIO Liquid Cooler",
    description: "360mm triple-fan AIO with a 3.5in LCD pump display.",
    price: 499.99,
    salePrice: null,
    quantityAvailable: 21,
    category: "Cooling",
  },
  {
    id: "p9",
    name: "Monolith Full Tower Case",
    description: "Dual-chamber tempered glass case with support for 480mm radiators.",
    price: 599.0,
    salePrice: 479.0,
    quantityAvailable: 7,
    category: "Cases",
  },
  {
    id: "p10",
    name: "Vertex 32in 4K 240Hz Monitor",
    description: "QD-OLED display with 0.03ms response time and DisplayPort 2.1.",
    price: 2499.0,
    salePrice: null,
    quantityAvailable: 9,
    category: "Monitors",
  },
  {
    id: "p11",
    name: "Vantage RTX 5080 16GB",
    description: "High-end graphics card with 16GB GDDR7 and dual-slot cooling.",
    price: 1899.0,
    salePrice: 1649.0,
    quantityAvailable: 13,
    category: "Graphics Cards",
  },
  {
    id: "p12",
    name: "Quantum 2TB PCIe 5.0 SSD",
    description: "Compact M.2 2280 SSD built for high-refresh gaming rigs.",
    price: 549.0,
    salePrice: null,
    quantityAvailable: 1,
    category: "Storage",
  },
];

export const MOCK_PRODUCTS: Product[] = PRODUCT_SEEDS.map((seed) => ({
  ...seed,
  imageUrl: placeholderImage(seed.name, seed.category),
}));

