import { Component, type ReactNode } from 'react';

interface Props {
  title: string;
  onExit: () => void;
  children: ReactNode;
}

/** Isolate a failed game so the player can still reach the hub and their saves. */
export default class GameErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main style={{ height: '100%', overflow: 'auto', background: '#10212b', color: '#f1f5f4', padding: '24px', display: 'grid', placeItems: 'center', fontFamily: 'Pretendard, system-ui, sans-serif' }}>
      <section role="alert" style={{ width: '100%', maxWidth: 440, lineHeight: 1.7 }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>{this.props.title} 실행에 문제가 생겼어요</h1>
        <p>게임을 불러오거나 실행하는 중에 문제가 생겼어요. 이 브라우저에 저장된 기록은 지우지 않았습니다.</p>
        <p>게임 목록에서 다른 게임을 선택하거나, 화면을 새로고침한 뒤 다시 시도해 주세요.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
          <button autoFocus type="button" onClick={this.props.onExit} style={{ minHeight: 48, padding: '10px 20px', borderRadius: 8, border: '1px solid #bce7d4', background: '#bce7d4', color: '#14362e', font: 'inherit', cursor: 'pointer' }}>게임 목록으로</button>
          <button type="button" onClick={() => window.location.reload()} style={{ minHeight: 48, padding: '10px 20px', borderRadius: 8, border: '1px solid #93aab4', background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer' }}>화면 새로고침</button>
        </div>
      </section>
    </main>;
  }
}
