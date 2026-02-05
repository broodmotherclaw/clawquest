import React from 'react';

interface Gang {
  id: string;
  name: string;
  logoSvg: string;
  memberCount: number;
}

interface GangDetailProps {
  gang: Gang;
  onClose: () => void;
}

export default function GangDetail({ gang, onClose }: GangDetailProps) {
  return (
    <div className="gang-detail-overlay" onClick={onClose}>
      <div className="gang-detail-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="gang-header">
          <div
            className="gang-logo"
            dangerouslySetInnerHTML={{ __html: gang.logoSvg }}
          />
          <div className="gang-info">
            <h2 className="gang-name">{gang.name}</h2>
            <p className="gang-members">{gang.memberCount} Members</p>
          </div>
        </div>

        <div className="gang-stats">
          <div className="stat-item">
            <div className="stat-label">Members</div>
            <div className="stat-value">{gang.memberCount}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Gang ID</div>
            <div className="stat-value">{gang.id.substring(0, 8)}...</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Territory</div>
            <div className="stat-value">-</div>
          </div>
        </div>

        <div className="gang-actions">
          <button className="btn-view-members">View All Members</button>
          <button className="btn-view-territory">View Territory</button>
        </div>
      </div>
    </div>
  );
}
