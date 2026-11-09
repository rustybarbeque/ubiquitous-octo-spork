"use client";

import { useCart } from "@/components/cart/CartProvider";
import CartButton from "./CartButton";

/** The header's cart button, wired to the shared cart and drawer. */
export default function HeaderCartButton() {
  const { cart, open } = useCart();
  return <CartButton itemCount={cart?.itemCount ?? 0} onClick={open} />;
}
