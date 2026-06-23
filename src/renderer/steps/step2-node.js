Steps[2] = {
  render() {
    return `
      <div class="step-content">
        <div class="step-title">📦 安装 Node.js</div>
        <div class="progress-bar">
          <div class="progress-fill" id="node-progress"></div>
        </div>
        <div id="node-status-text" style="font-size:13px; color:#aaa;">准备中...</div>
      </div>
    `;
  },

  async onEnter() {
    AppState.isInstalling = true;
    AppState.updateButtons();

    // Check if already installed
    const env = await window.api.checkEnv();
    if (env.node) {
      document.getElementById('node-progress').style.width = '100%';
      document.getElementById('node-status-text').textContent = `Node.js 已安装: ${env.node}`;
      AppState.isInstalling = false;
      AppState.updateButtons();
      return;
    }

    window.api.setCloseGuard('Node.js 安装未完成，确定退出吗？');
    window.api.installNode().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      window.api.clearCloseGuard();

      if (result.success) {
        document.getElementById('node-progress').style.width = '100%';
        document.getElementById('node-status-text').textContent = `Node.js 安装成功: ${result.version}`;
        AppState.goNext();
      }
    });
  },

  onProgress(data) {
    if (data.step === 2) {
      document.getElementById('node-progress').style.width = data.percent + '%';
      document.getElementById('node-status-text').textContent = data.message;
    }
  },

  async onRetry() {
    AppState.isInstalling = true;
    AppState.updateButtons();
    window.api.installNode().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      if (result.success) {
        document.getElementById('node-progress').style.width = '100%';
        document.getElementById('node-status-text').textContent = `Node.js 安装成功: ${result.version}`;
      }
    });
  },
};
