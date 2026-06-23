Steps[5] = {
  render() {
    return `
      <div class="step-content">
        <div class="step-title">⚙️ 配置 DeepSeek V4</div>
        <div class="form-group">
          <label>DeepSeek API Key <span style="color:#ef5350">*</span></label>
          <input type="password" id="api-key-input" placeholder="sk-..." autocomplete="off">
        </div>
        <div class="form-group">
          <label>API Base URL (可选)</label>
          <input type="text" id="base-url-input" placeholder="https://api.deepseek.com/anthropic">
        </div>
        <div id="config-result" style="font-size:13px; margin-top:12px;"></div>
      </div>
    `;
  },

  async onNext() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const baseUrl = document.getElementById('base-url-input').value.trim() || undefined;

    const result = await window.api.generateConfig(apiKey, baseUrl);
    const resultEl = document.getElementById('config-result');

    if (result.success) {
      resultEl.innerHTML = `<span style="color:#66bb6a;">✓ ${result.message}</span>`;
      return true;
    } else {
      resultEl.innerHTML = `<span style="color:#ef5350;">✗ ${result.message}</span>`;
      return false;
    }
  },
};
