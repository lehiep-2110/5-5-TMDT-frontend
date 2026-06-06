'use client';

import { Button, Form, Input, App as AntdApp } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, type CSSProperties } from 'react';
import { useLogin } from '@/lib/auth-hooks';
import { extractErrorMessage } from '@/lib/api';
import type { UserRole } from '@/lib/types';

interface LoginFormValues {
  email: string;
  password: string;
}

function landingFor(role: UserRole, redirect: string | null): string {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'WAREHOUSE_STAFF') return '/staff/orders';
  return redirect || '/';
}

const headingStyle: CSSProperties = {
  fontFamily: 'var(--font-serif), Georgia, serif',
  fontSize: 'clamp(28px, 7vw, 40px)',
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  color: 'var(--color-ink)',
  margin: 0,
  fontWeight: 700,
};

const subtitleStyle: CSSProperties = {
  color: 'var(--color-muted)',
  fontSize: 15,
  marginTop: 12,
  marginBottom: 32,
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const login = useLogin();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<LoginFormValues>();

  const onFinish = async (values: LoginFormValues) => {
    try {
      const data = await login.mutateAsync(values);
      message.success('Đăng nhập thành công');
      router.push(landingFor(data.user.role, redirect));
    } catch (err) {
      message.error(extractErrorMessage(err, 'Đăng nhập thất bại'));
    }
  };

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        Đăng nhập
      </div>
      <h1 style={headingStyle}>Chào mừng trở lại</h1>
      <p style={subtitleStyle}>
        Tiếp tục hành trình đọc sách của bạn tại The Editorial.
      </p>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: 'var(--color-muted)' }} />}
            placeholder="example@email.com"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: 'var(--color-muted)' }} />}
            placeholder="••••••••"
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 28, marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={login.isPending}
            style={{
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Đăng nhập
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', fontSize: 14 }}>
          <span style={{ color: 'var(--color-muted)' }}>
            Chưa có tài khoản?{' '}
          </span>
          <Link
            href="/register"
            style={{ color: 'var(--color-primary)', fontWeight: 600 }}
          >
            Đăng ký
          </Link>
        </div>
      </Form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
