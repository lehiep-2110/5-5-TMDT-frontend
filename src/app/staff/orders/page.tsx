'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Checkbox,
  Tag,
  Typography,
} from 'antd';
import {
  InboxOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useEffect, useMemo, useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import type { OrderDetail, OrderStatus, PageEnvelope } from '@/lib/types';
import { EmptyState, PageHeading } from '@/components/editorial';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

interface StaffOrderRow {
  id: string;
  orderCode: string;
  status: OrderStatus;
  totalAmount: string;
  itemCount: number;
  createdAt: string;
  userEmail: string | null;
  userFullName: string | null;
}

export default function StaffOrdersPage() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const listQ = useQuery({
    queryKey: ['staff-orders', 'CONFIRMED'],
    queryFn: async () => {
      const res = await api.get('/staff/orders', {
        params: { status: 'CONFIRMED', page: 1, limit: 50 },
      });
      return unwrap<PageEnvelope<StaffOrderRow>>(res);
    },
  });

  const items = useMemo(() => {
    const list = listQ.data?.items ?? [];
    // FIFO ordering by created_at ASC
    return [...list].sort(
      (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    );
  }, [listQ.data?.items]);

  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id);
    }
    if (selectedId && !items.some((i) => i.id === selectedId)) {
      setSelectedId(items[0]?.id ?? null);
    }
  }, [items, selectedId]);

  const detailQ = useQuery({
    queryKey: ['staff-order-detail', selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const res = await api.get(`/staff/orders/${selectedId}`);
      return unwrap<OrderDetail>(res);
    },
  });

  const detail = detailQ.data;

  useEffect(() => {
    // Reset checkbox state when selected order changes.
    setChecked({});
  }, [selectedId]);

  const packMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post(`/staff/orders/${orderId}/pack`);
      return unwrap(res);
    },
    onSuccess: () => {
      message.success('Đã chuyển sang PROCESSING');
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
    },
    onError: (err) =>
      message.error(extractErrorMessage(err, 'Thao tác thất bại')),
  });

  const totalItems = detail?.items.length ?? 0;
  const doneItems = detail?.items.filter((it) => checked[it.id]).length ?? 0;

  return (
    <div>
      <PageHeading
        title="Quản lý đơn hàng đóng gói"
        subtitle="Theo dõi và xác nhận các đơn đã thanh toán, sẵn sàng để đóng gói và bàn giao vận chuyển."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 2fr) minmax(420px, 3fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* LEFT: order list */}
        <section
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid var(--color-divider)',
            boxShadow: '0 1px 2px rgba(26,26,26,0.04)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-serif), Georgia, serif',
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--color-ink)',
                  lineHeight: 1.2,
                }}
              >
                Đơn hàng cần đóng gói
              </div>
              <Text
                style={{
                  fontSize: 12,
                  color: 'var(--color-muted)',
                  letterSpacing: '0.06em',
                }}
              >
                {items.length} ĐƠN TRONG HÀNG CHỜ
              </Text>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(200,16,46,0.08)',
                color: 'var(--color-primary)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                padding: '5px 10px',
                borderRadius: 999,
              }}
            >
              <ThunderboltOutlined />
              ƯU TIÊN FIFO
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxHeight: 'calc(100vh - 280px)',
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {listQ.isLoading ? (
              <Text style={{ color: 'var(--color-muted)', fontSize: 13 }}>
                Đang tải...
              </Text>
            ) : items.length === 0 ? (
              <EmptyState
                icon={<InboxOutlined />}
                title="Không có đơn nào cần đóng gói"
                description="Tất cả đơn đã được xử lý. Quay lại sau nhé!"
              />
            ) : (
              items.map((row, index) => {
                const isSelected = row.id === selectedId;
                const rushLabel = index === 0 ? 'Giao hoả tốc' : 'Tiêu chuẩn';
                const isRush = index === 0;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      background: isSelected
                        ? 'rgba(200,16,46,0.035)'
                        : '#fff',
                      border: `1px solid ${
                        isSelected ? 'rgba(200,16,46,0.3)' : 'var(--color-divider)'
                      }`,
                      borderLeft: isSelected
                        ? '3px solid var(--color-primary)'
                        : '3px solid transparent',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--color-primary)',
                          fontWeight: 700,
                          fontSize: 14,
                          letterSpacing: '0.01em',
                        }}
                      >
                        #{row.orderCode}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--color-muted)',
                          fontWeight: 500,
                        }}
                      >
                        {dayjs(row.createdAt).fromNow(true).toUpperCase()} TRƯỚC
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          color: 'var(--color-ink)',
                          fontWeight: 500,
                        }}
                      >
                        {row.userFullName ?? row.userEmail ?? 'Khách lẻ'}
                      </span>
                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 999,
                          fontSize: 11,
                          padding: '1px 10px',
                          background: isRush
                            ? 'rgba(200,16,46,0.08)'
                            : 'var(--color-soft)',
                          color: isRush
                            ? 'var(--color-primary)'
                            : 'var(--color-text)',
                          border: `1px solid ${
                            isRush ? 'rgba(200,16,46,0.2)' : 'var(--color-divider)'
                          }`,
                        }}
                      >
                        {rushLabel}
                      </Tag>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{ fontSize: 12, color: 'var(--color-muted)' }}
                      >
                        {row.itemCount} Sản phẩm
                      </Text>
                      {isSelected ? (
                        <Text
                          style={{
                            fontSize: 11,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                          }}
                        >
                          Đang chọn
                        </Text>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT: detail panel */}
        <section
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid var(--color-divider)',
            boxShadow: '0 1px 2px rgba(26,26,26,0.04)',
            padding: 24,
            minHeight: 480,
          }}
        >
          {!detail || !selectedId ? (
            <EmptyState
              icon={<InboxOutlined />}
              title="Chọn một đơn hàng để bắt đầu"
              description="Danh sách bên trái được sắp xếp theo FIFO. Chọn đơn để xem chi tiết và xác nhận đóng gói."
            />
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingBottom: 14,
                  borderBottom: '1px solid var(--color-divider)',
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif), Georgia, serif',
                      fontSize: 22,
                      fontWeight: 700,
                      color: 'var(--color-ink)',
                    }}
                  >
                    Chi tiết đóng gói
                  </div>
                  <Text
                    style={{
                      fontSize: 13,
                      color: 'var(--color-muted)',
                    }}
                  >
                    #{detail.orderCode}
                  </Text>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                    fontWeight: 500,
                  }}
                >
                  {dayjs(detail.createdAt).fromNow(true).toUpperCase()} TRƯỚC
                </span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  KHÁCH HÀNG
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: 'var(--color-ink)',
                    fontWeight: 600,
                  }}
                >
                  {detail.addressSnapshot?.recipientName ??
                    detail.user?.fullName ??
                    'Khách lẻ'}
                </div>
                <Text
                  style={{
                    fontSize: 13,
                    color: 'var(--color-muted)',
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  Vui lòng kiểm tra kỹ số lượng và tình trạng sách trước khi dán
                  tem vận chuyển.
                </Text>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                {detail.items.map((it) => {
                  const isChecked = !!checked[it.id];
                  return (
                    <div
                      key={it.id}
                      style={{
                        display: 'flex',
                        gap: 14,
                        padding: 12,
                        border: '1px solid var(--color-divider)',
                        borderRadius: 10,
                        background: isChecked
                          ? 'rgba(47,133,90,0.03)'
                          : 'var(--color-soft)',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 80,
                          borderRadius: 6,
                          overflow: 'hidden',
                          background: '#fff',
                          border: '1px solid var(--color-divider)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {it.book?.primaryImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={it.book.primaryImage}
                            alt={it.bookTitleSnapshot}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <InboxOutlined
                            style={{
                              fontSize: 24,
                              color: 'var(--color-muted)',
                            }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-serif), Georgia, serif',
                            fontWeight: 700,
                            fontSize: 15,
                            color: 'var(--color-ink)',
                            lineHeight: 1.3,
                            marginBottom: 4,
                          }}
                        >
                          {it.bookTitleSnapshot}
                        </div>
                        <Text
                          style={{
                            display: 'block',
                            fontSize: 12,
                            color: 'var(--color-muted)',
                          }}
                        >
                          ISBN: {it.book?.id?.slice(0, 8) ?? '—'}
                        </Text>
                        <Text
                          style={{
                            display: 'block',
                            fontSize: 12,
                            color: 'var(--color-muted)',
                          }}
                        >
                          {/* Shelf code is mocked/static for MVP */}
                          Kệ: A05 – Tầng 1
                        </Text>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <Tag
                          style={{
                            margin: 0,
                            background: 'var(--color-primary)',
                            color: '#fff',
                            border: 0,
                            fontWeight: 600,
                            fontSize: 12,
                            borderRadius: 6,
                            padding: '2px 10px',
                          }}
                        >
                          SL: {String(it.quantity).padStart(2, '0')}
                        </Tag>
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) =>
                            setChecked((prev) => ({
                              ...prev,
                              [it.id]: e.target.checked,
                            }))
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  paddingTop: 14,
                  borderTop: '1px solid var(--color-divider)',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--color-muted)',
                      fontWeight: 600,
                    }}
                  >
                    TIẾN ĐỘ
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-serif), Georgia, serif',
                      fontSize: 18,
                      color: 'var(--color-ink)',
                      fontWeight: 700,
                    }}
                  >
                    {doneItems}/{totalItems} Mặt hàng
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--color-muted)',
                      fontWeight: 600,
                    }}
                  >
                    VẬT LIỆU
                  </span>
                  {/* Packing material is mocked for MVP. */}
                  <Tag
                    style={{
                      marginTop: 4,
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--color-ink)',
                      background: 'var(--color-soft)',
                      border: '1px solid var(--color-divider)',
                    }}
                  >
                    Thùng Carton M
                  </Tag>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <button
                    type="button"
                    onClick={() =>
                      message.info('Vui lòng liên hệ Admin')
                    }
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: 'var(--color-primary)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <WarningOutlined />
                    Báo lỗi đóng gói
                  </button>
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                block
                style={{
                  marginTop: 16,
                  height: 48,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  borderRadius: 10,
                }}
                loading={packMutation.isPending}
                onClick={() => packMutation.mutate(detail.id)}
              >
                Xác nhận đóng gói xong
              </Button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
