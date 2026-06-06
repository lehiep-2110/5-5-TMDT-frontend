'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  List,
  Modal,
  Pagination,
  Popconfirm,
  Space,
  Table,
  Upload,
} from 'antd';
import { PageHeading } from '@/components/editorial';
import { useResponsive } from '@/lib/use-responsive';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image-url';
import type { PageEnvelope } from '@/lib/types';

const PAGE_SIZE = 20;

interface Author {
  id: string;
  name: string;
  biography: string | null;
  nationality: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthorFormValues {
  name: string;
  biography?: string;
  nationality?: string;
}

export default function AdminAuthorsPage() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const { isMobile, isSmDown } = useResponsive();

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [form] = Form.useForm<AuthorFormValues>();

  const listQ = useQuery({
    queryKey: ['admin-authors', { keyword, page }],
    queryFn: async () => {
      const res = await api.get('/admin/authors', {
        params: {
          keyword: keyword || undefined,
          page,
          limit: PAGE_SIZE,
        },
      });
      return unwrap<PageEnvelope<Author>>(res);
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setFileList([]);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (author: Author) => {
    setEditingId(author.id);
    setFileList([]);
    form.setFieldsValue({
      name: author.name,
      biography: author.biography ?? '',
      nationality: author.nationality ?? '',
    });
    setModalOpen(true);
  };

  const submitMutation = useMutation({
    mutationFn: async (values: AuthorFormValues) => {
      const fd = new FormData();
      fd.append('name', values.name);
      if (values.biography) fd.append('biography', values.biography);
      if (values.nationality) fd.append('nationality', values.nationality);
      const file = fileList[0]?.originFileObj;
      if (file) fd.append('avatar', file);
      if (editingId) {
        const res = await api.patch(`/admin/authors/${editingId}`, fd);
        return unwrap(res);
      }
      const res = await api.post('/admin/authors', fd);
      return unwrap(res);
    },
    onSuccess: () => {
      message.success(editingId ? 'Đã cập nhật tác giả' : 'Đã tạo tác giả');
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] });
    },
    onError: (err) =>
      message.error(extractErrorMessage(err, 'Lưu tác giả thất bại')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/authors/${id}`);
    },
    onSuccess: () => {
      message.success('Đã xoá tác giả');
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] });
    },
    onError: (err) =>
      message.error(extractErrorMessage(err, 'Xoá tác giả thất bại')),
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Tác giả"
        subtitle="Danh sách tác giả được đăng bán trên nền tảng."
        trailing={
          <Space wrap style={isMobile ? { width: '100%' } : undefined}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên..."
              style={{ width: isMobile ? '100%' : 280 }}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onPressEnter={() => {
                setPage(1);
                setKeyword(keywordInput);
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              Thêm tác giả
            </Button>
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
            <List<Author>
              loading={listQ.isLoading}
              dataSource={listQ.data?.items ?? []}
              rowKey="id"
              renderItem={(row) => (
                <List.Item
                  style={{ padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}
                  actions={[
                    <Button
                      key="edit"
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => openEdit(row)}
                    />,
                    <Popconfirm
                      key="del"
                      title="Xoá tác giả này?"
                      okText="Xoá"
                      cancelText="Huỷ"
                      onConfirm={() => deleteMutation.mutate(row.id)}
                    >
                      <Button type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      row.avatarUrl ? (
                        <Avatar size={40} src={resolveImageUrl(row.avatarUrl)} />
                      ) : (
                        <Avatar size={40} icon={<UserOutlined />} />
                      )
                    }
                    title={
                      <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                        {row.name}
                      </div>
                    }
                    description={
                      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        {row.nationality ?? '—'}
                        {row.biography ? ` · ${row.biography.slice(0, 60)}${row.biography.length > 60 ? '…' : ''}` : ''}
                      </div>
                    }
                  />
                </List.Item>
              )}
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
        <Table<Author>
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
          scroll={{ x: 700 }}
          columns={[
            {
              title: 'Ảnh',
              dataIndex: 'avatarUrl',
              width: 70,
              render: (url: string | null) =>
                url ? (
                  <Avatar size={40} src={resolveImageUrl(url)} />
                ) : (
                  <Avatar size={40} icon={<UserOutlined />} />
                ),
            },
            { title: 'Tên', dataIndex: 'name' },
            {
              title: 'Quốc tịch',
              dataIndex: 'nationality',
              render: (v: string | null) => v ?? '—',
            },
            {
              title: 'Tiểu sử',
              dataIndex: 'biography',
              ellipsis: true,
              render: (v: string | null) => v ?? '—',
            },
            {
              title: '',
              key: 'actions',
              width: 110,
              render: (_: unknown, row) => (
                <Space>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(row)}
                  />
                  <Popconfirm
                    title="Xoá tác giả này?"
                    okText="Xoá"
                    cancelText="Huỷ"
                    onConfirm={() => deleteMutation.mutate(row.id)}
                  >
                    <Button type="link" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
        )}
      </Card>

      <Modal
        title={editingId ? 'Cập nhật tác giả' : 'Thêm tác giả'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitMutation.isPending}
        okText="Lưu"
        cancelText="Huỷ"
        destroyOnClose
      >
        <Form<AuthorFormValues>
          form={form}
          layout="vertical"
          onFinish={(v) => submitMutation.mutate(v)}
          preserve={false}
        >
          <Form.Item
            name="name"
            label="Tên tác giả"
            rules={[{ required: true, message: 'Nhập tên' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="nationality" label="Quốc tịch">
            <Input />
          </Form.Item>
          <Form.Item name="biography" label="Tiểu sử">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Ảnh đại diện">
            <Upload
              beforeUpload={() => false}
              listType="picture"
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
