import { cookies } from "next/headers";

export const CART_COOKIE = "cart_session";

export async function getCartSessionId() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

export async function setCartSessionId(id: string) {
  const store = await cookies();
  store.set(CART_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
