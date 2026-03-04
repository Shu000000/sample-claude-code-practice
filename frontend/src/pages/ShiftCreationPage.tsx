import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { getShifts, createShift, updateShift, deleteShift, confirmShifts } from '../api/shifts';
import { getEmployees } from '../api/employees';
import type { Shift, User } from '../types';
import { getDaysInMonth, formatDateISO, WEEKDAYS } from '../utils/dateUtils';
import apiClient from '../api/client';

export function ShiftCreationPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [_selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({ employeeId: 0, date: '', startTime: '09:00', endTime: '18:00' });
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, e] = await Promise.all([getShifts({ year, month }), getEmployees()]);
      setShifts(s);
      setEmployees(e);
    } catch { setError('データの取得に失敗しました'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadData(); }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const openAddModal = (date: string) => {
    setSelectedShift(null);
    setSelectedDate(date);
    setFormData({ employeeId: employees[0]?.id || 0, date, startTime: '09:00', endTime: '18:00' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (shift: Shift) => {
    setSelectedShift(shift);
    setFormData({ employeeId: shift.employeeId, date: shift.date, startTime: shift.startTime, endTime: shift.endTime });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.startTime >= formData.endTime) {
      setError('終了時刻は開始時刻より後にしてください');
      return;
    }
    try {
      if (selectedShift) {
        await updateShift(selectedShift.id, formData);
      } else {
        await createShift(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || '保存に失敗しました');
    }
  };

  const handleDelete = async (shift: Shift) => {
    if (!confirm(`${shift.employeeName}のシフトを削除しますか？`)) return;
    try {
      await deleteShift(shift.id);
      loadData();
    } catch { alert('削除に失敗しました'); }
  };

  const handleConfirm = async () => {
    if (!confirm(`${year}年${month}月のシフトを確定しますか？`)) return;
    try {
      const result = await confirmShifts(year, month);
      alert(result.message);
      loadData();
    } catch { alert('確定に失敗しました'); }
  };

  const handleExportCSV = () => {
    const url = `/api/export/csv?year=${year}&month=${month}`;
    window.open(`${apiClient.defaults.baseURL?.replace('/api', '')}${url}`, '_blank');
  };

  const days = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const getShiftsForDate = (dateStr: string) => shifts.filter(s => s.date === dateStr);

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>シフト作成</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleConfirm} style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>シフト確定</button>
          <button onClick={handleExportCSV} style={{ padding: '8px 16px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>CSVエクスポート</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <button onClick={prevMonth} style={{ padding: '8px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}>◀</button>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{year}年{month}月</span>
        <button onClick={nextMonth} style={{ padding: '8px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}>▶</button>
      </div>

      {isLoading ? <p>読み込み中...</p> : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid #eee' }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{
                padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px',
                color: i === 0 ? '#d32f2f' : i === 6 ? '#1565c0' : '#333'
              }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array(firstDayOfWeek).fill(null).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: '100px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee' }} />
            ))}
            {days.map(day => {
              const dateStr = formatDateISO(day);
              const dayShifts = getShiftsForDate(dateStr);
              const dow = day.getDay();
              return (
                <div
                  key={dateStr}
                  onClick={() => openAddModal(dateStr)}
                  style={{
                    minHeight: '100px', padding: '4px',
                    borderRight: '1px solid #eee', borderBottom: '1px solid #eee',
                    cursor: 'pointer', transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                >
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: dow === 0 ? '#d32f2f' : dow === 6 ? '#1565c0' : '#333' }}>
                    {day.getDate()}
                  </div>
                  {dayShifts.map(shift => (
                    <div
                      key={shift.id}
                      onClick={e => { e.stopPropagation(); openEditModal(shift); }}
                      style={{
                        backgroundColor: shift.status === 'confirmed' ? '#e8f5e9' : '#fff3e0',
                        border: `1px solid ${shift.status === 'confirmed' ? '#a5d6a7' : '#ffcc02'}`,
                        borderRadius: '3px', padding: '2px 4px', marginBottom: '2px',
                        fontSize: '11px', cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{shift.employeeName}</div>
                      <div>{shift.startTime}〜{shift.endTime}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', width: '400px' }}>
            <h3 style={{ marginBottom: '24px' }}>{selectedShift ? 'シフト編集' : 'シフト追加'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>日付</label>
                <input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>従業員</label>
                <select value={formData.employeeId} onChange={e => setFormData(f => ({ ...f, employeeId: Number(e.target.value) }))} required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="">選択してください</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              {['startTime', 'endTime'].map((key, i) => (
                <div key={key} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{i === 0 ? '開始時刻' : '終了時刻'}</label>
                  <input type="time" value={formData[key as 'startTime' | 'endTime']}
                    onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))} required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
                </div>
              ))}
              {error && <p style={{ color: '#d32f2f', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                {selectedShift && (
                  <button type="button" onClick={() => { handleDelete(selectedShift); setIsModalOpen(false); }} style={{
                    padding: '8px 16px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                  }}>削除</button>
                )}
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>キャンセル</button>
                  <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>保存</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
