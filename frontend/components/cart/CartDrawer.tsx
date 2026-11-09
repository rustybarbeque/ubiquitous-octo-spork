"use client";

import Link from "next/link";
import { Button, Drawer, Popconfirm, Spin } from "antd";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "./CartProvider";
import CartLineItem from "./CartLineItem";
import CartSummary from "./CartSummary";
import DiscountCodeForm from "./DiscountCodeForm";

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full flex-col items-center justify-center gap-3 text-center">{children}</div>;
}

export default function CartDrawer() {
  const { status } = useAuth();
  const router = useRouter();
  const { cart, loading, isOpen, close, clear } = useCart();

  const hasLines = !!cart && cart.lines.length > 0;

  let body: React.ReactNode;
  if (status === "signed-out") {
    body = (
      <CenteredMessage>
        <p className="text-sm text-zinc-500">Sign in to start a cart.</p>
        <Link href="/login" onClick={close}>
          <Button type="primary">Sign in</Button>
        </Link>
      </CenteredMessage>
    );
  } else if (loading || !cart) {
    body = (
      <CenteredMessage>
        <Spin />
      </CenteredMessage>
    );
  } else if (!hasLines) {
    body = (
      <CenteredMessage>
        <ShoppingCart className="h-10 w-10 text-zinc-300" />
        <p className="text-sm text-zinc-500">Your cart is empty.</p>
      </CenteredMessage>
    );
  } else {
    body = (
      <ul className="-my-4 divide-y divide-zinc-100">
        {cart.lines.map((line) => (
          <CartLineItem key={line.itemId} line={line} />
        ))}
      </ul>
    );
  }

  return (
    <Drawer
      title={
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-zinc-700" />
          Your Cart
        </span>
      }
      extra={
        hasLines && (
          <Popconfirm
            title="Empty your cart?"
            description="This removes every item and any discount code."
            okText="Empty cart"
            okButtonProps={{ danger: true }}
            onConfirm={clear}
          >
            <Button type="text" size="small" danger>
              Clear
            </Button>
          </Popconfirm>
        )
      }
      placement="right"
      open={isOpen}
      onClose={close}
      size={420}
      footer={
        hasLines && (
          <div className="flex flex-col gap-4 py-2">
            <DiscountCodeForm />
            <CartSummary cart={cart} />
            <Button
              type="primary"
              size="large"
              block
              icon={<ArrowRight className="h-4 w-4" />}
              iconPlacement="end"
              onClick={() => {
                close();
                router.push("/checkout");
              }}
            >
              Checkout
            </Button>
          </div>
        )
      }
    >
      {body}
    </Drawer>
  );
}
