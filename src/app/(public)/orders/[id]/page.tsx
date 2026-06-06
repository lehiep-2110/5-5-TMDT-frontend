'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Rate,
  Row,
  Skeleton,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
} from 'antd';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { AuthGuard } from '@/components/layout/auth-guard';
import {
  OrderStatusTag,
  PaymentStatusTag,
  orderStatusLabel,
} from '@/components/status-tag';
import { BookCover } from '@/components/book-cover';
import { formatVnd } from '@/lib/format';
import { PageHeading } from '@/components/editorial';
import { useResponsive } from '@/lib/use-responsive';
import type { OrderDetail, OrderItemView } from '@/lib/types';

const { Text, Paragraph } = Typography;

interface ReviewFormValues {
  stars: number;
  title?: string;
  content?: string;
}

function ReviewModal({
  open,
  onClose,
  orderItem,
}: {
  open: boolean;
  onClose: () => void;
  orderItem: OrderItemView | null;
}) {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ReviewFormValues>();

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const submit = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      if (!orderItem) throw new Error('Thiếu thông tin đơn hàng.');
      const res = await api.post('/reviews', {
        orderItemId: orderItem.id,
        stars: values.stars,
        title: values.title?.trim() || undefined,
        content: values.content?.trim() || undefined,
      });
      return unwrap<unknown>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      if (orderItem?.book?.slug) {
        queryClient.invalidateQueries({
          queryKey: ['book-reviews', orderItem.book.slug],
        });
        queryClient.invalidateQueries({
          queryKey: ['book-detail', orderItem.book.slug],
        });
      }
      message.success('Cảm ơn bạn đã đánh giá!');
      onClose();
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Gửi đánh giá thất bại'));
    },
  });

  return (
    <Modal
      title={`Đánh giá: ${orderItem?.bookTitleSnapshot ?? ''}`}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submit.isPending}
      okText="Gửi đánh giá"
      cancelText="Huỷ"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ stars: 5 }}
        onFinish={(v) => submit.mutate(v)}
        preserve={false}
      >
        <Form.Item
          name="stars"
          label="Số sao"
          rules={[
            { required: true, message: 'Vui lòng chọn số sao' },
            {
              validator: (_, value) =>
                value >= 1 && value <= 5
                  ? Promise.resolve()
                  : Promise.reject(new Error('Từ 1 đến 5 sao')),
            },
          ]}
        >
          <Rate />
        </Form.Item>
        <Form.Item
          name="title"
          label="Tiêu đề (tuỳ chọn)"
          rules={[{ max: 100, message: 'Tối đa 100 ký tự' }]}
        >
          <Input placeholder="Vd: Sách hay, đóng gói kỹ" maxLength={100} />
        </Form.Item>
        <Form.Item
          name="content"
          label="Nội dung (tuỳ chọn)"
          rules={[{ max: 1000, message: 'Tối đa 1000 ký tự' }]}
        >
          <Input.TextArea
            placeholder="Chia sẻ cảm nhận của bạn..."
            rows={4}
            maxLength={1000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function OrderDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const searchParams = useSearchParams();
  const placed = searchParams.get('placed') === '1';
  const paid = searchParams.get('paid') === '1';
  const cancelled = searchParams.get('cancelled') === '1';
  const { message, modal } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const modalShownRef = useRef(false);
  const [reviewItem, setReviewItem] = useState<OrderItemView | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const { isMobile } = useResponsive();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`);
      return unwrap<OrderDetail>(res);
    },
  });

  useEffect(() => {
    if (!order || modalShownRef.current) return;
    if (placed) {
      modalShownRef.current = true;
      modal.success({
        title: 'Đặt hàng thành công',
        content: `Mã đơn: ${order.orderCode}`,
      });
    } else if (paid) {
      modalShownRef.current = true;
      modal.success({
        title: 'Thanh toán thành công',
        content: `Đơn ${order.orderCode} đã được thanh toán qua VNPAY.`,
      });
    } else if (cancelled) {
      modalShownRef.current = true;
      modal.warning({
        title: 'Bạn đã huỷ thanh toán',
        content: `Đơn ${order.orderCode} chưa được thanh toán. Bạn có thể thử lại hoặc huỷ đơn.`,
      });
    }
  }, [placed, paid, cancelled, order, modal]);

  const cancel = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/orders/${id}/cancel`, {});
      return unwrap<OrderDetail>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      message.success('Đã huỷ đơn hàng');
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Huỷ đơn thất bại'));
    },
  });

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (!order) {
    return <Card>Không tìm thấy đơn hàng.</Card>;
  }

  const steps = order.statusLogs.map((log) => ({
    title: orderStatusLabel(log.toStatus as never),
    description: (
      <Space direction="vertical" size={0}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(log.createdAt).format('DD/MM/YYYY HH:mm')}
        </Text>
        {log.note ? (
          <Text style={{ fontSize: 12 }}>{log.note}</Text>
        ) : null}
      </Space>
    ),
  }));

  const canCancel =
    order.status === 'PENDING' || order.status === 'CONFIRMED';
  const canReview =
    order.status === 'DELIVERED' || order.status === 'COMPLETED';
  const address = order.addressSnapshot;

  return (
    <div>
      <PageHeading
        eyebrow="Chi tiết đơn hàng"
        title={`Đơn hàng ${order.orderCode}`}
        subtitle={`Đặt lúc ${dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}`}
        trailing={
          <Space>
            <OrderStatusTag status={order.status} />
            <PaymentStatusTag status={order.paymentStatus} />
          </Space>
        }
      />

      <Card title="Tiến trình đơn hàng" style={{ borderRadius: 16 }}>
        <Steps
          direction="vertical"
          size="small"
          current={steps.length - 1}
          items={
            steps.length > 0
              ? steps
              : [{ title: orderStatusLabel(order.status) }]
          }
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Sản phẩm">
            {isMobile ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {order.items.map((it) => (
                  <OrderItemRow
                    key={it.id}
                    item={it}
                    canReview={canReview}
                    onReview={() => {
                      setReviewItem(it);
                      setReviewOpen(true);
                    }}
                  />
                ))}
              </Space>
            ) : (
              <Table<OrderItemView>
                rowKey="id"
                dataSource={order.items}
                pagination={false}
                scroll={{ x: 640 }}
                columns={[
                  {
                    title: 'Sách',
                    key: 'book',
                    render: (_: unknown, it) => (
                      <Space>
                        <BookCover
                          src={it.book?.primaryImage}
                          alt={it.book?.title ?? ''}
                          width={48}
                          height={64}
                          borderRadius={4}
                          style={{ background: '#fafafa' }}
                          imgStyle={{ objectFit: 'contain' }}
                        />
                        {it.book ? (
                          <Link href={`/books/${it.book.slug}`}>
                            {it.bookTitleSnapshot}
                          </Link>
                        ) : (
                          <Text>{it.bookTitleSnapshot}</Text>
                        )}
                      </Space>
                    ),
                  },
                  {
                    title: 'Đơn giá',
                    dataIndex: 'priceAtTime',
                    align: 'right',
                    render: (v: string) => formatVnd(v),
                  },
                  {
                    title: 'SL',
                    dataIndex: 'quantity',
                    align: 'center',
                  },
                  {
                    title: 'Thành tiền',
                    key: 'subtotal',
                    align: 'right',
                    render: (_: unknown, it) =>
                      formatVnd(Number(it.priceAtTime) * it.quantity),
                  },
                  {
                    title: 'Đánh giá',
                    key: 'review',
                    align: 'center',
                    render: (_: unknown, it) => {
                      if (!canReview) {
                        return (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            —
                          </Text>
                        );
                      }
                      if (it.isReviewed) {
                        return (
                          <Space size={4} direction="vertical">
                            <Tag color="green">Đã đánh giá</Tag>
                            {it.book ? (
                              <Link
                                href={`/books/${it.book.slug}?tab=reviews`}
                                style={{ fontSize: 12 }}
                              >
                                Xem
                              </Link>
                            ) : null}
                          </Space>
                        );
                      }
                      return (
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          onClick={() => {
                            setReviewItem(it);
                            setReviewOpen(true);
                          }}
                        >
                          Viết đánh giá
                        </Button>
                      );
                    },
                  },
                ]}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Địa chỉ giao hàng">
            {address ? (
              <Space direction="vertical" size={4}>
                <Text strong>{address.recipientName}</Text>
                <Text>{address.phone}</Text>
                <Text>
                  {address.streetAddress}, {address.ward}, {address.district},{' '}
                  {address.province}
                </Text>
              </Space>
            ) : (
              <Text type="secondary">Không có thông tin.</Text>
            )}
          </Card>
          <Card title="Thanh toán & vận chuyển" style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Thanh toán">
                {order.paymentMethod}
              </Descriptions.Item>
              <Descriptions.Item label="Vận chuyển">
                {order.shippingMethod ?? 'Tiêu chuẩn'}
              </Descriptions.Item>
              <Descriptions.Item label="Tạm tính">
                {formatVnd(order.subtotal)}
              </Descriptions.Item>
              <Descriptions.Item label="Phí ship">
                {formatVnd(order.shippingFee)}
              </Descriptions.Item>
              <Descriptions.Item label="Giảm giá">
                -{formatVnd(order.discountAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng cộng">
                <Text strong style={{ color: '#ff4d4f' }}>
                  {formatVnd(order.totalAmount)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            {order.note ? (
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                Ghi chú: {order.note}
              </Paragraph>
            ) : null}
            {canCancel ? (
              <Popconfirm
                title="Huỷ đơn hàng này?"
                okText="Huỷ đơn"
                cancelText="Không"
                onConfirm={() => cancel.mutate()}
              >
                <Button
                  danger
                  block
                  style={{ marginTop: 12 }}
                  loading={cancel.isPending}
                >
                  Huỷ đơn hàng
                </Button>
              </Popconfirm>
            ) : null}
          </Card>
        </Col>
      </Row>

      <ReviewModal
        open={reviewOpen}
        orderItem={reviewItem}
        onClose={() => {
          setReviewOpen(false);
          setReviewItem(null);
        }}
      />
    </div>
  );
}

/* Mobile-friendly stacked item row used in place of the items Table. */
function OrderItemRow({
  item,
  canReview,
  onReview,
}: {
  item: OrderItemView;
  canReview: boolean;
  onReview: () => void;
}) {
  const subtotal = Number(item.priceAtTime) * item.quantity;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        paddingBottom: 12,
        borderBottom: '1px solid var(--color-divider)',
      }}
    >
      <BookCover
        src={item.book?.primaryImage}
        alt={item.book?.title ?? ''}
        width={56}
        height={76}
        borderRadius={4}
        style={{ background: '#fafafa' }}
        imgStyle={{ objectFit: 'contain' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.book ? (
          <Link
            href={`/books/${item.book.slug}`}
            style={{ fontWeight: 600, color: 'var(--color-ink)' }}
          >
            {item.bookTitleSnapshot}
          </Link>
        ) : (
          <Text strong>{item.bookTitleSnapshot}</Text>
        )}
        <div
          style={{
            color: 'var(--color-muted)',
            fontSize: 13,
            marginTop: 4,
          }}
        >
          {formatVnd(item.priceAtTime)} × {item.quantity}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ color: 'var(--color-ink)' }}>
            {formatVnd(subtotal)}
          </strong>
          {canReview ? (
            item.isReviewed ? (
              <Tag color="green">Đã đánh giá</Tag>
            ) : (
              <Button size="small" type="primary" ghost onClick={onReview}>
                Viết đánh giá
              </Button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <AuthGuard role="CUSTOMER">
      <Suspense fallback={<Skeleton active paragraph={{ rows: 10 }} />}>
        <OrderDetailInner />
      </Suspense>
    </AuthGuard>
  );
}
