// Wizard State Machine
const AppState = {
  currentStep: 1,
  totalSteps: 5,
  isInstalling: false,
  errorInfo: null,

  init() {
    this.bindEvents();
    this.setupIpcListeners();
    this.renderStep(1);
  },

  bindEvents() {
    document.getElementById('next-btn').addEventListener('click', () => this.goNext());
    document.getElementById('prev-btn').addEventListener('click', () => this.goPrev());
    document.getElementById('retry-btn').addEventListener('click', () => this.retry());
    document.getElementById('skip-btn').addEventListener('click', () => this.skip());
    document.getElementById('uninstall-btn').addEventListener('click', () => this.uninstall());

    // Log panel toggle
    document.getElementById('log-toggle').addEventListener('click', () => {
      document.getElementById('log-body').classList.toggle('collapsed');
    });

    // Export logs
    document.getElementById('export-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      window.api.exportLogs();
    });
  },

  setupIpcListeners() {
    window.api.onProgress((data) => {
      const step = Steps[this.currentStep];
      if (step && step.onProgress) step.onProgress(data);
    });

    window.api.onLog((data) => {
      this.appendLog(data.timestamp, data.text);
    });

    window.api.onError((data) => {
      this.showError(data);
    });
  },

  appendLog(timestamp, text) {
    const el = document.getElementById('log-entries');
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.textContent = `[${timestamp}] ${text}`;
    el.appendChild(div);
    const logBody = document.getElementById('log-body');
    logBody.scrollTop = logBody.scrollHeight;
  },

  showError(data) {
    this.errorInfo = data;
    const toast = document.getElementById('error-toast');
    toast.textContent = `错误: ${data.error}`;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 8000);

    if (data.retryable) {
      document.getElementById('retry-btn').style.display = '';
    }
    if (data.skippable) {
      document.getElementById('skip-btn').style.display = '';
    }
    document.getElementById('next-btn').disabled = false;
  },

  async goNext() {
    if (this.isInstalling) return;

    const step = Steps[this.currentStep];
    if (step && step.onNext) {
      const canProceed = await step.onNext();
      if (!canProceed) return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.renderStep(this.currentStep);
    }
  },

  goPrev() {
    if (this.isInstalling) return;
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderStep(this.currentStep);
    }
  },

  async retry() {
    document.getElementById('retry-btn').style.display = 'none';
    document.getElementById('skip-btn').style.display = 'none';
    document.getElementById('error-toast').style.display = 'none';
    this.errorInfo = null;

    const step = Steps[this.currentStep];
    if (step && step.onRetry) {
      await step.onRetry();
    }
  },

  skip() {
    document.getElementById('retry-btn').style.display = 'none';
    document.getElementById('skip-btn').style.display = 'none';
    document.getElementById('error-toast').style.display = 'none';
    this.errorInfo = null;
    this.goNext();
  },

  async uninstall() {
    const confirmed = confirm('确定要卸载 Claude Code 吗？此操作不可撤销。');
    if (!confirmed) return;

    this.isInstalling = true;
    this.updateButtons();
    window.api.setCloseGuard('卸载未完成，确定退出吗？');

    const result = await window.api.uninstallClaudeCode();
    this.isInstalling = false;
    this.updateButtons();
    window.api.clearCloseGuard();

    const toast = document.getElementById('error-toast');
    if (result.success) {
      toast.textContent = '✓ ' + result.message;
      toast.style.background = '#2E7D32';
      toast.style.display = 'block';
    } else {
      toast.textContent = '✗ ' + result.message;
      toast.style.background = '#c62828';
      toast.style.display = 'block';
    }
    setTimeout(() => { toast.style.display = 'none'; }, 6000);
  },

  renderStep(stepNum) {
    this.currentStep = stepNum;
    this.updateStepIndicator();
    this.updateButtons();

    const step = Steps[stepNum];
    const container = document.getElementById('step-content');
    if (step && step.render) {
      container.innerHTML = step.render();
    }

    if (step && step.onEnter) {
      step.onEnter();
    }
  },

  updateStepIndicator() {
    document.querySelectorAll('.step').forEach((el) => {
      const s = parseInt(el.dataset.step);
      el.classList.remove('active', 'done', 'error');
      if (s < this.currentStep) el.classList.add('done');
      else if (s === this.currentStep) el.classList.add('active');
    });
  },

  updateButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const retryBtn = document.getElementById('retry-btn');
    const skipBtn = document.getElementById('skip-btn');
    const uninstallBtn = document.getElementById('uninstall-btn');

    prevBtn.disabled = this.currentStep === 1 || this.isInstalling;
    nextBtn.disabled = this.isInstalling;
    nextBtn.textContent = this.currentStep === this.totalSteps ? '完成' : '下一步';

    // Show uninstall button on Claude Code install step
    uninstallBtn.style.display = this.currentStep === 4 && !this.isInstalling ? '' : 'none';

    if (!this.errorInfo) {
      retryBtn.style.display = 'none';
      skipBtn.style.display = 'none';
    }
  },
};

// Step registry
const Steps = {};

// Init on load
document.addEventListener('DOMContentLoaded', () => AppState.init());
