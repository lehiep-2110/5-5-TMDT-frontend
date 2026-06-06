'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  DatePicker,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Skeleton,
  Tag,
} from 'antd';
import {
  CalendarOutlined,
  MoreOutlined,
  PercentageOutlined,
  PlusOutlined,
  SearchOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import { PageHeading } from '@/components/editorial';
import { useResponsive } from '@/lib/use-responsive';

const { RangePicker } = DatePicker;

interface VoucherItem {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string;
  maxDiscount: string | null;
  minOrderAmount: string;
  totalQuantity: number;
  usedQuantity: number;
  perUserLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  scopeType: string;
  createdAt: string;
  isActiveNow: boolean;
  isExpired: boolean;
  isScheduled: boolean;
  progress: number;
  remaining: number;
}

interface VoucherUsage {
  id: string;
  userId: string;
  userEmail: string | null;
  orderId: string;
  orderCode: string | null;
  discountAmount: string;
  usedAt: string;
}

interface VoucherDetail extends VoucherItem {
  recentUsages: VoucherUsage[];
}

interface VoucherListResp {
  items: VoucherItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type StatusFilter = 'all' | 'active' | 'scheduled' | 'expired';

interface VoucherFormValues {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
  totalQuantity: number;
  perUserLimit?: number | null;
  range: [Dayjs, Dayjs];
  scopeType?: string;
}

function cardStyle(): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid var(--color-divider)',
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(26,26,26,0.03)',
  };
}

function describeVoucher(v: VoucherItem): string {
  const value = Number(v.value);
  if (v.type === 'PERCENTAGE') {
    const cap = v.maxDiscount ? ` (tối đa ${formatVnd(v.maxDiscount)})` : '';
    const min = Number(v.minOrderAmount) > 0
      ? ` cho đơn từ ${formatVnd(v.minOrderAmount)}`
      : '';
    return `Giảm ${value}%${cap}${min}`;
  }
  const min = Number(v.minOrderAmount) > 0
    ? ` cho đơn từ ${formatVnd(v.minOrderAmount)}`
    : '';
  return `Giảm ${formatVnd(v.value)}${min}`;
}

function statusTag(v: VoucherItem): { label: string; bg: string; fg: string } {
  if (!v.isActive) {
    return {
      label: 'Tạm dừng',
      bg: 'rgba(26,26,26,0.08)',
      fg: 'var(--color-muted)',
    };
  }
  if (v.isExpired) {
    return {
      label: 'Đã hết hạn',
      bg: 'rgba(200,16,46,0.1)',
      fg: 'var(--color-primary)',
    };
  }
  if (v.isScheduled) {
    return {
      label: 'Sắp diễn ra',
      bg: 'rgba(217,119,6,0.12)',
      fg: 'var(--color-warning)',
    };
  }
  return {
    label: 'Đang diễn ra',
    bg: 'rgba(47,133,90,0.1)',
    fg: 'var(--color-success)',
  };
}

function VoucherCard({
  v,
  onEdit,
  onDelete,
  onToggle,
}: {
  v: VoucherItem;
  onEdit: (v: VoucherItem) => void;
  onDelete: (v: VoucherItem) => void;
  onToggle: (v: VoucherItem) => void;
}) {
  const pct = v.totalQuantity > 0 ? (v.usedQuantity / v.totalQuantity) * 100 : 0;
  const tag = statusTag(v);
  const endLabel = v.isScheduled
    ? `Bắt đầu: ${dayjs(v.startDate).format('DD/MM/YYYY')}`
    : `Hết hạn: ${dayjs(v.endDate).format('DD/MM/YYYY')}`;

  return (
    <div
      style={{
        ...cardStyle(),
        padding: 24,
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontWeight: 700,
              fontSize: 24,
              color: 'var(--color-ink)',
              letterSpacing: '0.04em',
            }}
          >
            {v.code}
          </div>
          <div
            style={{
              marginTop: 6,
              color: 'var(--color-muted)',
              fontSize: 14,
            }}
          >
            {describeVoucher(v)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Tag
            style={{
              background: tag.bg,
              color: tag.fg,
              border: 'none',
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {tag.label}
          </Tag>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', label: 'Chỉnh sửa' },
                {
                  key: 'toggle',
                  label: v.isActive ? 'Tạm dừng' : 'Kích hoạt',
                },
                { type: 'divider' },
                { key: 'delete', label: 'Xoá', danger: true },
              ],
              onClick: ({ key }) => {
                if (key === 'edit') onEdit(v);
                else if (key === 'toggle') onToggle(v);
                else if (key === 'delete') onDelete(v);
              },
            }}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              aria-label="Thao tác"
            />
          </Dropdown>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--color-muted)',
          marginBottom: 6,
        }}
      >
        <span>Đã sử dụng</span>
        <span>
          {v.usedQuantity}/{v.totalQuantity}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: 'var(--color-divider)',
          overflow: 'hidden',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: `${Math.min(100, pct)}%`,
            height: '100%',
            background: 'var(--color-primary)',
            borderRadius: 999,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: 'var(--color-text)',
        }}
      >
        <CalendarOutlined style={{ color: 'var(--color-muted)' }} />
        {endLabel}
      </div>
    </div>
  );
}

