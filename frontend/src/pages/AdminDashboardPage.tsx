import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getShifts } from '../api/shifts';
import { getEmployees } from '../api/employees';
import type { Shift } from '../types';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [unconfirmedCount, setUnconfirmedCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [recentShifts, setRecentShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    Promise.all([
      getShifts({ year, month }),
      getEmployees()
    ]).then(([shifts, employees]) => {
      setConfirmedCount(shifts.filter(s => s.status === 'confirmed').length);
      setUnconfirmedCount(shifts.filter(s => s.status === 'unconfirmed').length);
      setEmployeeCount(employees.length);

      const today = new Date();
      const weekLater = new Date(today);
      weekLater.setDate(weekLater.getDate() + 7);
      const recent = shifts
        .filter(s => {
          const d = new Date(s.date);
          return d >= today && d <= weekLater;
        })
        .slice(0, 10);
      setRecentShifts(recent);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <Layout><div>読み込み中...</div></Layout>;
  }

  return (
    <Layout>
      <h2 style={{ marginBottom: '24px' }}>管理者ダッシュボード</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: '確定済みシフト', value: confirmedCount, unit: '件', color: '#4caf50' },
          { label: '未確定シフト', value: unconfirmedCount, unit: '件', color: '#ff9800' },
          { label: '従業員数', value: employeeCount, unit: '名', color: '#1976d2' },
        ].map((card) => (
          <div key={card.label} style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${card.color}`
          }}>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>{card.label}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: card.color }}>
              {card.value}<span style={{ fontSize: '16px' }}>{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '16px' }}>直近のシフト（今週）</h3>
          {recentShifts.length === 0 ? (
            <p style={{ color: '#666' }}>今週のシフトはありません</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  {['日付', '従業員', '開始時刻', '終了時刻', '状態'].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '14px', color: '#666' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentShifts.map(shift => (
                  <tr key={shift.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{shift.date}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{shift.employeeName}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{shift.startTime}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{shift.endTime}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        backgroundColor: shift.status === 'confirmed' ? '#e8f5e9' : '#fff3e0',
                        color: shift.status === 'confirmed' ? '#2e7d32' : '#e65100',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {shift.status === 'confirmed' ? '確定済み' : '未確定'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '16px' }}>クイックアクション</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '新規シフト作成', path: '/admin/shifts' },
              { label: '従業員追加', path: '/admin/employees' },
              { label: '希望シフト確認', path: '/admin/shift-requests' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                style={{
                  padding: '10px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
