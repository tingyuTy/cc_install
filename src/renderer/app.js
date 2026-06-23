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

    prevBtn.disabled = this.currentStep === 1 || this.isInstalling;
    nextBtn.disabled = this.isInstalling;
    nextBtn.textContent = this.currentStep === this.totalSteps ? '完成' : '下一步';

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