export default function AdminVouchersPage() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const { isMobile, screens } = useResponsive();
  const isLgDown = !screens.lg;
  const isMdDown = !screens.md;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [createForm] = Form.useForm<VoucherFormValues>();
  const [editForm] = Form.useForm<VoucherFormValues>();
  const [editing, setEditing] = useState<VoucherItem | null>(null);
  const [selectedUsageVoucherId, setSelectedUsageVoucherId] =
    useState<string | null>(null);

  const listQ = useQuery<VoucherListResp>({
    queryKey: ['admin-vouchers', statusFilter, search],
    queryFn: async () => {
      const res = await api.get('/admin/vouchers', {
        params: {
          status: statusFilter,
          keyword: search || undefined,
          limit: 50,
        },
      });
      return unwrap<VoucherListResp>(res);
    },
  });

  const listItems = listQ.data?.items ?? [];

  // Pick a default usage voucher automatically if none chosen yet.
  const effectiveUsageVoucherId =
    selectedUsageVoucherId ?? listItems[0]?.id ?? null;

  const usageDetailQ = useQuery<VoucherDetail | null>({
    queryKey: ['admin-voucher-detail', effectiveUsageVoucherId],
    queryFn: async () => {
      if (!effectiveUsageVoucherId) return null;
      const res = await api.get(
        `/admin/vouchers/${effectiveUsageVoucherId}`,
      );
      return unwrap<VoucherDetail>(res);
    },
    enabled: !!effectiveUsageVoucherId,
  });

  const createMutation = useMutation({
    mutationFn: async (dto: Record<string, unknown>) => {
      const res = await api.post('/admin/vouchers', dto);
      return unwrap(res);
    },
    onSuccess: () => {
      message.success('Đã tạo voucher mới.');
      createForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Không thể tạo voucher'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; dto: Record<string, unknown> }) => {
      const res = await api.patch(
        `/admin/vouchers/${payload.id}`,
        payload.dto,
      );
      return unwrap(res);
    },
    onSuccess: () => {
      message.success('Đã cập nhật voucher.');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-voucher-detail'] });
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Không thể cập nhật voucher'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/vouchers/${id}`);
      return unwrap(res);
    },
    onSuccess: () => {
      message.success('Đã xoá voucher.');
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
    },
    onError: (err) => {
      // BE returns 400 + soft-delete when voucher was used. Treat as success.
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        message.success(
          'Voucher đã phát sinh lượt dùng — đã tự động tắt thay vì xoá vĩnh viễn.',
        );
        queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
        return;
      }
      message.error(extractErrorMessage(err, 'Không thể xoá voucher'));
    },
  });

  const handleCreate = (values: VoucherFormValues) => {
    const [start, end] = values.range ?? [];
    if (!start || !end) {
      message.warning('Vui lòng chọn thời gian hiệu lực');
      return;
    }
    createMutation.mutate({
      code: values.code.trim().toUpperCase(),
      type: values.type,
      value: values.value,
      maxDiscount:
        values.maxDiscount !== undefined && values.maxDiscount !== null
          ? values.maxDiscount
          : undefined,
      minOrderAmount: values.minOrderAmount ?? 0,
      totalQuantity: values.totalQuantity,
      perUserLimit: values.perUserLimit ?? 1,
      scopeType: values.scopeType ?? 'ALL',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      isActive: true,
    });
  };

  const openEdit = (v: VoucherItem) => {
    editForm.setFieldsValue({
      code: v.code,
      type: v.type,
      value: Number(v.value),
      maxDiscount: v.maxDiscount !== null ? Number(v.maxDiscount) : undefined,
      minOrderAmount: Number(v.minOrderAmount),
      totalQuantity: v.totalQuantity,
      perUserLimit: v.perUserLimit,
      scopeType: v.scopeType,
      range: [dayjs(v.startDate), dayjs(v.endDate)],
    });
    setEditing(v);
  };

  const handleEdit = (values: VoucherFormValues) => {
    if (!editing) return;
    const [start, end] = values.range ?? [];
    updateMutation.mutate({
      id: editing.id,
      dto: {
        type: values.type,
        value: values.value,
        maxDiscount:
          values.maxDiscount !== undefined && values.maxDiscount !== null
            ? values.maxDiscount
            : null,
        minOrderAmount: values.minOrderAmount ?? 0,
        totalQuantity: values.totalQuantity,
        perUserLimit: values.perUserLimit ?? 1,
        scopeType: values.scopeType ?? 'ALL',
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
      },
    });
  };

  const handleToggle = (v: VoucherItem) => {
    updateMutation.mutate({
      id: v.id,
      dto: { isActive: !v.isActive },
    });
  };

  const handleDelete = (v: VoucherItem) => {
    deleteMutation.mutate(v.id);
  };

  const stats = useMemo(() => {
    const total = listQ.data?.total ?? 0;
    const items = listItems;
    const avgUsage =
      items.length > 0
        ? items.reduce(
            (sum, v) =>
              sum + (v.totalQuantity > 0 ? v.usedQuantity / v.totalQuantity : 0),
            0,
          ) / items.length
        : 0;
    return { total, avgUsagePct: Math.round(avgUsage * 100) };
  }, [listItems, listQ.data?.total]);

  const typeWatch = Form.useWatch('type', createForm);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Quản Lý Voucher"
        subtitle="Thiết lập và theo dõi các chương trình ưu đãi của cửa hàng."
        trailing={
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm mã voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ width: isMobile ? '100%' : 260 }}
            />
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              style={{ width: isMobile ? '100%' : 180 }}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'active', label: 'Đang diễn ra' },
                { value: 'scheduled', label: 'Sắp diễn ra' },
                { value: 'expired', label: 'Đã hết hạn' },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              block={isMobile}
              onClick={() => {
                const el = document.getElementById(
                  'voucher-create-form-anchor',
                );
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Tạo Voucher Mới
            </Button>
          </div>
        }
      />

      {/* Existing vouchers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMdDown ? '1fr' : '1fr 1fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {listQ.isLoading ? (
          <>
            <div style={{ ...cardStyle(), padding: 24 }}>
              <Skeleton active title paragraph={{ rows: 3 }} />
            </div>
            <div style={{ ...cardStyle(), padding: 24 }}>
              <Skeleton active title paragraph={{ rows: 3 }} />
            </div>
          </>
        ) : listItems.length === 0 ? (
          <div
            style={{
              ...cardStyle(),
              padding: 24,
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: 'var(--color-muted)',
            }}
          >
            Chưa có voucher nào khớp với bộ lọc.
          </div>
        ) : (
          listItems.map((v) => (
            <VoucherCard
              key={v.id}
              v={v}
              onEdit={openEdit}
              onDelete={(victim) =>
                Modal.confirm({
                  title: `Xoá voucher ${victim.code}?`,
                  content:
                    'Nếu voucher đã phát sinh lượt dùng, hệ thống sẽ tự động tắt thay vì xoá vĩnh viễn.',
                  okText: 'Xoá',
                  okButtonProps: { danger: true },
                  cancelText: 'Huỷ',
                  onOk: () => handleDelete(victim),
                })
              }
              onToggle={handleToggle}
            />
          ))
        )}
      </div>

      {/* Middle 2-col */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isLgDown ? '1fr' : '3fr 2fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ ...cardStyle(), padding: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                className="eyebrow"
                style={{ color: 'var(--color-primary)', marginBottom: 6 }}
              >
                Hoạt động
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif), Georgia, serif',
                  fontSize: 22,
                  margin: 0,
                  color: 'var(--color-ink)',
                }}
              >
                Lịch sử sử dụng
              </h3>
            </div>
            <Select
              placeholder="Chọn voucher"
              style={{ minWidth: 240 }}
              value={effectiveUsageVoucherId ?? undefined}
              onChange={(v) => setSelectedUsageVoucherId(v)}
              options={listItems.map((v) => ({
                value: v.id,
                label: `${v.code} (${v.usedQuantity}/${v.totalQuantity})`,
              }))}
              disabled={listItems.length === 0}
            />
          </div>

          {usageDetailQ.isLoading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : !usageDetailQ.data || usageDetailQ.data.recentUsages.length === 0 ? (
            <div
              style={{
                color: 'var(--color-muted)',
                fontSize: 13,
                padding: '24px 0',
                textAlign: 'center',
              }}
            >
              Chưa có lượt sử dụng nào cho voucher này.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ color: 'var(--color-muted)' }}>
                    <th style={thStyle}>Khách hàng</th>
                    <th style={thStyle}>Mã</th>
                    <th style={thStyle}>Đơn hàng</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>
                      Giá trị giảm
                    </th>
                    <th style={thStyle}>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {usageDetailQ.data.recentUsages.map((u) => (
                    <tr
                      key={u.id}
                      style={{
                        borderTop: '1px solid var(--color-divider)',
                      }}
                    >
                      <td style={tdStyle}>{u.userEmail ?? '—'}</td>
                      <td style={tdStyle}>
                        <Tag
                          style={{
                            background: 'rgba(200,16,46,0.08)',
                            color: 'var(--color-primary)',
                            border: 'none',
                          }}
                        >
                          {usageDetailQ.data?.code}
                        </Tag>
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {u.orderCode ?? u.orderId.slice(0, 8)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {formatVnd(u.discountAmount)}
                      </td>
                      <td style={tdStyle}>
                        {dayjs(u.usedAt).format('DD/MM/YYYY HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          id="voucher-create-form-anchor"
          style={{ ...cardStyle(), padding: 24 }}
        >
          <div
            className="eyebrow"
            style={{ color: 'var(--color-primary)', marginBottom: 6 }}
          >
            <TagsOutlined /> &nbsp; Tạo mới
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 22,
              margin: '0 0 16px',
              color: 'var(--color-ink)',
            }}
          >
            Tạo Voucher Mới
          </h3>
          <Form<VoucherFormValues>
            form={createForm}
            layout="vertical"
            initialValues={{
              type: 'PERCENTAGE',
              perUserLimit: 1,
              minOrderAmount: 0,
              scopeType: 'ALL',
            }}
            onFinish={handleCreate}
          >
            <Form.Item
              name="code"
              label="Mã Voucher"
              rules={[{ required: true, message: 'Nhập mã voucher' }]}
            >
              <Input size="large" placeholder="VD: EDITORIAL25" />
            </Form.Item>
            <Form.Item name="type" label="Loại giảm giá">
              <Segmented
                block
                options={[
                  { value: 'PERCENTAGE', label: 'Phần trăm' },
                  { value: 'FIXED_AMOUNT', label: 'Cố định' },
                ]}
              />
            </Form.Item>
            <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
              <Form.Item
                style={{ flex: 1 }}
                name="value"
                label="Giá trị giảm"
                rules={[{ required: true, message: 'Nhập giá trị giảm' }]}
              >
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  addonAfter={typeWatch === 'PERCENTAGE' ? '%' : '₫'}
                  min={1}
                  placeholder="20"
                />
              </Form.Item>
              <Form.Item
                style={{ flex: 1 }}
                name="maxDiscount"
                label="Giảm tối đa"
                tooltip="Bắt buộc với voucher phần trăm"
              >
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  addonAfter="₫"
                  min={0}
                  placeholder="50000"
                />
              </Form.Item>
            </div>
            <Form.Item name="minOrderAmount" label="Đơn hàng tối thiểu">
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                addonAfter="₫"
                min={0}
                placeholder="500000"
              />
            </Form.Item>
            <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
              <Form.Item
                style={{ flex: 1 }}
                name="totalQuantity"
                label="Tổng số lượt"
                rules={[{ required: true, message: 'Nhập tổng số lượt' }]}
              >
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="200"
                />
              </Form.Item>
              <Form.Item
                style={{ flex: 1 }}
                name="perUserLimit"
                label="Giới hạn / khách"
              >
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="1"
                />
              </Form.Item>
            </div>
            <Form.Item
              name="range"
              label="Thời gian hiệu lực"
              rules={[{ required: true, message: 'Chọn thời gian hiệu lực' }]}
            >
              <RangePicker
                size="large"
                style={{ width: '100%' }}
                showTime
                format="DD/MM/YYYY HH:mm"
              />
            </Form.Item>
            <Form.Item name="scopeType" label="Phạm vi áp dụng">
              <Select
                size="large"
                options={[
                  { value: 'ALL', label: 'Toàn bộ sản phẩm' },
                  { value: 'CATEGORY', label: 'Theo danh mục' },
                  { value: 'BOOK', label: 'Theo sách' },
                ]}
              />
            </Form.Item>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              icon={<PercentageOutlined />}
              loading={createMutation.isPending}
              style={{ marginTop: 6 }}
              block
            >
              Xác nhận &amp; Phát hành
            </Button>
          </Form>
        </div>
      </div>

      {/* Stat strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? '1fr'
            : isMdDown
            ? 'repeat(2, 1fr)'
            : 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        <StatChip label="Tổng Voucher" value={String(stats.total)} />
        <StatChip label="Tỷ lệ sử dụng" value={`${stats.avgUsagePct}%`} />
        <StatChip
          label="Tổng tiền giảm"
          value="—"
          hint="Yêu cầu endpoint tổng hợp — phase 2"
        />
      </div>

      <Modal
        title={editing ? `Chỉnh sửa ${editing.code}` : 'Chỉnh sửa voucher'}
        open={!!editing}
        onCancel={() => setEditing(null)}
        footer={null}
        destroyOnClose
      >
        <Form<VoucherFormValues>
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
        >
          <Form.Item name="code" label="Mã Voucher">
            <Input size="large" disabled />
          </Form.Item>
          <Form.Item name="type" label="Loại giảm giá">
            <Segmented
              block
              options={[
                { value: 'PERCENTAGE', label: 'Phần trăm' },
                { value: 'FIXED_AMOUNT', label: 'Cố định' },
              ]}
            />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <Form.Item style={{ flex: 1 }} name="value" label="Giá trị">
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>
            <Form.Item
              style={{ flex: 1 }}
              name="maxDiscount"
              label="Giảm tối đa"
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>
          </div>
          <Form.Item name="minOrderAmount" label="Đơn hàng tối thiểu">
            <InputNumber size="large" style={{ width: '100%' }} min={0} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <Form.Item
              style={{ flex: 1 }}
              name="totalQuantity"
              label="Tổng số lượt"
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>
            <Form.Item
              style={{ flex: 1 }}
              name="perUserLimit"
              label="Giới hạn / khách"
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>
          </div>
          <Form.Item name="range" label="Thời gian hiệu lực">
            <RangePicker
              size="large"
              style={{ width: '100%' }}
              showTime
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>
          <Form.Item name="scopeType" label="Phạm vi áp dụng">
            <Select
              size="large"
              options={[
                { value: 'ALL', label: 'Toàn bộ sản phẩm' },
                { value: 'CATEGORY', label: 'Theo danh mục' },
                { value: 'BOOK', label: 'Theo sách' },
              ]}
            />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setEditing(null)}>Huỷ</Button>
            <Popconfirm
              title="Xác nhận lưu thay đổi?"
              onConfirm={() => editForm.submit()}
            >
              <Button type="primary" loading={updateMutation.isPending}>
                Lưu thay đổi
              </Button>
            </Popconfirm>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

function StatChip({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      style={{
        ...cardStyle(),
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      title={hint}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--color-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif), Georgia, serif',
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--color-ink)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  color: 'var(--color-text)',
};
