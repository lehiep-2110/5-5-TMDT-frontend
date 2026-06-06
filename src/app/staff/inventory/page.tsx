'use client';

import { useQuery } from '@tanstack/react-query';
import { Col, Row } from 'antd';
import {
  AlertOutlined,
  DatabaseOutlined,
  InboxOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { api, unwrap } from '@/lib/api';
import { InventoryPanel } from '@/components/inventory-panel';
import { PageHeading, StatCard } from '@/components/editorial';
import { useResponsive } from '@/lib/use-responsive';

interface InventoryItem {
  id: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

interface InventoryResp {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function StaffInventoryPage() {
  const { isMobile } = useResponsive();
  // Lightweight summary fetches for the stat strip.
  const totalQ = useQuery({
    queryKey: ['staff-inventory-total'],
    queryFn: async () => {
      const res = await api.get('/inventory', { params: { page: 1, limit: 1 } });
      return unwrap<InventoryResp>(res);
    },
  });
  const lowQ = useQuery({
    queryKey: ['staff-inventory-low'],
    queryFn: async () => {
      const res = await api.get('/inventory', {
        params: { page: 1, limit: 1, lowStockOnly: 'true' },
      });
      return unwrap<InventoryResp>(res);
    },
  });

  const totalTitles = totalQ.data?.total ?? 0;
  const lowStock = lowQ.data?.total ?? 0;

  return (
    <div>
      <PageHeading
        eyebrow="KHO HÀNG"
        title="Kho hàng & Tồn kho"
        subtitle="Theo dõi tồn kho, nhập thêm hàng và xử lý cảnh báo tồn thấp theo thời gian thực."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<DatabaseOutlined />}
            label="Tổng số đầu sách"
            value={totalTitles.toLocaleString('vi-VN')}
            tone="ink"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<AlertOutlined />}
            label="Sắp hết hàng"
            value={lowStock.toLocaleString('vi-VN')}
            tone="primary"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<InboxOutlined />}
            label="Nhập kho tuần này"
            /* Mocked for MVP */
            value="24"
            delta={8}
            tone="soft"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<LineChartOutlined />}
            label="Tỷ lệ đáp ứng"
            /* Mocked for MVP */
            value="96%"
            delta={2}
            tone="ink"
          />
        </Col>
      </Row>

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid var(--color-divider)',
          boxShadow: '0 1px 2px rgba(26,26,26,0.04)',
          overflow: 'hidden',
        }}
      >
        <InventoryPanel title="Danh mục tồn kho" compact={isMobile} />
      </div>
    </div>
  );
}
