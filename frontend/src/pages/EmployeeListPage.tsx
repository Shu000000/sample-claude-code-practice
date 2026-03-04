import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/employees';
import type { User, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types';

export function EmployeeListPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' as 'admin' | 'employee' });

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch {
      setError('従業員一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);

  const openAddModal = () => {
    setSelectedEmployee(null);
    setFormData({ name: '', email: '', password: '', role: 'employee' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: User) => {
    setSelectedEmployee(emp);
    setFormData({ name: emp.name, email: emp.email, password: '', role: emp.role });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (selectedEmployee) {
        const req: UpdateEmployeeRequest = { name: formData.name, email: formData.email, role: formData.role };
        await updateEmployee(selectedEmployee.id, req);
      } else {
        const req: CreateEmployeeRequest = { ...formData };
        await createEmployee(req);
      }
      setIsModalOpen(false);
      loadEmployees();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || '保存に失敗しました');
    }
  };

  const handleDelete = async (emp: User) => {
    if (!confirm(`${emp.name}を削除しますか？`)) return;
    try {
      await deleteEmployee(emp.id);
      loadEmployees();
    } catch {
      alert('削除に失敗しました');
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>従業員一覧</h2>
        <button onClick={openAddModal} style={{
          backgroundColor: '#1976d2', color: 'white', border: 'none',
          padding: '10px 20px', borderRadius: '4px', cursor: 'pointer'
        }}>
          + 従業員を追加
        </button>
      </div>

      {isLoading ? <p>読み込み中...</p> : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                {['名前', 'メールアドレス', '役割', '操作'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 16px' }}>{emp.name}</td>
                  <td style={{ padding: '12px 16px', color: '#666' }}>{emp.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      backgroundColor: emp.role === 'admin' ? '#e3f2fd' : '#e8f5e9',
                      color: emp.role === 'admin' ? '#1565c0' : '#2e7d32',
                      padding: '2px 10px', borderRadius: '12px', fontSize: '13px'
                    }}>
                      {emp.role === 'admin' ? '管理者' : '従業員'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => openEditModal(emp)} style={{
                      marginRight: '8px', padding: '4px 12px', backgroundColor: '#fff',
                      border: '1px solid #1976d2', color: '#1976d2', borderRadius: '4px', cursor: 'pointer'
                    }}>編集</button>
                    <button onClick={() => handleDelete(emp)} style={{
                      padding: '4px 12px', backgroundColor: '#fff',
                      border: '1px solid #d32f2f', color: '#d32f2f', borderRadius: '4px', cursor: 'pointer'
                    }}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', width: '400px' }}>
            <h3 style={{ marginBottom: '24px' }}>{selectedEmployee ? '従業員編集' : '従業員追加'}</h3>
            <form onSubmit={handleSubmit}>
              {['名前', 'メールアドレス'].map((label, i) => {
                const key = i === 0 ? 'name' : 'email';
                return (
                  <div key={label} style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{label}</label>
                    <input
                      type={i === 1 ? 'email' : 'text'}
                      value={formData[key as 'name' | 'email']}
                      onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                );
              })}
              {!selectedEmployee && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>パスワード</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                    required minLength={8}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              )}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>役割</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData(f => ({ ...f, role: e.target.value as 'admin' | 'employee' }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="employee">従業員</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              {error && <p style={{ color: '#d32f2f', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{
                  padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer'
                }}>キャンセル</button>
                <button type="submit" style={{
                  padding: '8px 16px', backgroundColor: '#1976d2', color: 'white',
                  border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}>保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
