/**
 * Mortgage Calculator for HOME AFRICA
 * Calculates monthly mortgage payments for property listings
 * Supports Rwanda and regional banks' typical terms
 */

class MortgageCalculator {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.propertyPrice = options.propertyPrice || 0;
    this.currency = options.currency || 'RWF';
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.attachEvents();
    this.calculate();
  }

  render() {
    const formatPrice = (price) => {
      if (!price || price === 0) return '0';
      return parseInt(price).toLocaleString();
    };

    this.container.innerHTML = `
      <div class="mortgage-calc" style="background:linear-gradient(135deg,rgba(0,255,255,0.05),rgba(0,255,136,0.05));border:1px solid rgba(0,255,255,0.2);border-radius:14px;padding:1.5rem;">
        <h5 style="color:#0ff;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">
          <i class="bi bi-calculator"></i> Mortgage Calculator
        </h5>
        
        <div class="row g-3">
          <div class="col-md-6">
            <label style="color:rgba(255,255,255,0.7);font-size:0.85rem;display:block;margin-bottom:0.35rem;">Property Price (${this.currency})</label>
            <input type="number" id="mcPrice" class="form-control" value="${this.propertyPrice}" 
                   style="background:rgba(255,255,255,0.1);border:1px solid rgba(0,255,255,0.3);color:#fff;">
          </div>
          <div class="col-md-6">
            <label style="color:rgba(255,255,255,0.7);font-size:0.85rem;display:block;margin-bottom:0.35rem;">Down Payment (${this.currency})</label>
            <input type="number" id="mcDownPayment" class="form-control" value="${Math.round(this.propertyPrice * 0.2)}"
                   style="background:rgba(255,255,255,0.1);border:1px solid rgba(0,255,255,0.3);color:#fff;">
            <small style="color:rgba(255,255,255,0.5);font-size:0.75rem;">Typically 20% (${formatPrice(Math.round(this.propertyPrice * 0.2))})</small>
          </div>
          
          <div class="col-md-6">
            <label style="color:rgba(255,255,255,0.7);font-size:0.85rem;display:block;margin-bottom:0.35rem;">Interest Rate (% per year)</label>
            <select id="mcRate" class="form-select" style="background:rgba(255,255,255,0.1);border:1px solid rgba(0,255,255,0.3);color:#fff;">
              <option value="11">Bank of Kigali - 11%</option>
              <option value="12">Equity Bank - 12%</option>
              <option value="13">KCB Rwanda - 13%</option>
              <option value="14">I&M Bank - 14%</option>
              <option value="15" selected>GT Bank Rwanda - 15%</option>
              <option value="16">CRDB Bank - 16%</option>
              <option value="18">Microfinance - 18%</option>
              <option value="custom">Custom Rate</option>
            </select>
            <input type="number" id="mcCustomRate" class="form-control mt-2" placeholder="Enter custom rate" style="display:none;background:rgba(255,255,255,0.1);border:1px solid rgba(0,255,255,0.3);color:#fff;">
          </div>
          
          <div class="col-md-6">
            <label style="color:rgba(255,255,255,0.7);font-size:0.85rem;display:block;margin-bottom:0.35rem;">Loan Term (Years)</label>
            <select id="mcTerm" class="form-select" style="background:rgba(255,255,255,0.1);border:1px solid rgba(0,255,255,0.3);color:#fff;">
              <option value="5">5 Years</option>
              <option value="10">10 Years</option>
              <option value="15">15 Years</option>
              <option value="20" selected>20 Years</option>
              <option value="25">25 Years</option>
              <option value="30">30 Years</option>
            </select>
          </div>
        </div>

        <!-- Results -->
        <div class="mt-4 p-3" style="background:rgba(0,0,0,0.3);border-radius:10px;border:1px solid rgba(0,255,255,0.1);">
          <div class="row text-center">
            <div class="col-6 col-md-3 mb-3">
              <div style="color:rgba(255,255,255,0.6);font-size:0.8rem;">Loan Amount</div>
              <div id="mcLoanAmount" style="color:#fff;font-weight:bold;font-size:1.1rem;">-</div>
            </div>
            <div class="col-6 col-md-3 mb-3">
              <div style="color:rgba(255,255,255,0.6);font-size:0.8rem;">Monthly Payment</div>
              <div id="mcMonthly" style="color:#0ff;font-weight:bold;font-size:1.3rem;">-</div>
            </div>
            <div class="col-6 col-md-3 mb-3">
              <div style="color:rgba(255,255,255,0.6);font-size:0.8rem;">Total Interest</div>
              <div id="mcTotalInterest" style="color:#ff8800;font-weight:bold;font-size:1.1rem;">-</div>
            </div>
            <div class="col-6 col-md-3 mb-3">
              <div style="color:rgba(255,255,255,0.6);font-size:0.8rem;">Total Cost</div>
              <div id="mcTotalCost" style="color:#8fff00;font-weight:bold;font-size:1.1rem;">-</div>
            </div>
          </div>
        </div>

        <!-- Amortization Toggle -->
        <div class="mt-3">
          <button class="btn btn-sm btn-outline-info" id="mcToggleSchedule" style="border-color:rgba(0,255,255,0.4);color:#0ff;">
            <i class="bi bi-table"></i> View Payment Schedule
          </button>
        </div>

        <!-- Amortization Table -->
        <div id="mcSchedule" style="display:none;margin-top:1rem;max-height:300px;overflow-y:auto;">
          <table class="table table-sm" style="color:#fff;font-size:0.85rem;">
            <thead style="position:sticky;top:0;background:rgba(0,0,0,0.9);">
              <tr>
                <th style="color:#0ff;border-color:rgba(0,255,255,0.2);">Year</th>
                <th style="color:#0ff;border-color:rgba(0,255,255,0.2);">Interest</th>
                <th style="color:#0ff;border-color:rgba(0,255,255,0.2);">Principal</th>
                <th style="color:#0ff;border-color:rgba(0,255,255,0.2);">Balance</th>
              </tr>
            </thead>
            <tbody id="mcScheduleBody" style="border-color:rgba(0,255,255,0.1);">
            </tbody>
          </table>
        </div>

        <small class="d-block mt-3" style="color:rgba(255,255,255,0.4);font-size:0.75rem;">
          <i class="bi bi-info-circle"></i> This is an estimate. Actual rates and terms may vary. Contact banks for official quotes.
        </small>
      </div>
    `;
  }

  attachEvents() {
    const inputs = ['mcPrice', 'mcDownPayment', 'mcRate', 'mcTerm', 'mcCustomRate'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.calculate());
        el.addEventListener('change', () => this.calculate());
      }
    });

    // Toggle custom rate input
    const rateSelect = document.getElementById('mcRate');
    const customInput = document.getElementById('mcCustomRate');
    if (rateSelect && customInput) {
      rateSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
          customInput.style.display = 'block';
          customInput.focus();
        } else {
          customInput.style.display = 'none';
        }
        this.calculate();
      });
    }

    // Toggle schedule
    const toggleBtn = document.getElementById('mcToggleSchedule');
    const schedule = document.getElementById('mcSchedule');
    if (toggleBtn && schedule) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = schedule.style.display === 'none';
        schedule.style.display = isHidden ? 'block' : 'none';
        toggleBtn.innerHTML = isHidden 
          ? '<i class="bi bi-chevron-up"></i> Hide Payment Schedule'
          : '<i class="bi bi-table"></i> View Payment Schedule';
      });
    }
  }

  calculate() {
    const price = parseFloat(document.getElementById('mcPrice')?.value) || 0;
    const downPayment = parseFloat(document.getElementById('mcDownPayment')?.value) || 0;
    
    const rateSelect = document.getElementById('mcRate');
    let rate = 15;
    if (rateSelect) {
      rate = rateSelect.value === 'custom' 
        ? parseFloat(document.getElementById('mcCustomRate')?.value) || 0
        : parseFloat(rateSelect.value) || 0;
    }
    
    const term = parseInt(document.getElementById('mcTerm')?.value) || 20;

    const loanAmount = Math.max(0, price - downPayment);
    const monthlyRate = rate / 100 / 12;
    const numPayments = term * 12;

    let monthlyPayment = 0;
    let totalCost = 0;
    let totalInterest = 0;

    if (loanAmount > 0 && monthlyRate > 0) {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
      totalCost = monthlyPayment * numPayments;
      totalInterest = totalCost - loanAmount;
    } else if (loanAmount > 0) {
      monthlyPayment = loanAmount / numPayments;
      totalCost = loanAmount;
      totalInterest = 0;
    }

    // Update display
    const format = (n) => Math.round(n).toLocaleString() + ' ' + this.currency;
    
    const loanEl = document.getElementById('mcLoanAmount');
    const monthlyEl = document.getElementById('mcMonthly');
    const interestEl = document.getElementById('mcTotalInterest');
    const costEl = document.getElementById('mcTotalCost');

    if (loanEl) loanEl.textContent = format(loanAmount);
    if (monthlyEl) monthlyEl.textContent = format(monthlyPayment);
    if (interestEl) interestEl.textContent = format(totalInterest);
    if (costEl) costEl.textContent = format(totalCost + downPayment);

    // Generate schedule
    this.generateSchedule(loanAmount, monthlyRate, numPayments, monthlyPayment);
  }

  generateSchedule(principal, monthlyRate, numPayments, monthlyPayment) {
    const tbody = document.getElementById('mcScheduleBody');
    if (!tbody || principal <= 0) return;

    let balance = principal;
    let html = '';
    
    // Annual summary
    for (let year = 1; year <= Math.ceil(numPayments / 12); year++) {
      let yearInterest = 0;
      let yearPrincipal = 0;
      
      for (let month = 1; month <= 12 && (year - 1) * 12 + month <= numPayments; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        
        yearInterest += interestPayment;
        yearPrincipal += principalPayment;
        balance = Math.max(0, balance - principalPayment);
      }
      
      html += `
        <tr style="border-color:rgba(0,255,255,0.1);">
          <td style="border-color:rgba(0,255,255,0.1);">${year}</td>
          <td style="border-color:rgba(0,255,255,0.1);color:#ff8800;">${Math.round(yearInterest).toLocaleString()}</td>
          <td style="border-color:rgba(0,255,255,0.1);color:#0ff;">${Math.round(yearPrincipal).toLocaleString()}</td>
          <td style="border-color:rgba(0,255,255,0.1);color:#8fff00;">${Math.round(balance).toLocaleString()}</td>
        </tr>
      `;
    }
    
    tbody.innerHTML = html;
  }
}

// Global init function for use in HTML
window.initMortgageCalculator = function(containerId, propertyPrice, currency = 'RWF') {
  return new MortgageCalculator(containerId, { propertyPrice, currency });
};
