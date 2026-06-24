Steps[4] = {
  workspaceFolder: null,

  render() {
    return `
      <div class="step-content">
        <div class="step-title">🚀 安装 Claude Code</div>
        <div class="progress-bar">
          <div class="progress-fill" id="cc-progress"></div>
        </div>
        <div id="cc-status-text" style="font-size:13px; color:#aaa;">准备中...</div>
        <div id="cc-warning" style="margin-top:12px; padding:12px; background:#3E2723; border:1px solid #E65100; border-radius:6px; font-size:12px; line-height:1.6; display:none;"></div>
        <div id="cc-already" style="margin-top:12px; padding:16px; background:#1B5E20; border:1px solid #4CAF50; border-radius:6px; font-size:13px; line-height:1.6; display:none;"></div>
        <div id="cc-workspace" style="margin-top:12px; display:none;">
          <div style="font-size:13px; color:#ccc; margin-bottom:8px;">📁 选择工作区文件夹，直接开始使用 Claude Code：</div>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="workspace-path" readonly placeholder="未选择文件夹..." style="flex:1; padding:8px 12px; border:1px solid #444; background:#2a2a3e; color:#e0e0e0; font-size:12px; border-radius:4px;">
            <button id="pick-folder-btn" class="btn" style="white-space:nowrap;">📂 选择文件夹</button>
          </div>
          <button id="open-claude-btn" class="btn btn-primary" style="margin-top:10px; width:100%;" disabled>▶ 打开 Claude Code</button>
        </div>
      </div>
    `;
  },

  async onEnter() {
    const env = await window.api.checkEnv();
    if (env.claude) {
      document.getElementById('cc-progress').style.width = '100%';
      document.getElementById('cc-status-text').textContent = 'Claude Code 已安装 ✓';
      document.getElementById('cc-status-text').style.color = '#66bb6a';

      const alreadyEl = document.getElementById('cc-already');
      alreadyEl.style.display = '';
      alreadyEl.innerHTML = `✅ 您已安装 ${env.claude}<br><br>• 点击 <b>"下一步"</b> 直接进入模型配置<br>• 点击 <b>"🗑 卸载 Claude Code"</b> 卸载后重新安装<br>• 点击 <b>"重新安装"</b> 覆盖安装`;

      // Show workspace picker
      const wsEl = document.getElementById('cc-workspace');
      wsEl.style.display = '';
      this.bindWorkspaceEvents();

      AppState.isInstalling = false;
      AppState.updateButtons();
      document.getElementById('retry-btn').style.display = '';
      document.getElementById('retry-btn').textContent = '重新安装';
      return;
    }

    // Not installed — proceed with install
    AppState.isInstalling = true;
    AppState.updateButtons();
    window.api.setCloseGuard('Claude Code 安装未完成，确定退出吗？');

    window.api.installClaudeCode().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      window.api.clearCloseGuard();

      if (result.success) {
        document.getElementById('cc-progress').style.width = '100%';
        const statusEl = document.getElementById('cc-status-text');
        const warningEl = document.getElementById('cc-warning');

        if (result.warning) {
          statusEl.textContent = 'Claude Code 已安装，但无法运行 ⚠';
          statusEl.style.color = '#FF9800';
          warningEl.style.display = '';
          warningEl.innerHTML = result.warning.replace(/\n/g, '<br>');
        } else {
          statusEl.textContent = `Claude Code 安装成功: ${result.version}`;
        }
        AppState.goNext();
      }
    });
  },

  bindWorkspaceEvents() {
    const pickBtn = document.getElementById('pick-folder-btn');
    const openBtn = document.getElementById('open-claude-btn');
    const pathInput = document.getElementById('workspace-path');
    const self = this;

    pickBtn.onclick = async () => {
      const folder = await window.api.pickWorkspace();
      if (folder) {
        self.workspaceFolder = folder;
        pathInput.value = folder;
        openBtn.disabled = false;
      }
    };

    openBtn.onclick = async () => {
      if (self.workspaceFolder) {
        await window.api.openClaude(self.workspaceFolder);
      }
    };
  },

  onProgress(data) {
    if (data.step === 4) {
      document.getElementById('cc-progress').style.width = data.percent + '%';
      document.getElementById('cc-status-text').textContent = data.message;
    }
  },

  async onRetry() {
    AppState.isInstalling = true;
    AppState.updateButtons();
    document.getElementById('cc-already').style.display = 'none';
    document.getElementById('cc-workspace').style.display = 'none';
    window.api.setCloseGuard('Claude Code 安装未完成，确定退出吗？');
    window.api.installClaudeCode().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      window.api.clearCloseGuard();
      if (result.success) {
        document.getElementById('cc-progress').style.width = '100%';
        const statusEl = document.getElementById('cc-status-text');
        if (result.warning) {
          statusEl.textContent = 'Claude Code 已安装，但无法运行 ⚠';
          statusEl.style.color = '#FF9800';
          const warningEl = document.getElementById('cc-warning');
          warningEl.style.display = '';
          warningEl.innerHTML = result.warning.replace(/\n/g, '<br>');
        } else {
          statusEl.textContent = `Claude Code 安装成功: ${result.version}`;
          statusEl.style.color = '#aaa';
        }
      }
    });
  },
};
