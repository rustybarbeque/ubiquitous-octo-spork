"use client";

import { Drawer } from "antd";
import { ShoppingCart } from "lucide-react";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  return (
    <Drawer
      title={
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-zinc-700" />
          Your Cart
        </span>
      }
      placement="right"
      open={open}
      onClose={onClose}
      size={400}
    >
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-500">Your cart is empty.</p>
      </div>
    </Drawer>
  );
}
