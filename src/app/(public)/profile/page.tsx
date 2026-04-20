'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { AuthGuard } from '@/components/layout/auth-guard';
import { PageHeading } from '@/components/editorial';
import { useAuthStore } from '@/lib/auth-store';
import { useLogout } from '@/lib/auth-hooks';
import type { Address, User } from '@/lib/types';

const { Text } = Typography;

const MAX_ADDRESSES = 5;

interface ProfileFormValues {
  fullName: string;
  phone?: string;
  avatarUrl?: string;
}

interface AddressFormValues {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault?: boolean;
}

interface PasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// --- Profile info tab ---------------------------------------------------
function ProfileInfoTab() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [form] = Form.useForm<ProfileFormValues>();

  const { data: me, isLoading } = useQuery({
    queryKey: ['me-profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return unwrap<User>(res);
    },
  });

  useEffect(() => {
    if (me) {
      form.setFieldsValue({
        fullName: me.fullName,
        phone: me.phone ?? '',
        avatarUrl: me.avatarUrl ?? '',
      });
    }
  }, [me, form]);

  const update = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const res = await api.patch('/users/me', values);
      return unwrap<User>(res);
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['me-profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      message.success('Đã cập nhật thông tin');
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Cập nhật thất bại'));
    },
  });

  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(v) => update.mutate(v)}
      style={{ maxWidth: 480 }}
    >
      <Form.Item label="Email">
        <Input value={me?.email} disabled />
      </Form.Item>
      <Form.Item
        name="fullName"
        label="Họ tên"
        rules={[{ required: true, min: 2, max: 255 }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="phone"
        label="Số điện thoại"
        rules={[
          {
            pattern: /^[0-9+\-\s]{8,20}$/,
            message: 'Số điện thoại không hợp lệ',
          },
        ]}
      >
        <Input placeholder="09xxxxxxxx" />
      </Form.Item>
      <Form.Item name="avatarUrl" label="URL ảnh đại diện">
        <Input placeholder="https://..." />
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        loading={update.isPending}
      >
        Lưu thay đổi
      </Button>
    </Form>
  );
}

// --- Address modal (create / edit) --------------------------------------
function AddressModal({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Address | null;
}) {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<AddressFormValues>();

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initial) {
        form.setFieldsValue({
          recipientName: initial.recipientName,
          phone: initial.phone,
          province: initial.province,
          district: initial.district,
          ward: initial.ward,
          streetAddress: initial.streetAddress,
          isDefault: initial.isDefault,
        });
      }
    }
  }, [open, initial, form]);

  const save = useMutation({
    mutationFn: async (values: AddressFormValues) => {
      if (initial) {
        const res = await api.patch(
          `/users/me/addresses/${initial.id}`,
          values,
        );
        return unwrap<Address>(res);
      }
      const res = await api.post('/users/me/addresses', values);
      return unwrap<Address>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-addresses'] });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      message.success(initial ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ');
      onClose();
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Lưu địa chỉ thất bại'));
    },
  });

  return (
    <Modal
      title={initial ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={save.isPending}
      okText="Lưu"
      cancelText="Huỷ"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => save.mutate(v)}
        preserve={false}
      >
        <Form.Item
          name="recipientName"
          label="Người nhận"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true },
            { pattern: /^[0-9+\-\s]{8,20}$/, message: 'Số điện thoại không hợp lệ' },
          ]}
        >
          <Input />
        </Form.Item>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item
              name="province"
              label="Tỉnh/TP"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="district"
              label="Quận/Huyện"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="ward"
              label="Phường/Xã"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="streetAddress"
          label="Địa chỉ cụ thể"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// --- Address tab -------------------------------------------------------
