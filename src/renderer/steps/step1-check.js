Steps[1] = {
  workspaceFolder: null,

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
        <div id="cc-workspace" style="margin-top:16px; display:none;">
          <div style="font-size:14px; color:#4CAF50; margin-bottom:10px;">✅ Claude Code 已安装，选择工作区即可开始使用：</div>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="workspace-path" readonly placeholder="点击右侧按钮选择文件夹..." style="flex:1; padding:8px 12px; border:1px solid #444; background:#2a2a3e; color:#e0e0e0; font-size:12px; border-radius:4px;">
            <button id="pick-folder-btn" class="btn" style="white-space:nowrap;">📂 选择文件夹</button>
          </div>
          <button id="open-claude-btn" class="btn btn-primary" style="margin-top:10px; width:100%;" disabled>▶ 在此文件夹打开 Claude Code</button>
          <div style="margin-top:12px; padding:12px; background:#263238; border-radius:4px; font-size:12px; color:#90A4AE; line-height:1.6;">
            也可以继续向导：<br>
            • 点击 <b>"下一步"</b> 配置 DeepSeek 模型<br>
            • 点击 <b>"🗑 卸载 Claude Code"</b> 卸载后重新安装
          </div>
        </div>
      </div>
    `;
  },

  onEnter() {
    const self = this;
    window.api.checkEnv().then((result) => {
      self.setStatus('node-status', result.node, 'Node.js', false);
      self.setStatus('pnpm-status', result.pnpm, 'pnpm', false);
      self.setStatus('claude-status', result.claude, 'Claude Code', true);
      document.getElementById('platform-info').innerHTML =
        `<span>系统: ${result.platform === 'darwin' ? 'macOS' : 'Windows'}</span>`;

      if (result.claude) {
        self.showWorkspace();
      }
    });
  },

  setStatus(elementId, version, name, isClaude) {
    const el = document.getElementById(elementId);
    if (version) {
      const icon = isClaude ? '✅' : '✓';
      el.innerHTML = `<span class="status-icon ok">${icon}</span><span>${name}: ${version} ${isClaude ? '(已安装)' : ''}</span>`;
    } else {
      el.innerHTML = `<span class="status-icon missing">✗</span><span>${name}: 未安装</span>`;
    }
  },

  showWorkspace() {
    const wsEl = document.getElementById('cc-workspace');
    wsEl.style.display = '';
    const self = this;

    document.getElementById('pick-folder-btn').addEventListener('click', async () => {
      const folder = await window.api.pickWorkspace();
      if (folder) {
        self.workspaceFolder = folder;
        document.getElementById('workspace-path').value = folder;
        document.getElementById('open-claude-btn').disabled = false;
      }
    });

    document.getElementById('open-claude-btn').addEventListener('click', async () => {
      if (self.workspaceFolder) {
        await window.api.openClaude(self.workspaceFolder);
      }
    });

    // Show uninstall button in footer since Claude Code is installed
    document.getElementById('uninstall-btn').style.display = '';
  },

  onNext() { return true; },
};
