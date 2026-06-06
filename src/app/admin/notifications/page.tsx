'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Form,
  Input,
  Radio,
  Select,
  Tag,
} from 'antd';
import { BellOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { PageHeading } from '@/components/editorial';
import { useResponsive } from '@/lib/use-responsive';

interface BroadcastFormValues {
  target: 'all' | 'specific';
  userIds?: string[];
  title: string;
  content: string;
  link?: string;
}

interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
}

interface UsersResp {
  items: AdminUserRow[];
  total: number;
}

interface BroadcastHistoryEntry {
  id: string;
  at: string;
  title: string;
  content: string;
  link?: string;
  target: 'all' | 'specific';
  targetCount: number;
  sent: number;
}

function cardStyle(): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid var(--color-divider)',
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(26,26,26,0.03)',
  };
}

export default function AdminNotificationsPage() {
  const { message } = AntdApp.useApp();
  const { screens } = useResponsive();
  const isLgDown = !screens.lg;
  const [form] = Form.useForm<BroadcastFormValues>();
  const targetWatch = Form.useWatch('target', form);
  const [history, setHistory] = useState<BroadcastHistoryEntry[]>([]);

  const usersQ = useQuery<UsersResp>({
    queryKey: ['admin-notifications', 'customers'],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: { role: 'CUSTOMER', limit: 100 },
      });
      return unwrap<UsersResp>(res);
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: {
      target: 'all' | string[];
      title: string;
      content: string;
      link?: string;
    }) => {
      const res = await api.post<{ data: { sent: number } }>(
        '/admin/notifications',
        payload,
      );
      return unwrap<{ sent: number }>(res as never);
    },
  });

  const onFinish = async (values: BroadcastFormValues) => {
    const targetPayload: 'all' | string[] =
      values.target === 'all' ? 'all' : values.userIds ?? [];
    if (values.target === 'specific' && (!values.userIds || values.userIds.length === 0)) {
      message.warning('Vui lòng chọn ít nhất một khách hàng.');
      return;
    }

    try {
      const result = await sendMutation.mutateAsync({
        target: targetPayload,
        title: values.title.trim(),
        content: values.content.trim(),
        link: values.link?.trim() || undefined,
      });
      message.success(`Đã gửi thông báo đến ${result.sent} người.`);
      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          at: new Date().toISOString(),
          title: values.title,
          content: values.content,
          link: values.link,
          target: values.target,
          targetCount:
            values.target === 'all'
              ? usersQ.data?.total ?? result.sent
              : values.userIds?.length ?? 0,
          sent: result.sent,
        },
        ...prev,
      ]);
      form.resetFields();
      form.setFieldsValue({ target: 'all' });
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể gửi thông báo'));
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <PageHeading
        title="Gửi thông báo hệ thống"
        subtitle="Soạn và gửi thông báo đến tất cả khách hàng hoặc một nhóm cụ thể. Thông báo xuất hiện trong chuông & được push realtime."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isLgDown ? '1fr' : '3fr 2fr',
          gap: 16,
        }}
      >
        <div style={{ ...cardStyle(), padding: 24 }}>
          <div
            className="eyebrow"
            style={{ color: 'var(--color-primary)', marginBottom: 6 }}
          >
            <BellOutlined /> &nbsp; Soạn thông báo
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 22,
              margin: '0 0 16px',
              color: 'var(--color-ink)',
            }}
          >
            Nội dung thông báo
          </h3>
          <Form<BroadcastFormValues>
            form={form}
            layout="vertical"
            initialValues={{ target: 'all' }}
            onFinish={onFinish}
          >
            <Form.Item name="target" label="Đối tượng nhận">
              <Radio.Group>
                <Radio value="all">Tất cả khách hàng</Radio>
                <Radio value="specific">Chọn người dùng cụ thể</Radio>
              </Radio.Group>
            </Form.Item>

            {targetWatch === 'specific' ? (
              <Form.Item
                name="userIds"
                label="Danh sách khách hàng"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng chọn ít nhất một khách hàng',
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  placeholder="Tìm theo email hoặc tên..."
                  loading={usersQ.isLoading}
                  options={(usersQ.data?.items ?? []).map((u) => ({
                    value: u.id,
                    label: `${u.fullName || u.email} — ${u.email}`,
                  }))}
                  maxTagCount="responsive"
                />
              </Form.Item>
            ) : null}

            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[
                { required: true, message: 'Nhập tiêu đề' },
                { max: 255, message: 'Tối đa 255 ký tự' },
              ]}
            >
              <Input size="large" placeholder="VD: Chương trình Flash Sale..." />
            </Form.Item>

            <Form.Item
              name="content"
              label="Nội dung"
              rules={[
                { required: true, message: 'Nhập nội dung' },
                { max: 1000, message: 'Tối đa 1000 ký tự' },
              ]}
            >
              <Input.TextArea
                rows={5}
                maxLength={1000}
                showCount
                placeholder="Nội dung chi tiết hiển thị trong thông báo..."
              />
            </Form.Item>

            <Form.Item
              name="link"
              label="Đường dẫn (tuỳ chọn)"
              tooltip="Khi người dùng chạm vào thông báo sẽ được điều hướng đến link này"
            >
              <Input
                size="large"
                placeholder="VD: /books/slug hoặc https://..."
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SendOutlined />}
              loading={sendMutation.isPending}
              block
            >
              Gửi thông báo
            </Button>
          </Form>
        </div>

        <div style={{ ...cardStyle(), padding: 24 }}>
          <div
            className="eyebrow"
            style={{ color: 'var(--color-primary)', marginBottom: 6 }}
          >
            Gần đây
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 22,
              margin: '0 0 16px',
              color: 'var(--color-ink)',
            }}
          >
            Lịch sử gửi (phiên này)
          </h3>
          {history.length === 0 ? (
            <div
              style={{
                color: 'var(--color-muted)',
                fontSize: 13,
                padding: '24px 0',
                textAlign: 'center',
              }}
            >
              Chưa có thông báo nào được gửi trong phiên này.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {history.map((h) => (
                <div
                  key={h.id}
                  style={{
                    border: '1px solid var(--color-divider)',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                        fontSize: 14,
                      }}
                    >
                      {h.title}
                    </div>
                    <Tag
                      style={{
                        background:
                          h.target === 'all'
                            ? 'rgba(47,133,90,0.1)'
                            : 'rgba(37,99,235,0.08)',
                        color:
                          h.target === 'all'
                            ? 'var(--color-success)'
                            : '#2563EB',
                        border: 'none',
                        margin: 0,
                      }}
                    >
                      {h.target === 'all' ? 'Tất cả' : 'Cụ thể'} · {h.sent}
                    </Tag>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--color-text)',
                      marginBottom: 6,
                    }}
                  >
                    {h.content}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--color-muted)',
                    }}
                  >
                    {dayjs(h.at).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              color: 'var(--color-muted)',
            }}
          >
            {/* TODO phase 2 broadcast history endpoint */}
            Danh sách này chỉ lưu trong phiên trình duyệt. Phase 2 sẽ lưu vào BE.
          </div>
        </div>
      </div>
    </div>
  );
}
