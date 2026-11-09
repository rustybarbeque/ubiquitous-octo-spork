"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App } from "antd";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api-client";
import * as cartService from "@/lib/services/cart-service";
import * as orderService from "@/lib/services/order-service";
import { Cart, Order } from "@/lib/types";

interface CartContextValue {
  /** The signed-in user's cart, or null while loading / when signed out. */
  cart: Cart | null;
  loading: boolean;
  /** Item ids with a request in flight, so their controls can show a spinner. */
  pendingItemIds: ReadonlySet<string>;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (product: { id: string; name: string }) => Promise<void>;
  setQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  /** Throws an ApiError whose message says why the code was refused. */
  applyDiscount: (code: string) => Promise<void>;
  removeDiscount: () => Promise<void>;
  /**
   * Turns the cart into an order, then reloads the (now empty) cart.
   * Throws an ApiError whose message says why checkout was refused.
   */
  placeOrder: () => Promise<Order>;
}

const CartContext = createContext<CartContextValue | null>(null);

/** The cart as loaded for one specific token, so a sign-out never shows a stale cart. */
interface LoadedCart {
  token: string;
  cart: Cart;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const { token, logout } = useAuth();

  const [loaded, setLoaded] = useState<LoadedCart | null>(null);
  const [pendingItemIds, setPendingItemIds] = useState<ReadonlySet<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const cart = token && loaded?.token === token ? loaded.cart : null;
  const loading = token !== null && cart === null;

  // Load the cart whenever someone signs in (or the page loads signed in).
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    cartService
      .getCart(token)
      .then((result) => {
        if (!cancelled) setLoaded({ token, cart: result });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) logout();
        else message.error(`Couldn't load your cart. ${error instanceof Error ? error.message : ""}`);
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout, message]);

  /**
   * Runs one cart request and swaps in the cart it returns. Errors are shown
   * as a toast unless `rethrow` is set, in which case the caller shows them.
   */
  const run = useCallback(
    async (request: (token: string) => Promise<Cart>, options: { itemId?: string; rethrow?: boolean } = {}) => {
      if (!token) return;
      const { itemId, rethrow } = options;

      if (itemId) setPendingItemIds((ids) => new Set(ids).add(itemId));
      try {
        const result = await request(token);
        setLoaded({ token, cart: result });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logout();
          message.info("Your session has expired. Please sign in again.");
          return;
        }
        if (rethrow) throw error;
        message.error(error instanceof Error ? error.message : "Something went wrong.");
      } finally {
        if (itemId) {
          setPendingItemIds((ids) => {
            const next = new Set(ids);
            next.delete(itemId);
            return next;
          });
        }
      }
    },
    [token, logout, message],
  );

  const addItem = useCallback(
    async (product: { id: string; name: string }) => {
      if (!token) {
        message.info("Sign in to start a cart.");
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      let added = false;
      await run(
        async (t) => {
          const result = await cartService.addCartItem(t, product.id);
          added = true;
          return result;
        },
        { itemId: product.id },
      );
      if (added) message.success(`Added ${product.name} to your cart.`);
    },
    [token, run, message, router, pathname],
  );

  const placeOrder = useCallback(async () => {
    if (!token) throw new Error("Sign in to place an order.");
    try {
      const order = await orderService.placeOrder(token);
      // The API empties the cart as part of checkout; fetch the empty cart.
      cartService
        .getCart(token)
        .then((result) => setLoaded({ token, cart: result }))
        .catch(() => setLoaded(null));
      return order;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        throw new Error("Your session has expired. Please sign in again.");
      }
      // Stock may have moved underneath the customer: refresh the cart so the
      // page shows the current numbers alongside the error.
      cartService
        .getCart(token)
        .then((result) => setLoaded({ token, cart: result }))
        .catch(() => {});
      throw error;
    }
  }, [token, logout]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      pendingItemIds,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      addItem,
      setQuantity: (itemId, quantity) =>
        run((t) => cartService.setCartItemQuantity(t, itemId, quantity), { itemId }),
      removeItem: (itemId) => run((t) => cartService.removeCartItem(t, itemId), { itemId }),
      clear: () => run((t) => cartService.clearCart(t)),
      applyDiscount: (code) => run((t) => cartService.applyDiscountCode(t, code), { rethrow: true }),
      removeDiscount: () => run((t) => cartService.removeDiscountCode(t)),
      placeOrder,
    }),
    [cart, loading, pendingItemIds, isOpen, addItem, run, placeOrder],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>.");
  return context;
}
