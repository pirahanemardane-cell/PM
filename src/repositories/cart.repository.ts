import { BaseRepository } from "./base.repository";

export class CartRepository extends BaseRepository {
  async getOrCreateCart(opts: {
    userId?: string | null;
    sessionId?: string | null;
  }): Promise<string> {
    const supabase = await this.getClient();
    if (opts.userId) {
      const { data } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", opts.userId)
        .maybeSingle();
      if (data?.id) return data.id;
      const { data: created, error } = await supabase
        .from("carts")
        .insert({ user_id: opts.userId })
        .select("id")
        .single();
      if (error) throw error;
      return created.id;
    }
    if (opts.sessionId) {
      const { data } = await supabase
        .from("carts")
        .select("id")
        .eq("session_id", opts.sessionId)
        .is("user_id", null)
        .maybeSingle();
      if (data?.id) return data.id;
      const { data: created, error } = await supabase
        .from("carts")
        .insert({ session_id: opts.sessionId })
        .select("id")
        .single();
      if (error) throw error;
      return created.id;
    }
    throw new Error("userId or sessionId required");
  }

  async addItem(
    cartId: string,
    variantId: string,
    quantity = 1
  ): Promise<void> {
    const supabase = await this.getClient();
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("variant_id", variantId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id);
      if (error) throw error;
      return;
    }
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cartId,
      variant_id: variantId,
      quantity,
    });
    if (error) throw error;
  }

  async setQuantity(
    cartId: string,
    variantId: string,
    quantity: number
  ): Promise<void> {
    const supabase = await this.getClient();
    if (quantity < 1) {
      await this.removeItem(cartId, variantId);
      return;
    }
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("cart_id", cartId)
      .eq("variant_id", variantId);
    if (error) throw error;
  }

  async removeItem(cartId: string, variantId: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId)
      .eq("variant_id", variantId);
    if (error) throw error;
  }

  async listItems(cartId: string) {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `
        id,
        quantity,
        variant_id,
        product_variants(
          id,
          price,
          product_id,
          size,
          color_name,
          color_hex,
          products(id, name, slug, product_images(url, is_primary, sort_order))
        )
      `
      )
      .eq("cart_id", cartId);
    if (error) throw error;
    return data ?? [];
  }

  async clearCart(cartId: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId);
    if (error) throw error;
  }


  /** اقلام سبد session مهمان را به سبد کاربر منتقل می‌کند و سبد مهمان را خالی/حذف می‌کند */
  async mergeSessionIntoUser(sessionId: string, userId: string): Promise<void> {
    if (!sessionId || !userId) return;
    const supabase = await this.getClient();

    const { data: guestCart } = await supabase
      .from("carts")
      .select("id")
      .eq("session_id", sessionId)
      .is("user_id", null)
      .maybeSingle();

    if (!guestCart?.id) return;

    const userCartId = await this.getOrCreateCart({ userId });
    if (guestCart.id === userCartId) return;

    const { data: guestItems } = await supabase
      .from("cart_items")
      .select("variant_id, quantity")
      .eq("cart_id", guestCart.id);

    for (const row of guestItems ?? []) {
      const vid = (row as { variant_id: string }).variant_id;
      const qty = Number((row as { quantity: number }).quantity) || 1;
      if (!vid) continue;
      await this.addItem(userCartId, vid, qty);
    }

    await this.clearCart(guestCart.id);
    await supabase.from("carts").delete().eq("id", guestCart.id);
  }

}
