import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { getMyShifts } from '../api/shifts';
import type { Shift } from '../types';
import { getDaysInMonth, formatDateISO, WEEKDAYS, calcWorkHours } from '../utils/dateUtils';

export function ShiftConfirmPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      const data = await getMyShifts({ year, month });
      setShifts(data);
    } catch { console.error('シフトの取得に失敗しました'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadShifts(); }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const confirmedShifts = shifts.filter(s => s.status === 'confirmed');
  const workingDays = confirmedShifts.length;
  const totalHours = confirmedShifts.reduce((sum, s) => sum + calcWorkHours(s.startTime, s.endTime), 0);

  const days = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const getShiftForDate = (dateStr: string) => shifts.find(s => s.date === dateStr);

  return (
    <Layout>
      <h2 style={{ marginBottom: '16px' }}>シフト確認</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <button onClick={prevMonth} style={{ padding: '8px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}>◀</button>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{year}年{month}月</span>
        <button onClick={nextMonth} style={{ padding: '8px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}>▶</button>
      </div>

      {isLoading ? <p>読み込み中...</p> : (
        <>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid #eee' }}>
              {WEEKDAYS.map((d, i) => (
                <div key={d} style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: i === 0 ? '#d32f2f' : i === 6 ? '#1565c0' : '#333' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {Array(firstDayOfWeek).fill(null).map((_, i) => (
                <div key={`e-${i}`} style={{ minHeight: '80px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee' }} />
              ))}
              {days.map(day => {
                const dateStr = formatDateISO(day);
                const shift = getShiftForDate(dateStr);
                const dow = day.getDay();
                return (
                  <div key={dateStr} style={{
                    minHeight: '80px', padding: '4px',
                    borderRight: '1px solid #eee', borderBottom: '1px solid #eee',
                    backgroundColor: shift ? '#f1f8e9' : 'white'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: dow === 0 ? '#d32f2f' : dow === 6 ? '#1565c0' : '#333' }}>
                      {day.getDate()}
                    </div>
                    {shift && (
                      <div style={{ fontSize: '12px', color: shift.status === 'confirmed' ? '#2e7d32' : '#e65100' }}>
                        <div>{shift.startTime}</div>
                        <div>〜{shift.endTime}</div>
                        {shift.status === 'unconfirmed' && (
                          <span style={{ fontSize: '10px', backgroundColor: '#fff3e0', color: '#e65100', padding: '1px 4px', borderRadius: '2px' }}>確定待ち</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', display: 'flex', gap: '32px' }}>
            <div>
              <span style={{ color: '#666', fontSize: '14px' }}>今月の勤務日数: </span>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{workingDays}日</span>
            </div>
            <div>
              <span style={{ color: '#666', fontSize: '14px' }}>合計勤務時間: </span>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{totalHours.toFixed(1)}時間</span>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
