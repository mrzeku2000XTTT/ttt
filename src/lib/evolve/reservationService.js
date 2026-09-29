/**
 * ReservationService — holds game resources during the payment pipeline.
 *
 *   AVAILABLE → RESERVED (before Scorpion) → TRANSFERRED (after confirmation)
 *                                      ↘ RELEASED (on failure/cancel/expire)
 *
 * While RESERVED, the seller still owns the resource but cannot sell the
 * reserved quantity to anyone else. This prevents double-selling during the
 * BROADCAST → CONFIRMING window.
 */

import { TxStatus } from "./txStateMachine";

/**
 * Create a reservation on an actor's assets.
 * Returns the reservation record, or { ok: false, reason }.
 */
export function createReservation({ seller, buyer, resource, quantity, priceSompi, paymentIntentId, expiresAt, day }) {
  if (!seller || !buyer) return { ok: false, reason: "MISSING_ACTORS" };
  if (!resource || !quantity || quantity <= 0) return { ok: false, reason: "INVALID_QTY" };

  const available = (seller.assets?.[resource] || 0) - (seller.reservedAssets?.[resource] || 0);
  if (available < quantity) {
    return { ok: false, reason: "INSUFFICIENT_AVAILABLE", available, requested: quantity };
  }

  // Track reserved amount on the seller.
  if (!seller.reservedAssets) seller.reservedAssets = {};
  seller.reservedAssets[resource] = (seller.reservedAssets[resource] || 0) + quantity;

  const reservation = {
    reservation_key: `RES_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    resource_type: resource,
    quantity,
    seller_actor_id: seller.id,
    seller_code: seller.code,
    buyer_actor_id: buyer.id,
    buyer_code: buyer.code,
    price_sompi: priceSompi || 0,
    payment_intent_id: paymentIntentId || "",
    status: "RESERVED",
    created_at: new Date().toISOString(),
    expires_at: expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min default
    day: day || 0,
  };

  return { ok: true, reservation };
}

/**
 * Transfer a reserved resource to the buyer after confirmation.
 * This is the ONLY path that moves resource ownership.
 */
export function transferReservation(reservation, seller, buyer) {
  if (!reservation || reservation.status !== "RESERVED") {
    return { ok: false, reason: "NOT_RESERVED" };
  }

  const { resource_type: resource, quantity } = reservation;

  // Remove from seller's actual inventory.
  seller.assets[resource] = Number(((seller.assets[resource] || 0) - quantity).toFixed(2));
  // Remove from seller's reserved tracker.
  if (seller.reservedAssets) {
    seller.reservedAssets[resource] = Math.max(0, (seller.reservedAssets[resource] || 0) - quantity);
  }

  // Credit to buyer.
  if (!buyer.assets) buyer.assets = {};
  buyer.assets[resource] = Number(((buyer.assets[resource] || 0) + quantity).toFixed(2));

  reservation.status = "TRANSFERRED";
  reservation.settled_at = new Date().toISOString();

  return { ok: true };
}

/**
 * Release a reservation back to the seller — used on failure, cancel, or expiry.
 * The resource stays with the seller; only the reserved tracker is decremented.
 */
export function releaseReservation(reservation, seller) {
  if (!reservation) return { ok: false, reason: "NO_RESERVATION" };
  if (reservation.status === "TRANSFERRED") return { ok: true }; // already done
  if (reservation.status === "RELEASED") return { ok: true }; // already released

  const { resource_type: resource, quantity } = reservation;
  if (seller && seller.reservedAssets) {
    seller.reservedAssets[resource] = Math.max(0, (seller.reservedAssets[resource] || 0) - quantity);
  }
  reservation.status = "RELEASED";
  return { ok: true };
}

/**
 * Check if a reservation has expired and should be auto-released.
 */
export function checkExpiry(reservation, seller, now = Date.now()) {
  if (!reservation || reservation.status !== "RESERVED") return false;
  if (new Date(reservation.expires_at).getTime() < now) {
    releaseReservation(reservation, seller);
    reservation.status = "EXPIRED";
    return true;
  }
  return false;
}