function AddressesTab() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['profile-addresses'],
    queryFn: async () => {
      const res = await api.get('/users/me/addresses');
      return unwrap<Address[]>(res);
    },
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/users/me/addresses/${id}`, {
        isDefault: true,
      });
      return unwrap(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-addresses'] });
      message.success('Đã đặt làm mặc định');
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Cập nhật thất bại'));
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/users/me/addresses/${id}`);
      return unwrap(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-addresses'] });
      message.success('Đã xoá địa chỉ');
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Xoá thất bại'));
    },
  });

  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;

  const reachedLimit = (addresses?.length ?? 0) >= MAX_ADDRESSES;

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={reachedLimit}
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Thêm địa chỉ
        </Button>
        {reachedLimit ? (
          <Text type="warning">
            Đã đạt giới hạn {MAX_ADDRESSES} địa chỉ.
          </Text>
        ) : null}
      </Space>
      {!addresses || addresses.length === 0 ? (
        <Empty description="Chưa có địa chỉ nào" />
      ) : (
        <Row gutter={[16, 16]}>
          {addresses.map((a) => (
            <Col xs={24} md={12} key={a.id}>
              <Card
                size="small"
                title={
                  <Space>
                    <Text strong>{a.recipientName}</Text>
                    {a.isDefault ? <Tag color="blue">Mặc định</Tag> : null}
                  </Space>
                }
                actions={[
                  <Button
                    key="edit"
                    type="link"
                    onClick={() => {
                      setEditing(a);
                      setModalOpen(true);
                    }}
                  >
                    Sửa
                  </Button>,
                  <Button
                    key="default"
                    type="link"
                    disabled={a.isDefault}
                    loading={setDefault.isPending}
                    onClick={() => setDefault.mutate(a.id)}
                  >
                    Đặt mặc định
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="Xoá địa chỉ này?"
                    okText="Xoá"
                    cancelText="Huỷ"
                    onConfirm={() => remove.mutate(a.id)}
                  >
                    <Button type="link" danger loading={remove.isPending}>
                      Xoá
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <div>{a.phone}</div>
                <div>
                  {a.streetAddress}, {a.ward}, {a.district}, {a.province}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <AddressModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
      />
    </>
  );
}

// --- Password tab ------------------------------------------------------
function PasswordTab() {
  const { message } = AntdApp.useApp();
  const router = useRouter();
  const logout = useLogout();
  const [form] = Form.useForm<PasswordFormValues>();

  const change = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      const res = await api.post('/users/me/change-password', values);
      return unwrap(res);
    },
    onSuccess: async () => {
      message.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      await logout.mutateAsync();
      router.push('/login');
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Đổi mật khẩu thất bại'));
    },
  });

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(v) => change.mutate(v)}
      style={{ maxWidth: 480 }}
    >
      <Form.Item
        name="oldPassword"
        label="Mật khẩu hiện tại"
        rules={[{ required: true }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        name="newPassword"
        label="Mật khẩu mới"
        rules={[
          { required: true, min: 8, message: 'Tối thiểu 8 ký tự' },
          {
            pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
            message: 'Phải gồm cả chữ và số',
          },
        ]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Xác nhận mật khẩu mới"
        dependencies={['newPassword']}
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Xác nhận mật khẩu không khớp'));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        loading={change.isPending}
      >
        Đổi mật khẩu
      </Button>
    </Form>
  );
}

function ProfileInner() {
  return (
    <div>
      <PageHeading
        eyebrow="Tài khoản"
        title="Tài khoản của tôi"
        subtitle="Quản lý thông tin cá nhân, địa chỉ giao hàng và bảo mật tài khoản."
      />
      <Card style={{ borderRadius: 16 }}>
        <Tabs
          defaultActiveKey="info"
          items={[
            { key: 'info', label: 'Thông tin', children: <ProfileInfoTab /> },
            { key: 'addresses', label: 'Địa chỉ', children: <AddressesTab /> },
            { key: 'password', label: 'Đổi mật khẩu', children: <PasswordTab /> },
          ]}
        />
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard role="CUSTOMER">
      <ProfileInner />
    </AuthGuard>
  );
}
