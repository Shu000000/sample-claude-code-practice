import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import React from 'react';

vi.mock('../api/auth', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

// テスト用コンポーネント
function TestComponent() {
  const { user, token, isLoading, login, logout, isAdmin } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'null'}</div>
      <div data-testid="token">{token ?? 'null'}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="isAdmin">{isAdmin().toString()}</div>
      <button
        onClick={() =>
          login('test-token', {
            id: 1,
            name: 'Alice',
            email: 'alice@example.com',
            role: 'employee',
            createdAt: '',
          })
        }
      >
        ログイン
      </button>
      <button onClick={logout}>ログアウト</button>
    </div>
  );
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // UNIT-FE-AUTH-01: 初期状態確認
  test('初期状態ではユーザーがnullでisLoadingがfalseになる', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
  });

  // UNIT-FE-AUTH-01: ログイン後にユーザー情報が保存される
  test('ログイン後にユーザー情報が状態とlocalStorageに保存される', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByText('ログイン'));

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Alice');
      expect(screen.getByTestId('token').textContent).toBe('test-token');
    });

    expect(localStorage.getItem('token')).toBe('test-token');
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toMatchObject({
      name: 'Alice',
    });
  });

  // UNIT-FE-AUTH-01: ログアウト後にユーザー情報がクリアされる
  test('ログアウト後にユーザー情報がクリアされlocalStorageのトークンが削除される', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // まずログイン
    fireEvent.click(screen.getByText('ログイン'));
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Alice');
    });

    // ログアウト
    fireEvent.click(screen.getByText('ログアウト'));

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  // localStorageにトークンがある場合は自動ログイン
  test('ページリロード時にlocalStorageからユーザー情報を復元する', async () => {
    localStorage.setItem('token', 'stored-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 2,
        name: 'Bob',
        email: 'bob@example.com',
        role: 'admin',
        createdAt: '',
      })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('Bob');
    expect(screen.getByTestId('token').textContent).toBe('stored-token');
  });

  // isAdmin: adminロールの場合はtrueを返す
  test('管理者ユーザーの場合はisAdmin()がtrueを返す', async () => {
    localStorage.setItem('token', 'stored-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: '',
      })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAdmin').textContent).toBe('true');
    });
  });
});
