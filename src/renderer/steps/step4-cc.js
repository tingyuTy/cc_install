Steps[4] = {
  render() {
    return `
      <div class="step-content">
        <div class="step-title">🚀 安装 Claude Code</div>
        <div class="progress-bar">
          <div class="progress-fill" id="cc-progress"></div>
        </div>
        <div id="cc-status-text" style="font-size:13px; color:#aaa;">准备中...</div>
      </div>
    `;
  },

  async onEnter() {
    AppState.isInstalling = true;
    AppState.updateButtons();
    window.api.setCloseGuard('Claude Code 安装未完成，确定退出吗？');

    window.api.installClaudeCode().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      window.api.clearCloseGuard();

      if (result.success) {
        document.getElementById('cc-progress').style.width = '100%';
        document.getElementById('cc-status-text').textContent = `Claude Code 安装成功: ${result.version}`;
        AppState.goNext();
      }
    });
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
    window.api.installClaudeCode().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      if (result.success) {
        document.getElementById('cc-progress').style.width = '100%';
        document.getElementById('cc-status-text').textContent = `Claude Code 安装成功: ${result.version}`;
      }
    });
  },
};
