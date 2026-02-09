/**
 * Central export file for all MongoDB models
 * Import from here to ensure models are registered properly
 */

export { default as User } from "./User";
export { default as Product } from "./Product";
export { default as Order } from "./Order";
export { default as Review } from "./Review";
export { default as Cart } from "./Cart";
export { default as Wishlist } from "./Wishlist";
export { default as Event } from "./Event";

// Type exports
export type { IUser, IBodyMetrics, IAddress } from "./User";
export type { IProduct } from "./Product";
export type { IOrder, IOrderItem, IShippingAddress } from "./Order";
export type { IReview } from "./Review";
export type { ICart, ICartItem } from "./Cart";
export type { IWishlist, IWishlistItem } from "./Wishlist";
export type { IEvent } from "./Event";
