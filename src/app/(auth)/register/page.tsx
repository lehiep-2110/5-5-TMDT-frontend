'use client';

import {
  Button,
  Form,
  Input,
  Result,
  Typography,
  App as AntdApp,
} from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { useRegister, useResendVerification } from '@/lib/auth-hooks';
import { extractErrorMessage } from '@/lib/api';

const { Text, Paragraph } = Typography;

interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

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

export default function RegisterPage() {
  const register = useRegister();
  const resend = useResendVerification();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<RegisterFormValues>();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const onFinish = async (values: RegisterFormValues) => {
    try {
      await register.mutateAsync(values);
      setRegisteredEmail(values.email);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Đăng ký thất bại'));
    }
  };

  const onResend = async () => {
    if (!registeredEmail) return;
    try {
      await resend.mutateAsync(registeredEmail);
      message.success('Đã gửi lại email xác thực');
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể gửi lại email'));
    }
  };

  if (registeredEmail) {
    return (
      <Result
        status="success"
        title="Đăng ký thành công"
        subTitle={
          <>
            <Paragraph>
              Vui lòng kiểm tra email <Text strong>{registeredEmail}</Text>{' '}
              để xác thực tài khoản.
            </Paragraph>
            <Paragraph type="warning" style={{ marginBottom: 0 }}>
              Lưu ý: email được log ở console backend. Copy link từ log backend
              vào trình duyệt để xác thực.
            </Paragraph>
          </>
        }
        extra={[
          <Button key="resend" onClick={onResend} loading={resend.isPending}>
            Gửi lại email
          </Button>,
          <Link key="login" href="/login">
            <Button type="primary">Về trang đăng nhập</Button>
          </Link>,
        ]}
      />
    );
  }

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        Đăng ký
      </div>
      <h1 style={headingStyle}>Gia nhập The Editorial</h1>
      <p style={subtitleStyle}>
        Mở tài khoản để lưu danh sách đọc, đặt sách và nhận tin tức biên tập.
      </p>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
      >
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[
            { required: true, message: 'Vui lòng nhập họ và tên' },
            { min: 2, message: 'Tối thiểu 2 ký tự' },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: 'var(--color-muted)' }} />}
            placeholder="Nguyễn Văn A"
            size="large"
          />
        </Form.Item>

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
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu' },
            {
              pattern: passwordPattern,
              message: 'Ít nhất 8 ký tự, bao gồm chữ và số',
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: 'var(--color-muted)' }} />}
            placeholder="••••••••"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Nhập lại mật khẩu"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Vui lòng nhập lại mật khẩu' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu không trùng khớp'));
              },
            }),
          ]}
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
            loading={register.isPending}
            style={{
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Tạo tài khoản
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', fontSize: 14 }}>
          <span style={{ color: 'var(--color-muted)' }}>
            Đã có tài khoản?{' '}
          </span>
          <Link
            href="/login"
            style={{ color: 'var(--color-primary)', fontWeight: 600 }}
          >
            Đăng nhập
          </Link>
        </div>
      </Form>
    </div>
  );
}
