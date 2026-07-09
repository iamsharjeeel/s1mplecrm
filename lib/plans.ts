export const PLAN_LIMITS = {
  free: {
    pipelines: 1,
    contacts: 500,
    members: 3,
  },
  pro: {
    pipelines: 10,
    contacts: 10_000,
    members: 25,
  },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

export type PlanLimits = (typeof PLAN_LIMITS)[PlanId];
