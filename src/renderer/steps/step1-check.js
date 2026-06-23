Steps[1] = {
  render() {
    return `
      <div class="step-content">
        <div class="step-title">🔍 环境检测</div>
        <div class="status-row" id="node-status">
          <span class="status-icon">⏳</span>
          <span>Node.js: 检测中...</span>
        </div>
        <div class="status-row" id="pnpm-status">
          <span class="status-icon">⏳</span>
          <span>pnpm: 检测中...</span>
        </div>
        <div class="status-row" id="claude-status">
          <span class="status-icon">⏳</span>
          <span>Claude Code: 检测中...</span>
        </div>
        <div class="status-row" id="platform-info">
          <span>系统: 检测中...</span>
        </div>
      </div>
    `;
  },

  onEnter() {
    window.api.checkEnv().then((result) => {
      this.updateStatus('node-status', result.node, 'Node.js');
      this.updateStatus('pnpm-status', result.pnpm, 'pnpm');
      this.updateStatus('claude-status', result.claude, 'Claude Code', true);
      document.getElementById('platform-info').innerHTML =
        `<span>系统: ${result.platform === 'darwin' ? 'macOS' : 'Windows'}</span>`;
    });
  },

  updateStatus(elementId, version, name, isClaude) {
    const el = document.getElementById(elementId);
    if (version) {
      const icon = isClaude ? '✅' : '✓';
      el.innerHTML = `<span class="status-icon ok">${icon}</span><span>${name}: ${version} ${isClaude ? '(已安装，可直接使用)' : ''}</span>`;
    } else {
      el.innerHTML = `<span class="status-icon missing">✗</span><span>${name}: 未安装</span>`;
    }
  },

  updateStatus(elementId, version, name) {
    const el = document.getElementById(elementId);
    if (version) {
      el.innerHTML = `<span class="status-icon ok">✓</span><span>${name}: ${version}</span>`;
    } else {
      el.innerHTML = `<span class="status-icon missing">✗</span><span>${name}: 未安装</span>`;
    }
  },

  onNext() { return true; },
};
