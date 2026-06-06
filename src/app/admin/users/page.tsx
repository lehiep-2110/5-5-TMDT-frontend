'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Dropdown,
  Input,
  List,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useResponsive } from '@/lib/use-responsive';
import { DownOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { PageHeading } from '@/components/editorial';
import type { UserStatus } from '@/lib/types';

const PAGE_SIZE = 20;

interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: UserStatus;
  createdAt: string;
}

interface UsersResp {
  items: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_OPTIONS: Array<{ value: UserStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'PENDING_VERIFICATION', label: 'Chưa xác thực' },
  { value: 'LOCKED', label: 'Đã khoá' },
  { value: 'BANNED', label: 'Bị cấm' },
];

const STATUS_CFG: Record<UserStatus, { label: string; bg: string; fg: string }> = {
  ACTIVE: {
    label: 'Hoạt động',
    bg: 'rgba(47,133,90,0.1)',
    fg: 'var(--color-success)',
  },
  PENDING_VERIFICATION: {
    label: 'Chưa xác thực',
    bg: 'rgba(217,119,6,0.12)',
    fg: 'var(--color-warning)',
  },
  LOCKED: {
    label: 'Đã khoá',
    bg: 'rgba(138,138,138,0.12)',
    fg: 'var(--color-muted)',
  },
  BANNED: {
    label: 'Bị cấm',
    bg: 'rgba(200,16,46,0.1)',
    fg: 'var(--color-primary)',
  },
};

function statusPill(status: UserStatus) {
  const s = STATUS_CFG[status] ?? {
    label: String(status),
    bg: 'rgba(138,138,138,0.12)',
    fg: 'var(--color-muted)',
  };
  return (
    <Tag
      style={{
        background: s.bg,
        color: s.fg,
        border: 'none',
        fontWeight: 600,
      }}
    >
      {s.label}
    </Tag>
  );
}

