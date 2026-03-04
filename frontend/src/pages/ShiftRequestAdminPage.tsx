import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { getShiftRequests } from '../api/shiftRequests';
import { getEmployees } from '../api/employees';
import type { ShiftRequest, User, Availability } from '../types';

const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: '希望あり',
  unavailable: '不可',
  negotiable: '相談可',
};
const AVAILABILITY_COLORS: Record<Availability, { bg: string; text: string }> = {
  available: { bg: '#e8f5e9', text: '#2e7d32' },
  unavailable: { bg: '#ffebee', text: '#c62828' },
  negotiable: { bg: '#fff8e1', text: '#f57f17' },
};
const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function ShiftRequestAdminPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getEmployees().then(setEmployees).catch(console.error);
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const params: { year: number; month: number; employee_id?: number } = { year, month };
      if (selectedEmployeeId) params.employee_id = selectedEmployeeId;
      const data = await getShiftRequests(params);
      setRequests(data);
    } catch { console.error('希望シフトの取得に失敗しました'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadRequests(); }, [year, month, selectedEmployeeId]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  return (
    <Layout>
      <h2 style={{ marginBottom: '16px' }}>希望シフト確認</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={prevMonth} style={{ padding: '8px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}>◀</button>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{year}年{month}月</span>
        <button onClick={nextMonth} style={{ padding: '8px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}>▶</button>
        <select
          value={selectedEmployeeId || ''}
          onChange={e => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : null)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '150px' }}
        >
          <option value="">全員</option>
          {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>
      </div>

      {isLoading ? <p>読み込み中...</p> : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {requests.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
              {year}年{month}月の希望シフトはまだ提出されていません
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {['従業員名', '日付', '可否', '希望時間', '備考'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', color: '#666', fontWeight: 'bold' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const date = new Date(req.date);
                  const dow = WEEKDAY_LABELS[date.getDay()];
                  const timeRange = req.preferredStart && req.preferredEnd
                    ? `${req.preferredStart}〜${req.preferredEnd}`
                    : '-';
                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px 16px' }}>{req.employeeName}</td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {`${date.getMonth() + 1}/${date.getDate()} (${dow})`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          backgroundColor: AVAILABILITY_COLORS[req.availability].bg,
                          color: AVAILABILITY_COLORS[req.availability].text,
                          padding: '2px 8px', borderRadius: '12px', fontSize: '13px'
                        }}>
                          {AVAILABILITY_LABELS[req.availability]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#666', fontSize: '14px' }}>{timeRange}</td>
                      <td style={{ padding: '12px 16px', color: '#666', fontSize: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.note || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Layout>
  );
}
