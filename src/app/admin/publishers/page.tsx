'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Upload,
} from 'antd';
import { PageHeading } from '@/components/editorial';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image-url';
import type { PageEnvelope } from '@/lib/types';

const PAGE_SIZE = 20;

interface Publisher {
  id: string;
  name: string;
  address: string | null;
  website: string | null;
  logoUrl: string | null;
  createdAt: string;
}

interface PublisherFormValues {
  name: string;
  address?: string;
  website?: string;
}

export default function AdminPublishersPage() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [form] = Form.useForm<PublisherFormValues>();

  const listQ = useQuery({
    queryKey: ['admin-publishers', { keyword, page }],
    queryFn: async () => {
      const res = await api.get('/admin/publishers', {
        params: {
          keyword: keyword || undefined,
          page,
          limit: PAGE_SIZE,
        },
      });
      return unwrap<PageEnvelope<Publisher>>(res);
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setFileList([]);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (p: Publisher) => {
    setEditingId(p.id);
    setFileList([]);
    form.setFieldsValue({
      name: p.name,
      address: p.address ?? '',
      website: p.website ?? '',
    });
    setModalOpen(true);
  };

  const submitMutation = useMutation({
    mutationFn: async (values: PublisherFormValues) => {
      const fd = new FormData();
      fd.append('name', values.name);
      if (values.address) fd.append('address', values.address);
      if (values.website) fd.append('website', values.website);
      const file = fileList[0]?.originFileObj;
      if (file) fd.append('logo', file);
      if (editingId) {
        const res = await api.patch(`/admin/publishers/${editingId}`, fd);
        return unwrap(res);
      }
      const res = await api.post('/admin/publishers', fd);
      return unwrap(res);
    },
    onSuccess: () => {
      message.success(editingId ? 'Đã cập nhật NXB' : 'Đã tạo NXB');
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-publishers'] });
    },
    onError: (err) => message.error(extractErrorMessage(err, 'Lưu NXB thất bại')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/publishers/${id}`);
    },
    onSuccess: () => {
      message.success('Đã xoá NXB');
      queryClient.invalidateQueries({ queryKey: ['admin-publishers'] });
    },
    onError: (err) => message.error(extractErrorMessage(err, 'Xoá NXB thất bại')),
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Nhà xuất bản"
        subtitle="Quản lý thông tin các nhà xuất bản đối tác."
        trailing={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm NXB..."
              style={{ width: 280 }}
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
              Thêm NXB
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
      >
        <Table<Publisher>
          rowKey="id"
          loading={listQ.isLoading}
          dataSource={listQ.data?.items ?? []}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: listQ.data?.total ?? 0,
            showSizeChanger: false,
            onChange: (p) => setPage(p),
          }}
          columns={[
            {
              title: 'Logo',
              dataIndex: 'logoUrl',
              width: 70,
              render: (url: string | null) =>
                url ? (
                  <Avatar size={40} src={resolveImageUrl(url)} shape="square" />
                ) : (
                  <Avatar size={40} icon={<BankOutlined />} shape="square" />
                ),
            },
            { title: 'Tên', dataIndex: 'name' },
            {
              title: 'Địa chỉ',
              dataIndex: 'address',
              render: (v: string | null) => v ?? '—',
            },
            {
              title: 'Website',
              dataIndex: 'website',
              render: (v: string | null) =>
                v ? (
                  <a href={v} target="_blank" rel="noreferrer">
                    {v}
                  </a>
                ) : (
                  '—'
                ),
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
                    title="Xoá NXB này?"
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
      </Card>

      <Modal
        title={editingId ? 'Cập nhật NXB' : 'Thêm NXB'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitMutation.isPending}
        okText="Lưu"
        cancelText="Huỷ"
        destroyOnClose
      >
        <Form<PublisherFormValues>
          form={form}
          layout="vertical"
          onFinish={(v) => submitMutation.mutate(v)}
          preserve={false}
        >
          <Form.Item
            name="name"
            label="Tên NXB"
            rules={[{ required: true, message: 'Nhập tên' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Form.Item name="website" label="Website">
            <Input placeholder="https://" />
          </Form.Item>
          <Form.Item label="Logo">
            <Upload
              beforeUpload={() => false}
              listType="picture"
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Chọn logo</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
