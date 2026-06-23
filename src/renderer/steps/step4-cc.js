Steps[4] = {
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
      </div>
    `;
  },

  async onEnter() {
    // Check if already installed
    const env = await window.api.checkEnv();
    if (env.claude) {
      document.getElementById('cc-progress').style.width = '100%';
      document.getElementById('cc-status-text').textContent = 'Claude Code 已安装 ✓';
      document.getElementById('cc-status-text').style.color = '#66bb6a';
      const alreadyEl = document.getElementById('cc-already');
      alreadyEl.style.display = '';
      alreadyEl.innerHTML = `✅ 您已安装 ${env.claude}<br><br>无需重新安装，可直接进入下一步配置模型。<br>如需重新安装，请点击下方"重试"按钮。`;
      AppState.isInstalling = false;
      AppState.updateButtons();
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
