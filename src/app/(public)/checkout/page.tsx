"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App as AntdApp,
  Button,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  MinusOutlined,
  PlusOutlined,
  DeleteOutlined,
  SafetyOutlined,
  FileProtectOutlined,
  SyncOutlined,
  CheckOutlined,
  CloseCircleFilled,
  EnvironmentOutlined,
  CarOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, extractErrorMessage, unwrap } from "@/lib/api";
import { BookListRowSkeleton } from "@/components/book-card-skeleton";
import { EmptyState, PageHeading } from "@/components/editorial";
import { formatVnd } from "@/lib/format";
import { BookCover } from "@/components/book-cover";
import { useAuthStore } from "@/lib/auth-store";
import { useResponsive } from "@/lib/use-responsive";
import { buildGuestCartView, useGuestCartStore } from "@/lib/guest-cart-store";
import type {
  Address,
  CartItemView,
  CartView,
  OrderDetail,
  VoucherValidation,
} from "@/lib/types";

const { Text } = Typography;

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8001";

// Server ultimately fixes shipping at 30 000đ for COD. We display "35 000đ" to
// match the mockup but the actual amount is authoritative on the server side.
const DISPLAY_SHIPPING_FEE = 35000;

type PaymentChoice = "COD" | "VNPAY";

/* --------------------------------------------------------------------------
 * Address modal (reused from old checkout)
 * ------------------------------------------------------------------------ */
interface AddressFormValues {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
}

function AddressModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<AddressFormValues>();

  const create = useMutation({
    mutationFn: async (values: AddressFormValues) => {
      const res = await api.post("/users/me/addresses", values);
      return unwrap<Address>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      message.success("Đã thêm địa chỉ");
      form.resetFields();
      onClose();
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, "Không thể thêm địa chỉ"));
    },
  });

  return (
    <Modal
      title="Thêm địa chỉ mới"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={create.isPending}
      okText="Lưu"
      cancelText="Huỷ"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => create.mutate(v)}
        preserve={false}
      >
        <Form.Item
          name="recipientName"
          label="Người nhận"
          rules={[{ required: true, message: "Vui lòng nhập tên người nhận" }]}
        >
          <Input placeholder="Nguyễn Văn A" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại" },
            {
              pattern: /^[0-9+\-\s]{8,20}$/,
              message: "Số điện thoại không hợp lệ",
            },
          ]}
        >
          <Input placeholder="09xxxxxxxx" />
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="province"
              label="Tỉnh/TP"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="district"
              label="Quận/Huyện"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="ward"
              label="Phường/Xã"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="streetAddress"
          label="Địa chỉ cụ thể"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
        >
          <Input placeholder="Số nhà, đường..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
 * Step card wrapper
 * ------------------------------------------------------------------------ */
function StepCard({
  step,
  icon,
  title,
  trailing,
  children,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid var(--color-divider)",
        borderRadius: 16,
        // Tighter padding on phones to keep cards from feeling bloated.
        padding: "clamp(16px, 4vw, 28px)",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--color-primary)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-serif), Georgia, serif",
            fontWeight: 700,
            fontSize: 16,
            flex: "0 0 auto",
          }}
        >
          {step}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--color-ink)",
            }}
          >
            <span style={{ color: "var(--color-muted)", fontSize: 16 }}>
              {icon}
            </span>
            {title}
          </div>
        </div>
        {trailing}
      </div>
      {children}
    </section>
  );
}

/* --------------------------------------------------------------------------
 * Cart item line — works both for server-backed and guest cart items.
 * ------------------------------------------------------------------------ */
