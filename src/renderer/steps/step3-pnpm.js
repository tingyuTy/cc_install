Steps[3] = {
  render() {
    return `
      <div class="step-content">
        <div class="step-title">📦 安装 pnpm</div>
        <div class="progress-bar">
          <div class="progress-fill" id="pnpm-progress"></div>
        </div>
        <div id="pnpm-status-text" style="font-size:13px; color:#aaa;">准备中...</div>
      </div>
    `;
  },

  async onEnter() {
    AppState.isInstalling = true;
    AppState.updateButtons();

    const env = await window.api.checkEnv();
    if (env.pnpm) {
      document.getElementById('pnpm-progress').style.width = '100%';
      document.getElementById('pnpm-status-text').textContent = `pnpm 已安装: ${env.pnpm}`;
      AppState.isInstalling = false;
      AppState.updateButtons();
      return;
    }

    window.api.setCloseGuard('pnpm 安装未完成，确定退出吗？');
    window.api.installPnpm().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      window.api.clearCloseGuard();

      if (result.success) {
        document.getElementById('pnpm-progress').style.width = '100%';
        document.getElementById('pnpm-status-text').textContent = `pnpm 安装成功: ${result.version}`;
        AppState.goNext();
      }
    });
  },

  onProgress(data) {
    if (data.step === 3) {
      document.getElementById('pnpm-progress').style.width = data.percent + '%';
      document.getElementById('pnpm-status-text').textContent = data.message;
    }
  },

  async onRetry() {
    AppState.isInstalling = true;
    AppState.updateButtons();
    window.api.installPnpm().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      if (result.success) {
        document.getElementById('pnpm-progress').style.width = '100%';
        document.getElementById('pnpm-status-text').textContent = `pnpm 安装成功: ${result.version}`;
      }
    });
  },
};
