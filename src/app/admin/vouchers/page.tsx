'use client';

import {
  App as AntdApp,
  Alert,
  Button,
  DatePicker,
  Input,
  InputNumber,
  Segmented,
  Select,
  Table,
  Tag,
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  PercentageOutlined,
  SearchOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { PageHeading } from '@/components/editorial';

const { RangePicker } = DatePicker;

function cardStyle(): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid var(--color-divider)',
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(26,26,26,0.03)',
  };
}

interface VoucherMock {
  code: string;
  status: 'active' | 'upcoming';
  tagLabel: string;
  description: string;
  used: number;
  total: number;
  dateLabel: string;
}

const VOUCHERS: VoucherMock[] = [
  {
    code: 'EDITORIAL20',
    status: 'active',
    tagLabel: 'Đang diễn ra',
    description: 'Giảm 20% cho đơn hàng từ 500,000₫',
    used: 145,
    total: 200,
    dateLabel: 'Hết hạn: 31/12/2023',
  },
  {
    code: 'BOOKWORM10',
    status: 'upcoming',
    tagLabel: 'Sắp diễn ra',
    description: 'Giảm 10% tối đa 50,000₫',
    used: 0,
    total: 500,
    dateLabel: 'Bắt đầu: 01/01/2024',
  },
];

const HISTORY = [
  {
    customer: 'Nguyễn Thị Mai',
    code: 'EDITORIAL20',
    order: 'ORD-2024-0192',
    value: '120,000₫',
    time: '12/01/2024 09:32',
  },
  {
    customer: 'Trần Đức Huy',
    code: 'EDITORIAL20',
    order: 'ORD-2024-0189',
    value: '85,000₫',
    time: '11/01/2024 18:05',
  },
  {
    customer: 'Lê Minh Anh',
    code: 'EDITORIAL20',
    order: 'ORD-2024-0183',
    value: '150,000₫',
    time: '10/01/2024 21:12',
  },
];

function VoucherCard({ v }: { v: VoucherMock }) {
  const pct = v.total > 0 ? (v.used / v.total) * 100 : 0;
  const isActive = v.status === 'active';
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
        }}
      >
        <div>
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
            {v.description}
          </div>
        </div>
        <Tag
          style={{
            background: isActive
              ? 'rgba(47,133,90,0.1)'
              : 'rgba(217,119,6,0.1)',
            color: isActive ? 'var(--color-success)' : 'var(--color-warning)',
            border: 'none',
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {v.tagLabel}
        </Tag>
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
          {v.used}/{v.total}
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
            width: `${pct}%`,
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
        {v.dateLabel}
      </div>
    </div>
  );
}

export default function AdminVouchersPage() {
  const { message } = AntdApp.useApp();
  const [discountKind, setDiscountKind] = useState<'percent' | 'fixed'>(
    'percent',
  );
  const [search, setSearch] = useState('');

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Quản Lý Voucher"
        subtitle="Thiết lập và theo dõi các chương trình ưu đãi của cửa hàng."
        trailing={
          <div style={{ display: 'flex', gap: 12 }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm mã voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                message.info(
                  'Phase 2 — Voucher sẽ ra mắt trong bản cập nhật tiếp theo',
                )
              }
            >
              Tạo Voucher Mới
            </Button>
          </div>
        }
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message="Trang Voucher đang ở chế độ xem trước. Dữ liệu sẽ được kích hoạt trong phase 2."
      />

      {/* Existing vouchers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {VOUCHERS.map((v) => (
          <VoucherCard key={v.code} v={v} />
        ))}
      </div>

      {/* Middle 2-col */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ ...cardStyle(), padding: 24 }}>
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
              margin: '0 0 16px',
              color: 'var(--color-ink)',
            }}
          >
            Lịch sử sử dụng
          </h3>
          <Table
            rowKey="order"
            pagination={false}
            dataSource={HISTORY}
            columns={[
              { title: 'Khách hàng', dataIndex: 'customer' },
              {
                title: 'Mã',
                dataIndex: 'code',
                render: (v: string) => (
                  <Tag
                    style={{
                      background: 'rgba(200,16,46,0.08)',
                      color: 'var(--color-primary)',
                      border: 'none',
                    }}
                  >
                    {v}
                  </Tag>
                ),
              },
              {
                title: 'Đơn hàng',
                dataIndex: 'order',
                render: (v: string) => (
                  <span
                    style={{
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {v}
                  </span>
                ),
              },
              {
                title: 'Giá trị giảm',
                dataIndex: 'value',
                align: 'right',
              },
              {
                title: 'Thời gian',
                dataIndex: 'time',
              },
            ]}
          />
        </div>

        <div style={{ ...cardStyle(), padding: 24 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ marginBottom: 6, fontSize: 12, color: 'var(--color-muted)' }}>
                Mã Voucher
              </div>
              <Input size="large" placeholder="VD: EDITORIAL25" />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontSize: 12, color: 'var(--color-muted)' }}>
                Loại giảm giá
              </div>
              <Segmented
                block
                value={discountKind}
                onChange={(v) => setDiscountKind(v as 'percent' | 'fixed')}
                options={[
                  { value: 'percent', label: 'Phần trăm' },
                  { value: 'fixed', label: 'Cố định' },
                ]}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    marginBottom: 6,
                    fontSize: 12,
                    color: 'var(--color-muted)',
                  }}
                >
                  Giá trị giảm
                </div>
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  addonAfter={discountKind === 'percent' ? '%' : '₫'}
                  min={0}
                  placeholder="20"
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    marginBottom: 6,
                    fontSize: 12,
                    color: 'var(--color-muted)',
                  }}
                >
                  Giảm tối đa
                </div>
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  addonAfter="₫"
                  min={0}
                  placeholder="50000"
                />
              </div>
            </div>
            <div>
              <div
                style={{
                  marginBottom: 6,
                  fontSize: 12,
                  color: 'var(--color-muted)',
                }}
              >
                Đơn hàng tối thiểu
              </div>
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                addonAfter="₫"
                min={0}
                placeholder="500000"
              />
            </div>
            <div>
              <div
                style={{
                  marginBottom: 6,
                  fontSize: 12,
                  color: 'var(--color-muted)',
                }}
              >
                Thời gian hiệu lực
              </div>
              <RangePicker size="large" style={{ width: '100%' }} />
            </div>
            <div>
              <div
                style={{
                  marginBottom: 6,
                  fontSize: 12,
                  color: 'var(--color-muted)',
                }}
              >
                Giới hạn / khách hàng
              </div>
              <Select
                size="large"
                defaultValue="1"
                style={{ width: '100%' }}
                options={[
                  { value: '1', label: '1 lần / khách' },
                  { value: '3', label: '3 lần / khách' },
                  { value: 'unlimited', label: 'Không giới hạn' },
                ]}
              />
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PercentageOutlined />}
              onClick={() =>
                message.info(
                  'Phase 2 — Voucher sẽ ra mắt trong bản cập nhật tiếp theo',
                )
              }
              style={{ marginTop: 6 }}
            >
              Xác nhận &amp; Phát hành
            </Button>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {[
          { label: 'Tổng Voucher', value: '24' },
          { label: 'Tỷ lệ sử dụng', value: '86%' },
          { label: 'Tổng tiền giảm', value: '12.4M' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              ...cardStyle(),
              padding: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
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
              {s.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontSize: 26,
                fontWeight: 700,
                color: 'var(--color-ink)',
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
