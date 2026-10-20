/**
 * Permission matrix — single source for role capabilities
 */
export const ROLES = ["guest", "customer", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "catalog.view","cart.manage","checkout.place","order.view_own","order.cancel_own",
  "return.request","review.create","review.report","profile.manage","ticket.create",
  "admin.access","admin.products","admin.orders","admin.customers","admin.content",
  "admin.discounts","admin.shipping","admin.reviews","admin.returns","admin.settings",
  "admin.users","admin.reports","admin.media",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL_ADMIN = PERMISSIONS.filter((p) => p.startsWith("admin."));

const ROLE_MAP: Record<Role, readonly Permission[]> = {
  guest: ["catalog.view", "cart.manage"],
  customer: [
    "catalog.view","cart.manage","checkout.place","order.view_own","order.cancel_own",
    "return.request","review.create","review.report","profile.manage","ticket.create",
  ],
  staff: [
    "catalog.view","cart.manage","checkout.place","order.view_own","order.cancel_own",
    "return.request","review.create","review.report","profile.manage","ticket.create",
    "admin.access","admin.products","admin.orders","admin.content","admin.reviews",
    "admin.returns","admin.shipping","admin.media",
  ],
  admin: [
    "catalog.view","cart.manage","checkout.place","order.view_own","order.cancel_own",
    "return.request","review.create","review.report","profile.manage","ticket.create",
    ...ALL_ADMIN,
  ],
};

export function normalizeRole(raw: string | null | undefined): Role {
  const r = String(raw || "").toLowerCase().trim();
  if (r === "admin") return "admin";
  if (r === "staff") return "staff";
  if (r === "customer") return "customer";
  return "guest";
}

export function can(role: Role | string | null | undefined, permission: Permission): boolean {
  const r = normalizeRole(typeof role === "string" ? role : role);
  return (ROLE_MAP[r] as readonly string[]).includes(permission);
}

export function permissionsFor(role: Role | string | null | undefined): readonly Permission[] {
  return ROLE_MAP[normalizeRole(typeof role === "string" ? role : role)];
}
