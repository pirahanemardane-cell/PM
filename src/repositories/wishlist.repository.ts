import { BaseRepository } from "./base.repository";

export class WishlistRepository extends BaseRepository {
  async listProductIds(userId: string): Promise<string[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((r) => r.product_id);
  }

  async has(userId: string, productId: string): Promise<boolean> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async add(userId: string, productId: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from("wishlists")
      .upsert(
        { user_id: userId, product_id: productId },
        { onConflict: "user_id,product_id" }
      );
    if (error) throw error;
  }

  async remove(userId: string, productId: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    if (error) throw error;
  }

  async toggle(
    userId: string,
    productId: string
  ): Promise<{ added: boolean }> {
    const exists = await this.has(userId, productId);
    if (exists) {
      await this.remove(userId, productId);
      return { added: false };
    }
    await this.add(userId, productId);
    return { added: true };
  }
}
