// ─── Enums ───────────────────────────────────────────────

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ARRIVING = 'arriving',
  SEATED = 'seated',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ReservationSource {
  WEBSITE = 'website',
  APP = 'app',
  POS = 'pos',
  PHONE = 'phone',
  WALK_IN = 'walk_in',
  THIRD_PARTY = 'third_party',
}

export enum StaffRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  HOST = 'host',
  VIEWER = 'viewer',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  RESTAURANT_ADMIN = 'admin',
  MANAGER = 'manager',
  HOST = 'host',
  VIEWER = 'viewer',
  CUSTOMER = 'customer',
}

export enum TableShape {
  RECTANGLE = 'rectangle',
  ROUND = 'round',
  SQUARE = 'square',
}

export enum WaitingListStatus {
  WAITING = 'waiting',
  NOTIFIED = 'notified',
  SEATED = 'seated',
  EXPIRED = 'expired',
}

export enum PaymentStatus {
  NONE = 'none',
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  BYPASSED = 'bypassed',
}
