import { useEffect, useState } from 'react';
import { WindIcon } from '@phosphor-icons/react/dist/icons/Wind';
import { MagnetIcon } from '@phosphor-icons/react/dist/icons/Magnet';
import { LightningIcon } from '@phosphor-icons/react/dist/icons/Lightning';
import { UPGRADE_KEYS, UPGRADES, type UpgradeKey } from '../game/progression';
import type { UISnapshot } from '../game/types';

const ICONS = { agility: WindIcon, magnet: MagnetIcon, efficiency: LightningIcon };
export default function UpgradeDialog({ snapshot, onChoose }: { snapshot: UISnapshot; onChoose: (key: UpgradeKey) => void }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select'))) return;
      const index = ['1', '2', '3'].indexOf(event.key);
      if (index < 0) return;
      event.preventDefault();
      onChoose(UPGRADE_KEYS[index]);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [onChoose]);
  return <aside className="slither-upgrade-dock" data-expanded={expanded} aria-label="능력 강화">
    <button className="slither-upgrade-toggle" aria-expanded={expanded} aria-controls="slither-upgrade-choices" onClick={() => setExpanded(value => !value)}>
      <span>능력 강화 <b>+{snapshot.pendingUpgrades}</b></span><span>{expanded ? '접기' : '펼치기'}</span>
    </button>
    <span className="slither-upgrade-hint" role="status">LV {snapshot.level} · 강화는 나중에 골라도 돼요</span>
    <div id="slither-upgrade-choices" hidden={!expanded}>
      <p>플레이는 계속됩니다. 버튼 또는 숫자키로 선택하세요.</p>
      {UPGRADE_KEYS.map((key, index) => {
      const Icon = ICONS[key], upgrade = UPGRADES[key];
      return <button key={key} onClick={() => onChoose(key)}>
        <Icon size={20} /><span><strong>{upgrade.name} <small>{snapshot.upgrades[key] + 1}단계</small></strong><small>{upgrade.description}</small><small>{upgrade.detail}</small></span><kbd>{index + 1}</kbd>
      </button>;
    })}</div>
  </aside>;
}