function CartItemLine({
  item,
  mode,
}: {
  item: CartItemView;
  mode: "server" | "guest";
}) {
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  const { isSmDown } = useResponsive();
  const [qty, setQty] = useState(item.quantity);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setGuestQty = useGuestCartStore((s) => s.setQuantity);
  const removeGuest = useGuestCartStore((s) => s.remove);

  useEffect(() => {
    setQty(item.quantity);
  }, [item.quantity]);

  const update = useMutation({
    mutationFn: async (quantity: number) => {
      if (mode === "guest") {
        setGuestQty(item.bookId, quantity);
        return null;
      }
      const res = await api.patch(`/cart/items/${item.id}`, { quantity });
      return unwrap<CartView>(res);
    },
    onSuccess: () => {
      if (mode === "server") {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, "Cập nhật thất bại"));
      setQty(item.quantity);
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (mode === "guest") {
        removeGuest(item.bookId);
        return null;
      }
      const res = await api.delete(`/cart/items/${item.id}`);
      return unwrap<CartView>(res);
    },
    onSuccess: () => {
      if (mode === "server") {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
      message.success("Đã xoá sản phẩm");
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, "Xoá thất bại"));
    },
  });

  const scheduleUpdate = (next: number) => {
    setQty(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (next !== item.quantity) update.mutate(next);
    }, 400);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const unit =
    item.book.discountPrice && Number(item.book.discountPrice) > 0
      ? Number(item.book.discountPrice)
      : Number(item.book.price);
  const subtotal = unit * qty;

  // Below ~576px, switch to a stacked layout: cover + title on top, then
  // qty stepper + subtotal on a second row. The 4-column grid breaks under
  // ~360px otherwise.
  const stepper = (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid var(--color-divider)",
        borderRadius: 8,
      }}
    >
      <button
        type="button"
        disabled={update.isPending || qty <= 1}
        onClick={() => scheduleUpdate(Math.max(1, qty - 1))}
        style={stepperButtonStyle}
      >
        <MinusOutlined />
      </button>
      <span
        style={{
          minWidth: 36,
          textAlign: "center",
          fontWeight: 600,
          color: "var(--color-ink)",
          padding: "4px 0",
        }}
      >
        {qty}
      </span>
      <button
        type="button"
        disabled={
          update.isPending || qty >= Math.min(10, item.book.stockQuantity)
        }
        onClick={() =>
          scheduleUpdate(Math.min(10, item.book.stockQuantity, qty + 1))
        }
        style={stepperButtonStyle}
      >
        <PlusOutlined />
      </button>
    </div>
  );

  const subtotalBlock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        minWidth: isSmDown ? 0 : 110,
      }}
    >
      <span
        style={{
          fontWeight: 700,
          color: "var(--color-ink)",
          fontSize: 16,
        }}
      >
        {formatVnd(subtotal)}
      </span>
      <button
        type="button"
        onClick={() => remove.mutate()}
        disabled={remove.isPending}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-muted)",
          fontSize: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <DeleteOutlined /> Xoá
      </button>
    </div>
  );

  if (isSmDown) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "16px 0",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <BookCover
            src={item.book.primaryImage}
            alt={item.book.title}
            size="md"
            imgStyle={{ objectFit: "contain" }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link
              href={`/books/${item.book.slug}`}
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--color-ink)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.book.title}
            </Link>
            <div
              style={{
                color: "var(--color-muted)",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {formatVnd(unit)} / cuốn
            </div>
            {item.outOfStock ? (
              <Tag color="red" style={{ marginTop: 6 }}>
                Vượt tồn kho ({item.book.stockQuantity})
              </Tag>
            ) : null}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          {stepper}
          {subtotalBlock}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "72px 1fr auto auto",
        columnGap: 18,
        alignItems: "center",
        padding: "16px 0",
        borderBottom: "1px solid var(--color-divider)",
      }}
    >
      <BookCover
        src={item.book.primaryImage}
        alt={item.book.title}
        size="md"
        imgStyle={{ objectFit: "contain" }}
      />
      <div style={{ minWidth: 0 }}>
        <Link
          href={`/books/${item.book.slug}`}
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-ink)",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.book.title}
        </Link>
        <div
          style={{
            color: "var(--color-muted)",
            fontSize: 13,
            marginTop: 4,
          }}
        >
          {formatVnd(unit)} / cuốn
        </div>
        {item.outOfStock ? (
          <Tag color="red" style={{ marginTop: 6 }}>
            Vượt tồn kho ({item.book.stockQuantity})
          </Tag>
        ) : null}
      </div>
      {stepper}
      {subtotalBlock}
    </div>
  );
}

const stepperButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "var(--color-ink)",
};

/* --------------------------------------------------------------------------
 * Checkout inner
 * ------------------------------------------------------------------------ */
function CheckoutInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const isGuest = !accessToken;
  const guestItems = useGuestCartStore((s) => s.items);
  const guestHydrated = useGuestCartStore((s) => s.hydrated);
  const { isDesktop } = useResponsive();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [shippingOption, setShippingOption] = useState<"standard" | "express">(
    "standard",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentChoice>("COD");
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);

  // Voucher state. When `voucher` is set the summary row reflects the server-
  // validated discount amount; on order-create we pass `code`.
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherValidation | null>(null);

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses"],
    enabled: !isGuest,
    queryFn: async () => {
      const res = await api.get("/users/me/addresses");
      return unwrap<Address[]>(res);
    },
  });

  const { data: serverCart, isLoading: serverCartLoading } = useQuery({
    queryKey: ["cart"],
    enabled: !isGuest,
    queryFn: async () => {
      const res = await api.get("/cart");
      return unwrap<CartView>(res);
    },
  });

  const guestCart = useMemo(() => buildGuestCartView(guestItems), [guestItems]);
  const cart: CartView | undefined = isGuest ? guestCart : serverCart;
  const cartLoading = isGuest ? !guestHydrated : serverCartLoading;

  const effectiveAddressId = useMemo(() => {
    if (selectedAddressId) return selectedAddressId;
    if (!addresses || addresses.length === 0) return null;
    return addresses.find((a) => a.isDefault)?.id ?? addresses[0].id;
  }, [selectedAddressId, addresses]);

  const effectiveAddress = useMemo(
    () => addresses?.find((a) => a.id === effectiveAddressId) ?? null,
    [addresses, effectiveAddressId],
  );

  // If the cart subtotal changes while a voucher is applied (user edits
  // quantities), drop the voucher — the user must re-apply to re-validate.
  const cartSubtotal = cart?.subtotal ?? 0;
  useEffect(() => {
    if (
      voucher &&
      voucher.finalSubtotal !== cartSubtotal - voucher.discountAmount
    ) {
      // subtotal desynced; clear.
      setVoucher(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSubtotal]);

  const applyVoucher = useMutation({
    mutationFn: async () => {
      const code = voucherInput.trim().toUpperCase();
      if (!code) throw new Error("Vui lòng nhập mã voucher.");
      const res = await api.post("/vouchers/validate", {
        code,
        subtotal: cartSubtotal,
      });
      return unwrap<VoucherValidation>(res);
    },
    onSuccess: (data) => {
      setVoucher(data);
      setVoucherInput("");
      message.success(
        `Đã áp dụng voucher ${data.code} — giảm ${formatVnd(data.discountAmount)}`,
      );
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, "Mã voucher không hợp lệ"));
    },
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!effectiveAddressId) {
        throw new Error("Vui lòng chọn địa chỉ giao hàng.");
      }
      const payload: Record<string, unknown> = {
        addressId: effectiveAddressId,
        paymentMethod,
      };
      if (voucher?.code) payload.voucherCode = voucher.code;
      const res = await api.post("/orders", payload);
      return unwrap<OrderDetail & { paymentUrl?: string }>(res);
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // VNPAY flow — BE returns a relative sim URL. Redirect the browser so
      // the backend-rendered sim page takes over.
      if (paymentMethod === "VNPAY" && order.paymentUrl) {
        window.location.href = `${BACKEND_ORIGIN}${order.paymentUrl}`;
        return;
      }

      router.push(`/orders/${order.id}?placed=1`);
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, "Đặt hàng thất bại"));
    },
  });

  // Block on auth hydration so we don't flash the wrong (guest vs. server) UI.
  if (!authHydrated) {
    return (
      <div style={{ paddingBottom: 40 }}>
        <PageHeading
          eyebrow="Thanh toán"
          title="Giỏ hàng & Thanh toán"
          subtitle="Đang tải thông tin giỏ hàng..."
        />
      </div>
    );
  }

  if (cartLoading || (!isGuest && addressesLoading)) {
    return (
      <div style={{ paddingBottom: 40 }}>
        <PageHeading
          eyebrow="Thanh toán"
          title="Giỏ hàng & Thanh toán"
          subtitle="Đang tải thông tin giỏ hàng..."
        />
        <Row gutter={[28, 28]}>
          <Col xs={24} lg={15}>
            <section
              style={{
                background: "#fff",
                border: "1px solid var(--color-divider)",
                borderRadius: 16,
                padding: 28,
              }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <BookListRowSkeleton key={i} />
              ))}
            </section>
          </Col>
          <Col xs={24} lg={9}>
            <section
              style={{
                background: "#fff",
                border: "1px solid var(--color-divider)",
                borderRadius: 16,
                padding: 26,
                minHeight: 320,
              }}
            />
          </Col>
        </Row>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Giỏ hàng trống"
        description="Hãy khám phá những đầu sách đang được ưa thích nhất tại The Editorial."
        cta={
          <Link href="/books">
            <Button type="primary" size="large">
              Khám phá ngay
            </Button>
          </Link>
        }
      />
    );
  }

  const displayShipping =
    shippingOption === "express" ? 65000 : DISPLAY_SHIPPING_FEE;
  const discount = voucher?.discountAmount ?? 0;
  const total = Math.max(0, cart.subtotal + displayShipping - discount);

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeading
        eyebrow="Thanh toán"
        title="Giỏ hàng & Thanh toán"
        subtitle="Kiểm tra lại đơn hàng của bạn. Một cú nhấn là sách sẽ lên đường đến nhà."
      />

      <Row gutter={[28, 28]}>
        <Col xs={24} lg={15}>
          {/* STEP 1 — Cart items */}
          <StepCard step={1} icon={<SyncOutlined />} title="Danh mục đơn hàng">
            {cart.items.map((it) => (
              <CartItemLine
                key={it.id}
                item={it}
                mode={isGuest ? "guest" : "server"}
              />
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 18,
                fontSize: 15,
              }}
            >
              <span style={{ color: "var(--color-muted)" }}>
                Tạm tính ({cart.itemCount} cuốn)
              </span>
              <span style={{ fontWeight: 700, color: "var(--color-ink)" }}>
                {formatVnd(cart.subtotal)}
              </span>
            </div>
          </StepCard>

          {/* Guest sign-in banner (replaces address/shipping/payment until login) */}
          {isGuest ? (
            <section
              style={{
                background: "#fff",
                border: "1px solid var(--color-divider)",
                borderRadius: 16,
                padding: 28,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 240 }}>
                <div
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--color-ink)",
                    marginBottom: 6,
                  }}
                >
                  Đăng nhập để hoàn tất đơn hàng
                </div>
                <div style={{ color: "var(--color-muted)", fontSize: 14 }}>
                  Giỏ hàng của bạn đã được giữ lại. Đăng nhập để chọn địa chỉ,
                  áp dụng mã giảm giá và thanh toán.
                </div>
              </div>
              <Space size={8}>
                <Button
                  onClick={() => router.push("/register?redirect=/checkout")}
                >
                  Đăng ký
                </Button>
                <Button
                  type="primary"
                  onClick={() => router.push("/login?redirect=/checkout")}
                >
                  Đăng nhập
                </Button>
              </Space>
            </section>
          ) : null}

          {/* STEP 2 — Address */}
          {!isGuest ? (
            <StepCard
              step={2}
              icon={<EnvironmentOutlined />}
              title="Địa chỉ giao hàng"
              trailing={
                addresses && addresses.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setAddressPickerOpen(true)}
                    style={linkBtn}
                  >
                    Thay đổi
                  </button>
                ) : null
              }
            >
              {effectiveAddress ? (
                <div
                  style={{
                    background: "var(--color-soft)",
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <strong style={{ color: "var(--color-ink)", fontSize: 15 }}>
                      {effectiveAddress.recipientName}
                    </strong>
                    <span style={{ color: "var(--color-muted)" }}>
                      {effectiveAddress.phone}
                    </span>
                    {effectiveAddress.isDefault ? (
                      <Tag color="green">Mặc định</Tag>
                    ) : null}
                  </div>
                  <div style={{ color: "var(--color-text)", fontSize: 14 }}>
                    {effectiveAddress.streetAddress}, {effectiveAddress.ward},{" "}
                    {effectiveAddress.district}, {effectiveAddress.province}
                  </div>
                </div>
              ) : (
                <Empty description="Chưa có địa chỉ nào">
                  <Button
                    type="primary"
                    onClick={() => setAddressModalOpen(true)}
                  >
                    Thêm địa chỉ
                  </Button>
                </Empty>
              )}
              {addresses && addresses.length > 0 ? (
                <Button
                  type="link"
                  style={{ padding: 0, marginTop: 10 }}
                  onClick={() => setAddressModalOpen(true)}
                >
                  + Thêm địa chỉ mới
                </Button>
              ) : null}
            </StepCard>
          ) : null}

          {/* STEP 3 — Shipping */}
          <StepCard
            step={isGuest ? 2 : 3}
            icon={<CarOutlined />}
            title="Vận chuyển"
          >
            <Radio.Group
              value={shippingOption}
              onChange={(e) => setShippingOption(e.target.value)}
              style={{ width: "100%" }}
            >
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                <RadioCard
                  active={shippingOption === "standard"}
                  value="standard"
                  title="Giao hàng nhanh"
                  description="Nhận trong 2–3 ngày làm việc"
                  right={formatVnd(DISPLAY_SHIPPING_FEE)}
                />
                <RadioCard
                  active={shippingOption === "express"}
                  value="express"
                  title="Hoả tốc"
                  description="Giao trong 2–4 giờ (nội thành)"
                  right={formatVnd(65000)}
                />
              </Space>
            </Radio.Group>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                marginTop: 10,
              }}
            >
              *Lưu ý: hệ thống tự áp dụng gói tiêu chuẩn cho đơn COD ở giai đoạn
              này.
            </div>
          </StepCard>

          {/* STEP 4 — Payment */}
          {!isGuest ? (
            <StepCard
              step={isGuest ? 3 : 4}
              icon={<CreditCardOutlined />}
              title="Phương thức thanh toán"
            >
              <Radio.Group
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentChoice)
                }
                style={{ width: "100%" }}
              >
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={8}>
                    <PaymentRadioCard
                      active={paymentMethod === "VNPAY"}
                      value="VNPAY"
                      title="VNPay"
                      description="Thanh toán online (mô phỏng)"
                    />
                  </Col>
                  <Col xs={24} sm={8}>
                    <PaymentRadioCard
                      active={false}
                      value="MOMO"
                      disabled
                      title="MoMo"
                      badge="Sẽ ra mắt"
                    />
                  </Col>
                  <Col xs={24} sm={8}>
                    <PaymentRadioCard
                      active={paymentMethod === "COD"}
                      value="COD"
                      title="COD"
                      description="Thanh toán khi nhận hàng"
                    />
                  </Col>
                </Row>
              </Radio.Group>
            </StepCard>
          ) : null}
        </Col>

        {/* SUMMARY */}
        <Col xs={24} lg={9}>
          {/* Only sticky on desktop; on tablet/phone the summary lives below
              the form as a natural-flow section. */}
          <div style={isDesktop ? { position: "sticky", top: 96 } : undefined}>
            <section
              style={{
                background: "#fff",
                border: "1px solid var(--color-divider)",
                borderRadius: 16,
                padding: 26,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--color-ink)",
                  margin: 0,
                  marginBottom: 18,
                }}
              >
                Tóm tắt đơn hàng
              </h3>

              <SummaryRow label="Tạm tính" value={formatVnd(cart.subtotal)} />
              <SummaryRow
                label="Phí vận chuyển"
                value={formatVnd(displayShipping)}
              />
              {!isGuest ? (
                <SummaryRow
                  label="Giảm giá voucher"
                  value={
                    discount > 0 ? `-${formatVnd(discount)}` : formatVnd(0)
                  }
                  muted={discount === 0}
                />
              ) : null}

              {/* Voucher input / applied pill */}
              {isGuest ? null : voucher ? (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 14,
                    marginBottom: 18,
                    alignItems: "center",
                  }}
                >
                  <Tag
                    color="red"
                    style={{
                      padding: "4px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {voucher.code}
                    <CloseCircleFilled
                      onClick={() => setVoucher(null)}
                      style={{ cursor: "pointer", fontSize: 14 }}
                      aria-label="Bỏ voucher"
                    />
                  </Tag>
                  <span
                    style={{
                      color: "var(--color-success, #12A150)",
                      fontSize: 13,
                    }}
                  >
                    Đã áp dụng
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 14,
                    marginBottom: 18,
                  }}
                >
                  <Input
                    placeholder="Mã voucher"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    onPressEnter={() => applyVoucher.mutate()}
                    maxLength={40}
                    style={{ textTransform: "uppercase" }}
                  />
                  <Button
                    onClick={() => applyVoucher.mutate()}
                    loading={applyVoucher.isPending}
                    disabled={!voucherInput.trim()}
                  >
                    Áp dụng
                  </Button>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  padding: "16px 0",
                  borderTop: "1px solid var(--color-divider)",
                  borderBottom: "1px solid var(--color-divider)",
                  marginBottom: 20,
                }}
              >
                <span style={{ color: "var(--color-ink)", fontWeight: 600 }}>
                  Tổng cộng
                </span>
                <span
                  style={{
                    color: "var(--color-primary)",
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontWeight: 700,
                    fontSize: 26,
                  }}
                >
                  {formatVnd(total)}
                </span>
              </div>

              <Button
                type="primary"
                size="large"
                block
                style={{
                  height: 52,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
                loading={!isGuest && placeOrder.isPending}
                disabled={!isGuest && !effectiveAddressId}
                onClick={() => {
                  if (isGuest) {
                    router.push("/login?redirect=/checkout");
                    return;
                  }
                  placeOrder.mutate();
                }}
              >
                {isGuest
                  ? "Thanh toán"
                  : paymentMethod === "VNPAY"
                    ? "Thanh toán VNPay"
                    : "Đặt hàng ngay"}
              </Button>

              {/* Trust badges */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginTop: 22,
                  textAlign: "center",
                  color: "var(--color-muted)",
                  fontSize: 11,
                }}
              >
                <TrustBadge
                  icon={<SafetyOutlined />}
                  label="Bảo mật thanh toán"
                />
                <TrustBadge
                  icon={<FileProtectOutlined />}
                  label="Bản quyền 100%"
                />
                <TrustBadge icon={<SyncOutlined />} label="Đổi trả 7 ngày" />
              </div>
            </section>
          </div>
        </Col>
      </Row>

      {!isGuest ? (
        <>
          <AddressModal
            open={addressModalOpen}
            onClose={() => setAddressModalOpen(false)}
          />
          <AddressPickerModal
            open={addressPickerOpen}
            onClose={() => setAddressPickerOpen(false)}
            addresses={addresses ?? []}
            selectedId={effectiveAddressId}
            onSelect={(id) => {
              setSelectedAddressId(id);
              setAddressPickerOpen(false);
            }}
          />
        </>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Small presentational helpers
 * ------------------------------------------------------------------------ */
function SummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        fontSize: 14,
        color: muted ? "var(--color-muted)" : "var(--color-text)",
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: muted ? 400 : 600 }}>{value}</span>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "8px 4px",
      }}
    >
      <span style={{ color: "var(--color-primary)", fontSize: 18 }}>
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--color-primary)",
  fontSize: 13,
  fontWeight: 600,
};

