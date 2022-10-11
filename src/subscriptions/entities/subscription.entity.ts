export enum SubscriptionPackageTypeEnum {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  HALF_YEARLY = 'HALF_YEARLY',
}

export enum ProviderSubscriptionTypeEnum {
  BASIC = 'BASIC',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export enum ProviderBackgourndCheckEnum {
  NONE = 'NONE',
  BASIC = 'BASIC',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

/**
 * Slugs of the membership plans
 */
export enum SubscriptionPlanSlugs {
  BASIC = 'basic',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum SubscriptionStatusEnum {
  incomplete = 'incomplete',
  incomplete_expired = 'incomplete_expired',
  trialing = 'trialing',
  active = 'active',
  past_due = 'past_due',
  canceled = 'canceled',
  unpaid = 'unpaid',
}
