import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AuthProvider } from '../contexts/AuthContext';
import React from 'react';

// apiのモック
vi.mock('../api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  getMe: vi.fn(),
}));

// react-router-domのuseNavigateをモック
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import * as authApi from '../api/auth';

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // UNIT-FE-LOGIN-01: レンダリング確認
  test('ログインフォームが正しくレンダリングされる', () => {
    renderLoginPage();

    expect(screen.getByPlaceholderText('メールアドレス')).toBeTruthy();
    expect(screen.getByPlaceholderText('パスワード')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeTruthy();
  });

  // UNIT-FE-LOGIN-02: email空でエラー表示
  test('emailが空のままログインするとエラーが表示される', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(screen.getByText('メールアドレスを入力してください')).toBeTruthy();
    });
  });

  // UNIT-FE-LOGIN-02: パスワード空でエラー表示
  test('パスワードが空のままログインするとエラーが表示される', async () => {
    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(screen.getByText('パスワードを入力してください')).toBeTruthy();
    });
  });

  // ログイン成功: 管理者はダッシュボードへ遷移
  test('管理者ログイン成功時は管理者ダッシュボードへ遷移する', async () => {
    const mockLogin = vi.mocked(authApi.login);
    mockLogin.mockResolvedValue({
      token: 'test-token',
      user: { id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin', createdAt: '' },
    });

    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('パスワード'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  // ログイン成功: 従業員はシフト確認へ遷移
  test('従業員ログイン成功時はシフト確認画面へ遷移する', async () => {
    const mockLogin = vi.mocked(authApi.login);
    mockLogin.mockResolvedValue({
      token: 'test-token',
      user: { id: 2, name: 'Employee', email: 'emp@example.com', role: 'employee', createdAt: '' },
    });

    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
      target: { value: 'emp@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('パスワード'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/shifts');
    });
  });

  // ログイン失敗: APIエラー時にエラーメッセージ表示
  test('ログイン失敗時はエラーメッセージが表示される', async () => {
    const mockLogin = vi.mocked(authApi.login);
    mockLogin.mockRejectedValue(new Error('Unauthorized'));

    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('パスワード'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(screen.getByText('メールアドレスまたはパスワードが正しくありません')).toBeTruthy();
    });
  });
});
