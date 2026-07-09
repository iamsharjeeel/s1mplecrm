export type Role = "owner" | "admin" | "member";

export type Action =
  | "org:update"
  | "org:delete"
  | "members:invite"
  | "members:manage"
  | "contacts:create"
  | "contacts:update"
  | "contacts:delete"
  | "deals:create"
  | "deals:update"
  | "deals:delete"
  | "tasks:manage"
  | "emails:send"
  | "billing:view";

const matrix: Record<Role, ReadonlySet<Action>> = {
  owner: new Set([
    "org:update",
    "org:delete",
    "members:invite",
    "members:manage",
    "contacts:create",
    "contacts:update",
    "contacts:delete",
    "deals:create",
    "deals:update",
    "deals:delete",
    "tasks:manage",
    "emails:send",
    "billing:view",
  ]),
  admin: new Set([
    "org:update",
    "members:invite",
    "members:manage",
    "contacts:create",
    "contacts:update",
    "contacts:delete",
    "deals:create",
    "deals:update",
    "deals:delete",
    "tasks:manage",
    "emails:send",
    "billing:view",
  ]),
  member: new Set([
    "contacts:create",
    "contacts:update",
    "deals:create",
    "deals:update",
    "tasks:manage",
    "emails:send",
    "billing:view",
  ]),
};

export function can(role: Role, action: Action): boolean {
  return matrix[role].has(action);
}

export function assertCan(role: Role, action: Action): void {
  if (!can(role, action)) {
    throw new Error("You do not have permission for this action");
  }
}
