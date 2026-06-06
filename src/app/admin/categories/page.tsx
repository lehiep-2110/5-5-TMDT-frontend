'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  TreeSelect,
} from 'antd';
import { PageHeading } from '@/components/editorial';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { useResponsive } from '@/lib/use-responsive';

interface CategoryFlat {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

interface CategoryFormValues {
  name: string;
  parentId?: string | null;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive: boolean;
}

interface TreeNode {
  value: string;
  title: string;
  children?: TreeNode[];
}

function buildDescendantMap(
  items: CategoryFlat[],
): Map<string, Set<string>> {
  const byParent = new Map<string, string[]>();
  for (const i of items) {
    if (i.parentId) {
      if (!byParent.has(i.parentId)) byParent.set(i.parentId, []);
      byParent.get(i.parentId)!.push(i.id);
    }
  }
  const result = new Map<string, Set<string>>();
  for (const i of items) {
    const set = new Set<string>();
    const stack = [i.id];
    while (stack.length) {
      const cur = stack.pop()!;
      set.add(cur);
      const kids = byParent.get(cur) ?? [];
      for (const k of kids) stack.push(k);
    }
    result.set(i.id, set);
  }
  return result;
}

function toTree(
  items: CategoryFlat[],
  exclude?: Set<string>,
): TreeNode[] {
  const byParent = new Map<string | null, CategoryFlat[]>();
  for (const i of items) {
    if (exclude && exclude.has(i.id)) continue;
    const p = i.parentId ?? null;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(i);
  }
  const build = (parentId: string | null): TreeNode[] => {
    const kids = byParent.get(parentId) ?? [];
    return kids
      .sort(
        (a, b) =>
          a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, 'vi'),
      )
      .map((k) => {
        const children = build(k.id);
        return {
          value: k.id,
          title: k.name,
          children: children.length ? children : undefined,
        };
      });
  };
  return build(null);
}

export default function AdminCategoriesPage() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsive();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<CategoryFormValues>();

  const listQ = useQuery({
    queryKey: ['admin-categories-flat'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return unwrap<CategoryFlat[]>(res);
    },
  });

  const items = listQ.data ?? [];
  const byId = useMemo(() => {
    const m = new Map<string, CategoryFlat>();
    for (const i of items) m.set(i.id, i);
    return m;
  }, [items]);

  const descendantsByNode = useMemo(() => buildDescendantMap(items), [items]);

  const excludeSet = editingId
    ? descendantsByNode.get(editingId) ?? new Set<string>()
    : undefined;

  const treeData = useMemo(
    () => toTree(items, excludeSet),
    [items, excludeSet],
  );

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      displayOrder: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (c: CategoryFlat) => {
    setEditingId(c.id);
    form.setFieldsValue({
      name: c.name,
      parentId: c.parentId ?? null,
      description: c.description ?? '',
      imageUrl: c.imageUrl ?? '',
      displayOrder: c.displayOrder,
      isActive: c.isActive,
    });
    setModalOpen(true);
  };

  const submitMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const payload = {
        name: values.name,
        parentId: values.parentId || undefined,
        description: values.description || undefined,
        imageUrl: values.imageUrl || undefined,
        displayOrder: values.displayOrder ?? 0,
        isActive: values.isActive,
      };
      if (editingId) {
        const res = await api.patch(`/admin/categories/${editingId}`, payload);
        return unwrap(res);
      }
      const res = await api.post('/admin/categories', payload);
      return unwrap(res);
    },
    onSuccess: () => {
      message.success(editingId ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-categories-flat'] });
    },
    onError: (err) =>
      message.error(extractErrorMessage(err, 'Lưu danh mục thất bại')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/categories/${id}`);
    },
    onSuccess: () => {
      message.success('Đã xoá danh mục');
      queryClient.invalidateQueries({ queryKey: ['admin-categories-flat'] });
    },
    onError: (err) =>
      message.error(extractErrorMessage(err, 'Xoá danh mục thất bại')),
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Danh mục"
        subtitle="Cây danh mục sản phẩm được hiển thị trên nền tảng."
        trailing={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            Thêm danh mục
          </Button>
        }
      />
      <Card
        style={{
          border: '1px solid var(--color-divider)',
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(26,26,26,0.03)',
        }}
      >
        <Table<CategoryFlat>
          rowKey="id"
          loading={listQ.isLoading}
          dataSource={items}
          pagination={false}
          scroll={{ x: 720 }}
          columns={[
            { title: 'Tên', dataIndex: 'name' },
            { title: 'Slug', dataIndex: 'slug' },
            {
              title: 'Danh mục cha',
              dataIndex: 'parentId',
              render: (v: string | null) =>
                v ? byId.get(v)?.name ?? '—' : '—',
            },
            {
              title: 'Thứ tự',
              dataIndex: 'displayOrder',
              align: 'right',
              width: 90,
            },
            {
              title: 'Trạng thái',
              dataIndex: 'isActive',
              width: 110,
              render: (v: boolean) =>
                v ? (
                  <Tag color="green">Hiển thị</Tag>
                ) : (
                  <Tag color="default">Ẩn</Tag>
                ),
            },
            {
              title: '',
              key: 'actions',
              width: 120,
              render: (_: unknown, row) => (
                <Space>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(row)}
                  />
                  <Popconfirm
                    title="Xoá danh mục này?"
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
        title={editingId ? 'Cập nhật danh mục' : 'Thêm danh mục'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitMutation.isPending}
        okText="Lưu"
        cancelText="Huỷ"
        destroyOnClose
      >
        <Form<CategoryFormValues>
          form={form}
          layout="vertical"
          onFinish={(v) => submitMutation.mutate(v)}
          preserve={false}
        >
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: 'Nhập tên' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="parentId" label="Danh mục cha">
            <TreeSelect
              allowClear
              placeholder="(Không có)"
              treeData={treeData}
              treeDefaultExpandAll
              showSearch
              treeNodeFilterProp="title"
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="imageUrl" label="URL ảnh">
            <Input placeholder="https://..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <Form.Item
              name="displayOrder"
              label="Thứ tự"
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="isActive"
              label="Hiển thị"
              valuePropName="checked"
              style={{ flex: 1 }}
            >
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