export default function AdminUsersPage() {
  const { modal, message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const { isMobile, screens, isSmDown } = useResponsive();
  const isMdDown = !screens.md;

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<UserStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const listQ = useQuery({
    queryKey: ['admin-users', { keyword, status, page }],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: {
          role: 'CUSTOMER',
          status: status === 'ALL' ? undefined : status,
          keyword: keyword || undefined,
          page,
          limit: PAGE_SIZE,
        },
      });
      return unwrap<UsersResp>(res);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      nextStatus,
    }: {
      id: string;
      nextStatus: UserStatus;
    }) => {
      const res = await api.patch(`/admin/users/${id}/status`, {
        status: nextStatus,
      });
      return unwrap(res);
    },
    onSuccess: () => {
      message.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) =>
      message.error(extractErrorMessage(err, 'Cập nhật thất bại')),
  });

  const confirmAction = (
    id: string,
    nextStatus: UserStatus,
    title: string,
  ) => {
    modal.confirm({
      title,
      okText: 'Xác nhận',
      cancelText: 'Huỷ',
      onOk: () => updateStatusMutation.mutateAsync({ id, nextStatus }),
    });
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Khách hàng"
        subtitle="Danh sách người mua trên nền tảng và trạng thái tài khoản."
        trailing={
          <Space wrap style={isMobile ? { width: '100%' } : undefined}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Email hoặc tên..."
              style={{ width: isMobile ? '100%' : 280 }}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onPressEnter={() => {
                setPage(1);
                setKeyword(keywordInput);
              }}
            />
            <Select<UserStatus | 'ALL'>
              value={status}
              style={{ width: isMobile ? 180 : 200 }}
              onChange={(v) => {
                setPage(1);
                setStatus(v);
              }}
              options={STATUS_OPTIONS}
            />
          </Space>
        }
      />
      <Card
        style={{
          border: '1px solid var(--color-divider)',
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(26,26,26,0.03)',
        }}
        bodyStyle={isSmDown ? { padding: 12 } : undefined}
      >
        {isSmDown ? (
          <>
            <List<AdminUserRow>
              loading={listQ.isLoading}
              dataSource={listQ.data?.items ?? []}
              rowKey="id"
              renderItem={(row) => {
                const items = [
                  row.status !== 'LOCKED'
                    ? {
                        key: 'lock',
                        label: 'Khoá tài khoản',
                        onClick: () =>
                          confirmAction(row.id, 'LOCKED', `Khoá tài khoản ${row.email}?`),
                      }
                    : null,
                  row.status !== 'ACTIVE'
                    ? {
                        key: 'unlock',
                        label: 'Mở khoá',
                        onClick: () =>
                          confirmAction(row.id, 'ACTIVE', `Kích hoạt lại tài khoản ${row.email}?`),
                      }
                    : null,
                  row.status !== 'BANNED'
                    ? {
                        key: 'ban',
                        label: 'Cấm vĩnh viễn',
                        danger: true,
                        onClick: () =>
                          confirmAction(row.id, 'BANNED', `Cấm vĩnh viễn tài khoản ${row.email}?`),
                      }
                    : null,
                ].filter(Boolean) as Array<{
                  key: string;
                  label: string;
                  danger?: boolean;
                  onClick: () => void;
                }>;
                return (
                  <List.Item
                    style={{ padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}
                    actions={[
                      <Dropdown key="actions" menu={{ items }}>
                        <Button size="small">
                          Thao tác <DownOutlined />
                        </Button>
                      </Dropdown>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={36}
                          icon={<UserOutlined />}
                          style={{ background: 'rgba(200,16,46,0.1)', color: 'var(--color-primary)' }}
                        />
                      }
                      title={
                        <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                          {row.fullName}
                        </div>
                      }
                      description={
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                          <div>{row.email}</div>
                          <div style={{ marginTop: 4 }}>{statusPill(row.status)}</div>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                simple
                current={page}
                pageSize={PAGE_SIZE}
                total={listQ.data?.total ?? 0}
                onChange={(p) => setPage(p)}
              />
            </div>
          </>
        ) : (
        <Table<AdminUserRow>
          rowKey="id"
          loading={listQ.isLoading}
          dataSource={listQ.data?.items ?? []}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: listQ.data?.total ?? 0,
            showSizeChanger: false,
            onChange: (p) => setPage(p),
            simple: isMobile,
          }}
          scroll={{ x: isMdDown ? 700 : undefined }}
          columns={[
            {
              title: 'Khách hàng',
              key: 'user',
              render: (_: unknown, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar
                    size={36}
                    icon={<UserOutlined />}
                    style={{
                      background: 'rgba(200,16,46,0.1)',
                      color: 'var(--color-primary)',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {row.fullName}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-muted)',
                      }}
                    >
                      {row.email}
                    </div>
                  </div>
                </div>
              ),
            },
            !isMdDown
              ? {
                  title: 'SĐT',
                  dataIndex: 'phone',
                  width: 140,
                  render: (v: string | null) => v ?? '—',
                }
              : null,
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 140,
              render: (s: UserStatus) => statusPill(s),
            },
            !isMdDown
              ? {
                  title: 'Ngày tham gia',
                  dataIndex: 'createdAt',
                  width: 140,
                  render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
                }
              : null,
            {
              title: '',
              key: 'actions',
              width: 140,
              render: (_: unknown, row) => {
                const items = [
                  row.status !== 'LOCKED'
                    ? {
                        key: 'lock',
                        label: 'Khoá tài khoản',
                        onClick: () =>
                          confirmAction(
                            row.id,
                            'LOCKED',
                            `Khoá tài khoản ${row.email}?`,
                          ),
                      }
                    : null,
                  row.status !== 'ACTIVE'
                    ? {
                        key: 'unlock',
                        label: 'Mở khoá',
                        onClick: () =>
                          confirmAction(
                            row.id,
                            'ACTIVE',
                            `Kích hoạt lại tài khoản ${row.email}?`,
                          ),
                      }
                    : null,
                  row.status !== 'BANNED'
                    ? {
                        key: 'ban',
                        label: 'Cấm vĩnh viễn',
                        danger: true,
                        onClick: () =>
                          confirmAction(
                            row.id,
                            'BANNED',
                            `Cấm vĩnh viễn tài khoản ${row.email}?`,
                          ),
                      }
                    : null,
                ].filter(Boolean) as Array<{
                  key: string;
                  label: string;
                  danger?: boolean;
                  onClick: () => void;
                }>;
                return (
                  <Dropdown menu={{ items }}>
                    <Button size="small">
                      Thao tác <DownOutlined />
                    </Button>
                  </Dropdown>
                );
              },
            },
          ].filter(Boolean) as ColumnsType<AdminUserRow>}
        />
        )}
      </Card>
    </div>
  );
}
