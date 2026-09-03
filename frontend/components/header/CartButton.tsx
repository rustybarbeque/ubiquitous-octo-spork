"use client";

import { Badge, Button } from "antd";
import { ShoppingCart } from "lucide-react";

interface CartButtonProps {
  itemCount: number;
  onClick: () => void;
}

export default function CartButton({ itemCount, onClick }: CartButtonProps) {
  return (
    <Badge count={itemCount} size="small" offset={[-6, 6]}>
      <Button
        type="text"
        icon={<ShoppingCart className="h-5 w-5" strokeWidth={2} />}
        onClick={onClick}
        aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      >
        Cart
      </Button>
    </Badge>
  );
}
