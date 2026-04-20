'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  TreeSelect,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { BookCover } from '@/components/book-cover';
import { formatVnd } from '@/lib/format';
import { PageHeading } from '@/components/editorial';
import type {
  BookDetail,
  BookListItem,
  BookStatus,
  PageEnvelope,
} from '@/lib/types';

interface AuthorOption {
  id: string;
  name: string;
}
interface PublisherOption {
  id: string;
  name: string;
}
interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: CategoryNode[];
}

type BookStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const PAGE_SIZE = 10;

interface BookFormValues {
  title: string;
  isbn: string;
  publisherId: string;
  categoryId: string;
  language?: string;
  yearPublished?: number | null;
  price: number;
  discountPrice?: number | null;
  discountEndDate?: dayjs.Dayjs | null;
  stockQuantity: number;
  pages?: number | null;
  dimensions?: string | null;
  weight?: number | null;
  status: BookStatus;
  authorIds: string[];
  description?: string;
  primaryImageIndex?: number;
}

interface CatTreeNode {
  value: string;
  title: string;
  children?: CatTreeNode[];
}

function toTreeData(nodes: CategoryNode[]): CatTreeNode[] {
  return nodes.map((n) => ({
    value: n.id,
    title: n.name,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));
}

export default function AdminBooksPage() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<BookStatusFilter>('ALL');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [form] = Form.useForm<BookFormValues>();

  const listQ = useQuery({
    queryKey: ['admin-books', { keyword, status, page }],
    queryFn: async () => {
      const res = await api.get('/admin/books', {
        params: {
          keyword: keyword || undefined,
          status: status === 'ALL' ? undefined : status,
          page,
          limit: PAGE_SIZE,
        },
      });
      return unwrap<PageEnvelope<BookListItem>>(res);
    },
  });

  const authorsQ = useQuery({
    queryKey: ['admin-authors-all'],
    queryFn: async () => {
      const res = await api.get('/admin/authors', { params: { limit: 100 } });
      return unwrap<PageEnvelope<AuthorOption>>(res);
    },
    enabled: modalOpen,
  });

  const publishersQ = useQuery({
    queryKey: ['admin-publishers-all'],
    queryFn: async () => {
      const res = await api.get('/admin/publishers', {
        params: { limit: 100 },
      });
      return unwrap<PageEnvelope<PublisherOption>>(res);
    },
    enabled: modalOpen,
  });

  const categoriesQ = useQuery({
    queryKey: ['admin-categories-tree'],
    queryFn: async () => {
      const res = await api.get('/admin/categories/tree');
      return unwrap<CategoryNode[]>(res);
    },
    enabled: modalOpen,
  });

  const openCreate = () => {
    setEditingId(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({
      language: 'Tieng Viet',
      status: 'ACTIVE',
      stockQuantity: 0,
      primaryImageIndex: 0,
    });
    setModalOpen(true);
  };

  const openEdit = async (id: string) => {
    setEditingId(id);
    setFileList([]);
    setModalOpen(true);
    try {
      const res = await api.get(`/admin/books/${id}`);
      const b = unwrap<BookDetail>(res);
      form.setFieldsValue({
        title: b.title,
        isbn: b.isbn,
        publisherId: b.publisher?.id ?? '',
        categoryId: b.category?.id ?? '',
        language: b.language,
        yearPublished: b.yearPublished ?? null,
        price: Number(b.price),
        discountPrice: b.discountPrice ? Number(b.discountPrice) : null,
        discountEndDate: b.discountEndDate ? dayjs(b.discountEndDate) : null,
        stockQuantity: b.stockQuantity,
        pages: b.pages ?? null,
        dimensions: b.dimensions ?? null,
        weight: b.weight ? Number(b.weight) : null,
        status: b.status,
        authorIds: b.authorIds,
        description: b.description ?? '',
        primaryImageIndex: 0,
      });
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không tải được sách'));
      setModalOpen(false);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('isbn', values.isbn);
      fd.append('publisherId', values.publisherId);
      fd.append('categoryId', values.categoryId);
      if (values.language) fd.append('language', values.language);
      if (values.yearPublished !== null && values.yearPublished !== undefined)
        fd.append('yearPublished', String(values.yearPublished));
      fd.append('price', String(values.price));
      if (
        values.discountPrice !== null &&
        values.discountPrice !== undefined &&
        values.discountPrice !== 0
      ) {
        fd.append('discountPrice', String(values.discountPrice));
      }
      if (values.discountEndDate) {
        fd.append(
          'discountEndDate',
          values.discountEndDate.toISOString(),
        );
      }
      fd.append('stockQuantity', String(values.stockQuantity));
      if (values.pages !== null && values.pages !== undefined)
        fd.append('pages', String(values.pages));
      if (values.dimensions) fd.append('dimensions', values.dimensions);
      if (values.weight !== null && values.weight !== undefined)
        fd.append('weight', String(values.weight));
      fd.append('status', values.status);
      fd.append('authorIds', JSON.stringify(values.authorIds));
      if (values.description) fd.append('description', values.description);
      if (values.primaryImageIndex !== undefined)
        fd.append('primaryImageIndex', String(values.primaryImageIndex));

      // Append file uploads.
      for (const f of fileList) {
        if (f.originFileObj) fd.append('images', f.originFileObj);
      }

      if (editingId) {
        const res = await api.patch(`/admin/books/${editingId}`, fd);
        return unwrap(res);
      }
      const res = await api.post('/admin/books', fd);
      return unwrap(res);
    },
    onSuccess: () => {
      message.success(editingId ? 'Đã cập nhật sách' : 'Đã tạo sách');
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Lưu sách thất bại'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/books/${id}`);
      return res.data;
    },
    onSuccess: () => {
      message.success('Đã ẩn sách');
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Ẩn sách thất bại'));
    },
  });

  const treeData = useMemo(
    () => (categoriesQ.data ? toTreeData(categoriesQ.data) : []),
    [categoriesQ.data],
  );

  useEffect(() => {
    // Reset to page 1 when filters change.
    setPage(1);
  }, [keyword, status]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Quản lý Sách & Ấn phẩm"
        subtitle="Duyệt, cập nhật và bổ sung tựa sách cho cửa hàng."
        trailing={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên/ISBN/tác giả..."
              style={{ width: 280 }}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onPressEnter={() => setKeyword(keywordInput)}
            />
            <Select<BookStatusFilter>
              value={status}
              style={{ width: 140 }}
              onChange={setStatus}
              options={[
                { value: 'ALL', label: 'Tất cả' },
                { value: 'ACTIVE', label: 'Đang bán' },
                { value: 'INACTIVE', label: 'Đã ẩn' },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              Thêm sách mới
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
        <Table<BookListItem>
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
          scroll={{ x: 1100 }}
          columns={[
            {
              title: 'Ảnh',
              dataIndex: 'primaryImage',
              width: 70,
              render: (v: string | null, row) => (
                <BookCover
                  src={v}
                  alt={row.title}
                  width={48}
                  height={64}
                  borderRadius={4}
                />
              ),
            },
            {
              title: 'Tên sách',
              dataIndex: 'title',
              render: (t: string) => <strong>{t}</strong>,
            },
            { title: 'ISBN', dataIndex: 'isbn', width: 140 },
            {
              title: 'Danh mục',
              key: 'category',
              width: 140,
              render: (_: unknown, row) => row.category?.name ?? '—',
            },
            {
              title: 'NXB',
              key: 'publisher',
              width: 140,
              render: (_: unknown, row) => row.publisher?.name ?? '—',
            },
            {
              title: 'Tác giả',
              key: 'authors',
              render: (_: unknown, row) =>
                row.authors.map((a) => a.name).join(', ') || '—',
            },
            {
              title: 'Giá',
              dataIndex: 'price',
              align: 'right',
              width: 120,
              render: (p: string) => formatVnd(p),
            },
            {
              title: 'Tồn',
              dataIndex: 'stockQuantity',
              align: 'right',
              width: 80,
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 110,
              render: (s: BookStatus) =>
                s === 'ACTIVE' ? (
                  <Tag color="green">Đang bán</Tag>
                ) : (
                  <Tag color="red">Đã ẩn</Tag>
                ),
            },
            {
              title: '',
              key: 'actions',
              width: 120,
              fixed: 'right',
              render: (_: unknown, row) => (
                <Space>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(row.id)}
                  />
                  <Popconfirm
                    title="Ẩn sách này?"
                    description="BE sẽ chuyển trạng thái INACTIVE."
                    okText="Ẩn"
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
        title={editingId ? 'Cập nhật sách' : 'Thêm sách mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitMutation.isPending}
        okText="Lưu"
        cancelText="Huỷ"
        width={800}
        destroyOnClose
      >
        <Form<BookFormValues>
          form={form}
          layout="vertical"
          onFinish={(v) => submitMutation.mutate(v)}
          preserve={false}
        >
          <Form.Item
            name="title"
            label="Tên sách"
            rules={[{ required: true, message: 'Nhập tên sách' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="isbn"
            label="ISBN (13 chữ số)"
            rules={[
              { required: true, message: 'Nhập ISBN' },
              { pattern: /^\d{13}$/, message: 'ISBN phải gồm 13 chữ số' },
            ]}
          >
            <Input />
          </Form.Item>
          <Space.Compact block>
            <Form.Item
              name="publisherId"
              label="Nhà xuất bản"
              rules={[{ required: true, message: 'Chọn NXB' }]}
              style={{ flex: 1, marginRight: 8 }}
            >
              <Select
                placeholder="Chọn NXB"
                loading={publishersQ.isLoading}
                options={(publishersQ.data?.items ?? []).map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item
              name="categoryId"
              label="Danh mục"
              rules={[{ required: true, message: 'Chọn danh mục' }]}
              style={{ flex: 1 }}
            >
              <TreeSelect
                placeholder="Chọn danh mục"
                treeData={treeData}
                treeDefaultExpandAll
                showSearch
                treeNodeFilterProp="title"
              />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item
              name="language"
              label="Ngôn ngữ"
              style={{ flex: 1, marginRight: 8 }}
            >
              <Input placeholder="Tieng Viet" />
            </Form.Item>
            <Form.Item
              name="yearPublished"
              label="Năm xuất bản"
              style={{ flex: 1 }}
            >
              <InputNumber
                min={1000}
                max={3000}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item
              name="price"
              label="Giá (₫)"
              rules={[{ required: true, message: 'Nhập giá' }]}
              style={{ flex: 1, marginRight: 8 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="discountPrice"
              label="Giá giảm"
              style={{ flex: 1, marginRight: 8 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="discountEndDate"
              label="Hết hạn giảm"
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item
              name="stockQuantity"
              label="Tồn kho"
              rules={[{ required: true, message: 'Nhập tồn' }]}
              style={{ flex: 1, marginRight: 8 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="pages"
              label="Số trang"
              style={{ flex: 1, marginRight: 8 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="dimensions"
              label="Kích thước"
              style={{ flex: 1, marginRight: 8 }}
            >
              <Input placeholder="vd: 14x20cm" />
            </Form.Item>
            <Form.Item
              name="weight"
              label="Trọng lượng (g)"
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true }]}
              style={{ flex: 1, marginRight: 8 }}
            >
              <Select
                options={[
                  { value: 'ACTIVE', label: 'Đang bán' },
                  { value: 'INACTIVE', label: 'Đã ẩn' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="primaryImageIndex"
              label="Ảnh bìa (index)"
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item
            name="authorIds"
            label="Tác giả"
            rules={[{ required: true, message: 'Chọn ít nhất 1 tác giả' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn tác giả"
              loading={authorsQ.isLoading}
              options={(authorsQ.data?.items ?? []).map((a) => ({
                value: a.id,
                label: a.name,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Ảnh bìa (tối đa 5)">
            <Upload
              beforeUpload={() => false}
              listType="picture"
              multiple
              maxCount={5}
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
