import { useState } from 'react';
import './UserManual.css';

export default function UserManual() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="user-manual__fab" 
        onClick={() => setIsOpen(true)}
        title="คู่มือการใช้"
      >
        ?
      </button>

      {isOpen && (
        <div className="user-manual__overlay" onClick={() => setIsOpen(false)}>
          <div 
            className="user-manual__modal animate-fade-in-up" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-manual__header">
              <h2>คู่มือการใช้งาน</h2>
              <button 
                className="user-manual__close" 
                onClick={() => setIsOpen(false)}
                title="ปิด"
              >
                &times;
              </button>
            </div>
            
            <div className="user-manual__content">
              <div className="user-manual__section">
                <h3>ขั้นตอนการใช้งาน</h3>
                <ol className="user-manual__steps">
                  <li><strong>1.</strong> กด <strong>Upload file</strong></li>
                  <li><strong>2.</strong> เลือกไฟล์ที่เป็น <strong>csv/excel</strong></li>
                  <li><strong>3.</strong> กด <strong>Analysis</strong> เพื่อดูผลวิเคราะห์</li>
                  <li><strong>4.</strong> กด <strong>Ask AI</strong> ถ้ามีคำถามเพิ่มเติม</li>
                </ol>
              </div>

              <div className="user-manual__section" style={{ marginTop: '1.5rem' }}>
                <h3>คำอธิบายค่าต่างๆ</h3>
                <ul>
                  <li>
                  <strong>N (Nitrogen / ไนโตรเจน):</strong> ช่วยเรื่องการเจริญเติบโตของใบและลำต้น
                </li>
                <li>
                  <strong>P (Phosphorus / ฟอสฟอรัส):</strong> ช่วยการเจริญเติบโตของรากและดอก
                </li>
                <li>
                  <strong>K (Potassium / โพแทสเซียม):</strong> ช่วยเพิ่มความแข็งแรงของพืชและคุณภาพผลผลิต
                </li>
                <li>
                  <strong>pH (ความเป็นกรด-ด่าง):</strong> ระดับความกรด-ด่างของดิน ซึ่งมีผลต่อการดูดซึมธาตุอาหาร
                </li>
                <li>
                  <strong>Moisture (ความชื้น):</strong> ปริมาณน้ำในดิน
                </li>
                <li>
                  <strong>Temperature (อุณหภูมิ):</strong> อุณหภูมิโดยรอบที่ส่งผลต่อการเติบโต
                </li>
                <li>
                  <strong>Region (ภูมิภาค/พื้นที่):</strong> สภาพพื้นที่ที่เหมาะสมสำหรับการเพาะปลูก
                </li>
              </ul>
              </div>
              <div className="user-manual__footer">
                <button className="btn-primary" onClick={() => setIsOpen(false)}>เข้าใจแล้ว</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
