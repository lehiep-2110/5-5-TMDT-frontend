'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Descriptions,
  Popconfirm,
  Row,
  Skeleton,
  Space,
  Steps,
  Table,
  Typography,
} from 'antd';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
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
import type { OrderDetail, OrderItemView } from '@/lib/types';

const { Text, Paragraph } = Typography;

function OrderDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const searchParams = useSearchParams();
  const placed = searchParams.get('placed') === '1';
  const { message, modal } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const modalShownRef = useRef(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`);
      return unwrap<OrderDetail>(res);
    },
  });

  useEffect(() => {
    if (placed && order && !modalShownRef.current) {
      modalShownRef.current = true;
      modal.success({
        title: 'Đặt hàng thành công',
        content: `Mã đơn: ${order.orderCode}`,
      });
    }
  }, [placed, order, modal]);

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
        <Col xs={24} md={16}>
          <Card title="Sản phẩm">
            <Table<OrderItemView>
              rowKey="id"
              dataSource={order.items}
              pagination={false}
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
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
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
