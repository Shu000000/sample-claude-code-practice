import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { getMyShiftRequests, createShiftRequest, updateShiftRequest } from '../api/shiftRequests';
import type { ShiftRequest, Availability } from '../types';
import { getDaysInMonth, formatDateISO, WEEKDAYS } from '../utils/dateUtils';

const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: '○',
  unavailable: '×',
  negotiable: '△',
};
const AVAILABILITY_COLORS: Record<Availability, { bg: string; text: string }> = {
  available: { bg: '#e8f5e9', text: '#2e7d32' },
  unavailable: { bg: '#ffebee', text: '#c62828' },
  negotiable: { bg: '#fff8e1', text: '#f57f17' },
};

export function ShiftRequestPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ShiftRequest | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({
    availability: 'available' as Availability,
    preferredStart: '',
    preferredEnd: '',
    note: '',
  });
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      const data = await getMyShiftRequests({ year, month });
      setRequests(data);
    } catch { setError('希望シフトの取得に失敗しました'); }
  };

  useEffect(() => { loadRequests(); }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const openModal = (date: string, existing?: ShiftRequest) => {
    setSelectedDate(date);
    setSelectedRequest(existing || null);
    setFormData({
      availability: existing?.availability || 'available',
      preferredStart: existing?.preferredStart || '',
      preferredEnd: existing?.preferredEnd || '',
      note: existing?.note || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      date: selectedDate,
      availability: formData.availability,
      preferredStart: formData.preferredStart || null,
      preferredEnd: formData.preferredEnd || null,
      note: formData.note,
    };
    try {
      if (selectedRequest) {
        await updateShiftRequest(selectedRequest.id, payload);
      } else {
        await createShiftRequest(payload);
      }
      setIsModalOpen(false);
      loadRequests();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || '保存に失敗しました');
    }
  };

  const days = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const getRequestForDate = (dateStr: string) => requests.find(r => r.date === dateStr);

  return (
    <Layout>
      <h2 style={{ marginBottom: '16px' }}>希望シフト入力</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <button onClick={prevMonth} style={{ padding: '8px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}>◀</button>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{year}年{month}月</span>
        <button onClick={nextMonth} style={{ padding: '8px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}>▶</button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
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
            const req = getRequestForDate(dateStr);
            const dow = day.getDay();
            return (
              <div key={dateStr} onClick={() => openModal(dateStr, req)} style={{
                minHeight: '80px', padding: '4px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', cursor: 'pointer',
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
              >
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: dow === 0 ? '#d32f2f' : dow === 6 ? '#1565c0' : '#333' }}>
                  {day.getDate()}
                </div>
                {req && (
                  <div style={{
                    backgroundColor: AVAILABILITY_COLORS[req.availability].bg,
                    color: AVAILABILITY_COLORS[req.availability].text,
                    borderRadius: '4px', padding: '4px', textAlign: 'center',
                    fontSize: '18px', fontWeight: 'bold'
                  }}>
                    {AVAILABILITY_LABELS[req.availability]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
        凡例: ○=希望あり　×=不可　△=相談可　空白=未入力
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', width: '400px' }}>
            <h3 style={{ marginBottom: '24px' }}>希望シフト入力: {selectedDate}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>勤務可否</label>
                {(['available', 'unavailable', 'negotiable'] as Availability[]).map(av => (
                  <label key={av} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '16px', cursor: 'pointer' }}>
                    <input type="radio" name="availability" value={av} checked={formData.availability === av}
                      onChange={() => setFormData(f => ({ ...f, availability: av }))} style={{ marginRight: '4px' }} />
                    {av === 'available' ? '希望あり' : av === 'unavailable' ? '不可' : '相談可'}
                  </label>
                ))}
              </div>
              {formData.availability === 'available' && (
                <>
                  {['preferredStart', 'preferredEnd'].map((key, i) => (
                    <div key={key} style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{i === 0 ? '希望開始時刻' : '希望終了時刻'}</label>
                      <input type="time" value={formData[key as 'preferredStart' | 'preferredEnd']}
                        onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </>
              )}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>備考</label>
                <textarea value={formData.note} onChange={e => setFormData(f => ({ ...f, note: e.target.value }))}
                  maxLength={200} rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              {error && <p style={{ color: '#d32f2f', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>キャンセル</button>
                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
