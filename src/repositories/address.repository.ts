import { BaseRepository } from "./base.repository";
import { normalizeIranMobile } from "@/lib/numbers";

export type AddressRow = {
  id: string;
  user_id: string;
  title: string | null;
  full_name: string;
  phone: string;
  province: string | null;
  city: string;
  address_line: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
};

export type AddressInput = {
  title?: string;
  full_name: string;
  phone: string;
  province?: string;
  city: string;
  address_line: string;
  postal_code?: string;
  is_default?: boolean;
};

export class AddressRepository extends BaseRepository {
  async list(userId: string): Promise<AddressRow[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AddressRow[];
  }

  async create(userId: string, input: AddressInput): Promise<AddressRow> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("addresses")
      .insert({
        user_id: userId,
        title: input.title?.trim() || null,
        full_name: input.full_name.trim(),
        phone: normalizeIranMobile(input.phone) ?? input.phone.trim(),
        province: input.province?.trim() || null,
        city: input.city.trim(),
        address_line: input.address_line.trim(),
        postal_code: input.postal_code?.trim() || null,
        is_default: !!input.is_default,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as AddressRow;
  }

  async update(
    userId: string,
    id: string,
    input: Partial<AddressInput>
  ): Promise<void> {
    const supabase = await this.getClient();
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title?.trim() || null;
    if (input.full_name !== undefined) patch.full_name = input.full_name.trim();
    if (input.phone !== undefined) {
      const n = normalizeIranMobile(input.phone);
      patch.phone = n ?? input.phone.trim();
    }
    if (input.province !== undefined)
      patch.province = input.province?.trim() || null;
    if (input.city !== undefined) patch.city = input.city.trim();
    if (input.address_line !== undefined)
      patch.address_line = input.address_line.trim();
    if (input.postal_code !== undefined)
      patch.postal_code = input.postal_code?.trim() || null;
    if (input.is_default !== undefined) patch.is_default = !!input.is_default;
    patch.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("addresses")
      .update(patch as never)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async remove(userId: string, id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async setDefault(userId: string, id: string): Promise<void> {
    await this.update(userId, id, { is_default: true });
  }
}