function RadioCard({
  value,
  active,
  title,
  description,
  right,
}: {
  value: string;
  active: boolean;
  title: string;
  description: string;
  right: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: 18,
        borderRadius: 12,
        border: `1px solid ${active ? "var(--color-primary)" : "var(--color-divider)"}`,
        background: active ? "rgba(200, 16, 46, 0.04)" : "#fff",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <Radio value={value} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: "var(--color-ink)" }}>
          {title}
        </div>
        <div style={{ color: "var(--color-muted)", fontSize: 13 }}>
          {description}
        </div>
      </div>
      <div
        style={{
          color: "var(--color-primary)",
          fontWeight: 700,
        }}
      >
        {right}
      </div>
    </label>
  );
}

function PaymentRadioCard({
  value,
  active,
  disabled,
  title,
  description,
  badge,
}: {
  value: string;
  active: boolean;
  disabled?: boolean;
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <Tooltip title={disabled ? "Sẽ ra mắt (phase 2)" : ""}>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: 16,
          borderRadius: 12,
          border: `1px solid ${active ? "var(--color-primary)" : "var(--color-divider)"}`,
          background: active ? "rgba(200, 16, 46, 0.04)" : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.7 : 1,
          height: "100%",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Radio value={value} disabled={disabled}>
            <span style={{ fontWeight: 700 }}>{title}</span>
          </Radio>
          {active && !disabled ? (
            <CheckOutlined style={{ color: "var(--color-primary)" }} />
          ) : null}
        </div>
        {description ? (
          <div
            style={{
              color: "var(--color-muted)",
              fontSize: 12,
              paddingLeft: 24,
            }}
          >
            {description}
          </div>
        ) : null}
        {badge ? (
          <Tag
            color="default"
            style={{ marginTop: 4, alignSelf: "flex-start" }}
          >
            {badge}
          </Tag>
        ) : null}
      </label>
    </Tooltip>
  );
}

function AddressPickerModal({
  open,
  onClose,
  addresses,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal
      title="Chọn địa chỉ giao hàng"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {addresses.map((a) => (
          <div
            key={a.id}
            style={{
              padding: 14,
              borderRadius: 12,
              border: `1px solid ${selectedId === a.id ? "var(--color-primary)" : "var(--color-divider)"}`,
              cursor: "pointer",
            }}
            onClick={() => onSelect(a.id)}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Text strong>{a.recipientName}</Text>
              <Text type="secondary">{a.phone}</Text>
              {a.isDefault ? <Tag color="green">Mặc định</Tag> : null}
            </div>
            <div>
              {a.streetAddress}, {a.ward}, {a.district}, {a.province}
            </div>
          </div>
        ))}
      </Space>
    </Modal>
  );
}

export default function CheckoutPage() {
  return <CheckoutInner />;
}
