export type UserRole = 'CUSTOMER' | 'ADMIN' | 'WAREHOUSE_STAFF';
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'BANNED' | 'PENDING';

export interface User {
  id: number | string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
export type BookStatus = 'ACTIVE' | 'INACTIVE';

export interface BookAuthorRef {
  id: string;
  name: string;
}

export interface BookPublisherRef {
  id: string;
  name: string;
}

export interface BookCategoryRef {
  id: string;
  name: string;
}

export interface BookListItem {
  id: string;
  slug: string;
  title: string;
  isbn: string;
  price: string;
  discountPrice: string | null;
  discountEndDate: string | null;
  avgRating: string;
  reviewCount: number;
  stockQuantity: number;
  status: BookStatus;
  primaryImage: string | null;
  authors: BookAuthorRef[];
  publisher: BookPublisherRef | null;
  category: BookCategoryRef | null;
}

export interface BookDetail extends BookListItem {
  language: string;
  yearPublished: number | null;
  description: string | null;
  pages: number | null;
  dimensions: string | null;
  weight: string | null;
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    displayOrder: number;
  }>;
  breadcrumb: Array<{ id: string; name: string; slug: string }>;
  authorIds: string[];
}

export interface PageEnvelope<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  children: Category[];
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
export interface CartItemView {
  id: string;
  bookId: string;
  quantity: number;
  outOfStock: boolean;
  book: {
    id: string;
    slug: string;
    title: string;
    price: string;
    discountPrice: string | null;
    stockQuantity: number;
    primaryImage: string | null;
    status: BookStatus;
  };
}

export interface CartView {
  items: CartItemView[];
  subtotal: number;
  itemCount: number;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUND_PENDING' | 'REFUNDED';
export type PaymentMethod = 'COD' | 'VNPAY';

export interface OrderSummary {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalAmount: string;
  subtotal: string;
  shippingFee: string;
  discountAmount: string;
  itemCount: number;
  firstBookTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemView {
  id: string;
  bookId: string;
  quantity: number;
  priceAtTime: string;
  bookTitleSnapshot: string;
  book: {
    id: string;
    slug: string;
    title: string;
    primaryImage: string | null;
  } | null;
}

export interface OrderStatusLogView {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
  changedBy: string | null;
  changedByName: string | null;
}

export interface OrderDetail extends OrderSummary {
  userId: string;
  user?: { id: string; email: string; fullName: string } | null;
  addressSnapshot: {
    id: string;
    recipientName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    streetAddress: string;
  } | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  note: string | null;
  items: OrderItemView[];
  statusLogs: OrderStatusLogView[];
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------
export interface Address {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}
