import React from 'react';

interface Gang {
  id: string;
  name: string;
  logoSvg: string;
  memberCount: number;
}

interface GangFilterProps {
  gangs: Gang[];
  selectedGangId: string | null;
  onGangSelect: (gangId: string | null) => void;
}

export default function GangFilter({ gangs, selectedGangId, onGangSelect }: GangFilterProps) {
  return (
    <div className="gang-filter">
      <h3>Gang Filter</h3>
      <button
        className={selectedGangId === null ? 'active' : ''}
        onClick={() => onGangSelect(null)}
      >
        All Gangs
      </button>
      {gangs.map(gang => (
        <div
          key={gang.id}
          className={`gang-item ${selectedGangId === gang.id ? 'active' : ''}`}
          onClick={() => onGangSelect(gang.id)}
        >
          <div
            className="gang-logo"
            dangerouslySetInnerHTML={{ __html: gang.logoSvg }}
          />
          <div className="gang-info">
            <span className="gang-name">{gang.name}</span>
            <span className="gang-members">{gang.memberCount} members</span>
          </div>
        </div>
      ))}
    </div>
  );
}
