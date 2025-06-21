document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Initialize calculator buttons
    document.getElementById('calculate-corpus').addEventListener('click', calculateCorpus);
    document.getElementById('calculate-bucket').addEventListener('click', calculateBucketStrategy);
    document.getElementById('calculate-swp').addEventListener('click', calculateSWPStrategy);
    document.getElementById('calculate-bucket-suggest').addEventListener('click', calculateSuggestedBucket);
    document.getElementById('calculate-swp-suggest').addEventListener('click', calculateSuggestedSWP);
});

// Corpus Calculator
function calculateCorpus() {
    const lumpsum = parseFloat(document.getElementById('lumpsum').value) || 0;
    const lumpsumCAGR = parseFloat(document.getElementById('lumpsum-cagr').value) || 0;
    const sip = parseFloat(document.getElementById('sip').value) || 0;
    const sipStepup = parseFloat(document.getElementById('sip-stepup').value) || 0;
    const sipCAGR = parseFloat(document.getElementById('sip-cagr').value) || 0;
    const years = parseInt(document.getElementById('years-to-retire').value) || 0;
    
    const lumpsumFutureValue = lumpsum * Math.pow(1 + lumpsumCAGR/100, years);
    
    let sipFutureValue = 0;
    let monthlySIP = sip;
    const monthlyRate = Math.pow(1 + sipCAGR/100, 1/12) - 1;
    
    for (let year = 1; year <= years; year++) {
        for (let month = 1; month <= 12; month++) {
            sipFutureValue = (sipFutureValue + monthlySIP) * (1 + monthlyRate);
        }
        monthlySIP *= (1 + sipStepup/100);
    }
    
    const totalCorpus = lumpsumFutureValue + sipFutureValue;
    
    const resultDiv = document.getElementById('corpus-result');
    resultDiv.innerHTML = `
        <h3>Projected Retirement Corpus</h3>
        <div class="result-grid">
            <div class="result-item">
                <span class="result-label">Lumpsum Future Value:</span>
                <span class="result-value">₹${formatNumber(lumpsumFutureValue)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">SIP Future Value:</span>
                <span class="result-value">₹${formatNumber(sipFutureValue)}</span>
            </div>
            <div class="result-item highlight">
                <span class="result-label">Total Retirement Corpus:</span>
                <span class="result-value">₹${formatNumber(totalCorpus)}</span>
            </div>
        </div>
    `;
    
    // Update corpus fields in other tabs
    document.getElementById('bucket-corpus').value = totalCorpus.toFixed(2);
    document.getElementById('swp-corpus').value = totalCorpus.toFixed(2);
}

// 3-Bucket Strategy
function calculateBucketStrategy() {
    const currentExpense = parseFloat(document.getElementById('current-expense').value) || 0;
    const inflation = parseFloat(document.getElementById('inflation').value) || 0;
    const yearsToRetire = parseInt(document.getElementById('bucket-years-to-retire').value) || 0;
    const corpus = parseFloat(document.getElementById('bucket-corpus').value) || 0;
    
    const bucket1Return = parseFloat(document.getElementById('bucket1-return').value) || 0;
    const bucket2Return = parseFloat(document.getElementById('bucket2-return').value) || 0;
    const bucket3Return = parseFloat(document.getElementById('bucket3-return').value) || 0;
    
    const bucket1Allocation = parseFloat(document.getElementById('bucket1-allocation').value) || 0;
    const bucket2Allocation = parseFloat(document.getElementById('bucket2-allocation').value) || 0;
    const bucket3Allocation = parseFloat(document.getElementById('bucket3-allocation').value) || 0;
    
    const totalAllocation = bucket1Allocation + bucket2Allocation + bucket3Allocation;
    if (totalAllocation !== 100) {
        alert('Bucket allocations must add up to 100%');
        return;
    }
    
    calculateBucketStrategyWithParams(
        corpus,
        currentExpense,
        inflation,
        yearsToRetire,
        bucket1Return,
        bucket2Return,
        bucket3Return,
        bucket1Allocation,
        bucket2Allocation,
        bucket3Allocation,
        'bucket-result'
    );
}

// SWP Strategy
function calculateSWPStrategy() {
    const currentExpense = parseFloat(document.getElementById('swp-current-expense').value) || 0;
    const inflation = parseFloat(document.getElementById('swp-inflation').value) || 0;
    const yearsToRetire = parseInt(document.getElementById('swp-years-to-retire').value) || 0;
    const corpus = parseFloat(document.getElementById('swp-corpus').value) || 0;
    const expectedReturn = parseFloat(document.getElementById('swp-return').value) || 0;
    
    calculateSWPStrategyWithParams(
        corpus,
        currentExpense,
        inflation,
        yearsToRetire,
        expectedReturn,
        'swp-result'
    );
}

// Suggested 3-Bucket Corpus
function calculateSuggestedBucket() {
    const currentExpense = parseFloat(document.getElementById('suggest-current-expense').value) || 0;
    const inflation = parseFloat(document.getElementById('suggest-inflation').value) || 0;
    const yearsToRetire = parseInt(document.getElementById('suggest-years-to-retire').value) || 0;
    const retirementYears = parseInt(document.getElementById('suggest-retirement-years').value) || 30;
    
    const bucket1Return = parseFloat(document.getElementById('suggest-bucket1-return').value) || 0;
    const bucket2Return = parseFloat(document.getElementById('suggest-bucket2-return').value) || 0;
    const bucket3Return = parseFloat(document.getElementById('suggest-bucket3-return').value) || 0;
    
    const bucket1Allocation = parseFloat(document.getElementById('suggest-bucket1-allocation').value) || 0;
    const bucket2Allocation = parseFloat(document.getElementById('suggest-bucket2-allocation').value) || 0;
    const bucket3Allocation = parseFloat(document.getElementById('suggest-bucket3-allocation').value) || 0;
    
    const totalAllocation = bucket1Allocation + bucket2Allocation + bucket3Allocation;
    if (totalAllocation !== 100) {
        alert('Bucket allocations must add up to 100%');
        return;
    }
    
    let suggestedCorpus = 0;
    let found = false;
    let step = 100000;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!found && attempts < maxAttempts) {
        attempts++;
        let corpus = suggestedCorpus + step;
        let success = simulateBucketStrategy(
            corpus,
            currentExpense,
            inflation,
            yearsToRetire,
            retirementYears,
            bucket1Return,
            bucket2Return,
            bucket3Return,
            bucket1Allocation,
            bucket2Allocation,
            bucket3Allocation
        );
        
        if (success) {
            if (step <= 1000) {
                found = true;
                suggestedCorpus = corpus;
            } else {
                suggestedCorpus = corpus - step;
                step = step / 10;
            }
        } else {
            suggestedCorpus = corpus;
        }
    }
    
    const resultDiv = document.getElementById('bucket-suggest-result');
    resultDiv.innerHTML = `
        <h3>Suggested 3-Bucket Corpus</h3>
        <div class="result-highlight">
            <span class="result-label">Required Corpus:</span>
            <span class="result-value">₹${formatNumber(suggestedCorpus)}</span>
        </div>
        <p>This corpus should support your withdrawals for ${retirementYears} years of retirement.</p>
    `;
    
    if (found) {
        calculateBucketStrategyWithParams(
            suggestedCorpus,
            currentExpense,
            inflation,
            yearsToRetire,
            bucket1Return,
            bucket2Return,
            bucket3Return,
            bucket1Allocation,
            bucket2Allocation,
            bucket3Allocation,
            'bucket-suggest-result',
            retirementYears
        );
    }
}

// Suggested SWP Corpus
function calculateSuggestedSWP() {
    const currentExpense = parseFloat(document.getElementById('suggest-swp-current-expense').value) || 0;
    const inflation = parseFloat(document.getElementById('suggest-swp-inflation').value) || 0;
    const yearsToRetire = parseInt(document.getElementById('suggest-swp-years-to-retire').value) || 0;
    const retirementYears = parseInt(document.getElementById('suggest-swp-retirement-years').value) || 30;
    const expectedReturn = parseFloat(document.getElementById('suggest-swp-return').value) || 0;
    
    const initialWithdrawal = currentExpense * 12 * Math.pow(1 + inflation/100, yearsToRetire);
    const realReturn = ((1 + expectedReturn/100) / (1 + inflation/100)) - 1;
    
    let suggestedCorpus;
    if (Math.abs(realReturn) < 0.0001) {
        suggestedCorpus = initialWithdrawal * retirementYears;
    } else {
        suggestedCorpus = initialWithdrawal * (1 - Math.pow(1 + inflation/100, retirementYears) * 
                        Math.pow(1 + expectedReturn/100, -retirementYears)) / (expectedReturn/100 - inflation/100);
    }
    
    const resultDiv = document.getElementById('swp-suggest-result');
    resultDiv.innerHTML = `
        <h3>Suggested SWP Corpus</h3>
        <div class="result-highlight">
            <span class="result-label">Required Corpus:</span>
            <span class="result-value">₹${formatNumber(suggestedCorpus)}</span>
        </div>
        <p>This corpus should support your withdrawals for ${retirementYears} years of retirement.</p>
    `;
    
    calculateSWPStrategyWithParams(
        suggestedCorpus,
        currentExpense,
        inflation,
        yearsToRetire,
        expectedReturn,
        'swp-suggest-result',
        retirementYears
    );
}

// Helper Functions
function simulateBucketStrategy(corpus, currentExpense, inflation, yearsToRetire, retirementYears,
                             bucket1Return, bucket2Return, bucket3Return,
                             bucket1Allocation, bucket2Allocation, bucket3Allocation) {
    let bucket1 = corpus * bucket1Allocation / 100;
    let bucket2 = corpus * bucket2Allocation / 100;
    let bucket3 = corpus * bucket3Allocation / 100;
    
    let withdrawal = currentExpense * 12 * Math.pow(1 + inflation/100, yearsToRetire);
    
    for (let year = 1; year <= retirementYears; year++) {
        bucket1 *= (1 + bucket1Return/100);
        bucket2 *= (1 + bucket2Return/100);
        bucket3 *= (1 + bucket3Return/100);
        
        if (bucket1 + bucket2 + bucket3 < withdrawal) {
            return false;
        }
        
        let remaining = withdrawal;
        const from1 = Math.min(bucket1, remaining);
        bucket1 -= from1;
        remaining -= from1;
        
        if (remaining > 0) {
            const from2 = Math.min(bucket2, remaining);
            bucket2 -= from2;
            remaining -= from2;
        }
        
        if (remaining > 0) {
            const from3 = Math.min(bucket3, remaining);
            bucket3 -= from3;
            remaining -= from3;
        }
        
        withdrawal *= (1 + inflation/100);
    }
    
    return true;
}

function calculateBucketStrategyWithParams(corpus, currentExpense, inflation, yearsToRetire,
                                        bucket1Return, bucket2Return, bucket3Return,
                                        bucket1Allocation, bucket2Allocation, bucket3Allocation,
                                        resultElementId, maxYears = 50) {
    let bucket1 = corpus * bucket1Allocation / 100;
    let bucket2 = corpus * bucket2Allocation / 100;
    let bucket3 = corpus * bucket3Allocation / 100;
    
    let withdrawal = currentExpense * 12 * Math.pow(1 + inflation/100, yearsToRetire);
    const initialWithdrawal = withdrawal;
    
    let tableHTML = `
        <h3>3-Bucket Withdrawal Strategy</h3>
        <div class="summary">
            <p>Initial Monthly Expense at Retirement: ₹${formatNumber(initialWithdrawal/12)}</p>
            <p>Initial Annual Withdrawal: ₹${formatNumber(initialWithdrawal)}</p>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>Withdrawal</th>
                        <th>Bucket 1 (Cash/FD)</th>
                        <th>Bucket 2 (Debt/Hybrid)</th>
                        <th>Bucket 3 (Equity)</th>
                        <th>Total Corpus</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let year = 1;
    let depleted = false;
    
    while (!depleted && year <= maxYears) {
        bucket1 *= (1 + bucket1Return/100);
        bucket2 *= (1 + bucket2Return/100);
        bucket3 *= (1 + bucket3Return/100);
        
        const total = bucket1 + bucket2 + bucket3;
        if (total < withdrawal) {
            tableHTML += `
                <tr class="depleted">
                    <td>${year}</td>
                    <td>₹${formatNumber(withdrawal)}</td>
                    <td colspan="4">Corpus Depleted</td>
                </tr>
            `;
            depleted = true;
            break;
        }
        
        let remaining = withdrawal;
        const from1 = Math.min(bucket1, remaining);
        bucket1 -= from1;
        remaining -= from1;
        
        if (remaining > 0) {
            const from2 = Math.min(bucket2, remaining);
            bucket2 -= from2;
            remaining -= from2;
        }
        
        if (remaining > 0) {
            const from3 = Math.min(bucket3, remaining);
            bucket3 -= from3;
            remaining -= from3;
        }
        
        bucket1 = Math.max(0, bucket1);
        bucket2 = Math.max(0, bucket2);
        bucket3 = Math.max(0, bucket3);
        
        withdrawal *= (1 + inflation/100);
        
        tableHTML += `
            <tr>
                <td>${year}</td>
                <td>₹${formatNumber(withdrawal)}</td>
                <td>₹${formatNumber(bucket1)}</td>
                <td>₹${formatNumber(bucket2)}</td>
                <td>₹${formatNumber(bucket3)}</td>
                <td>₹${formatNumber(total)}</td>
            </tr>
        `;
        
        year++;
    }
    
    tableHTML += `</tbody></table></div>`;
    
    if (depleted) {
        tableHTML += `<p class="warning">Warning: Corpus depleted in year ${year}</p>`;
    } else {
        tableHTML += `<p class="success">Corpus lasted through ${maxYears} years of retirement</p>`;
    }
    
    document.getElementById(resultElementId).innerHTML += tableHTML;
}

function calculateSWPStrategyWithParams(corpus, currentExpense, inflation, yearsToRetire,
                                     expectedReturn, resultElementId, maxYears = 50) {
    let currentCorpus = corpus;
    let withdrawal = currentExpense * 12 * Math.pow(1 + inflation/100, yearsToRetire);
    const initialWithdrawal = withdrawal;
    
    let tableHTML = `
        <h3>SWP Withdrawal Strategy</h3>
        <div class="summary">
            <p>Initial Monthly Expense at Retirement: ₹${formatNumber(initialWithdrawal/12)}</p>
            <p>Initial Annual Withdrawal: ₹${formatNumber(initialWithdrawal)}</p>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>Withdrawal</th>
                        <th>Portfolio Return</th>
                        <th>Corpus After Withdrawal</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let year = 1;
    let depleted = false;
    
    while (!depleted && year <= maxYears) {
        currentCorpus *= (1 + expectedReturn/100);
        
        if (currentCorpus < withdrawal) {
            tableHTML += `
                <tr class="depleted">
                    <td>${year}</td>
                    <td>₹${formatNumber(withdrawal)}</td>
                    <td colspan="2">Corpus Depleted</td>
                </tr>
            `;
            depleted = true;
            break;
        }
        
        currentCorpus -= withdrawal;
        withdrawal *= (1 + inflation/100);
        
        tableHTML += `
            <tr>
                <td>${year}</td>
                <td>₹${formatNumber(withdrawal)}</td>
                <td>₹${formatNumber(currentCorpus * expectedReturn/100)}</td>
                <td>₹${formatNumber(currentCorpus)}</td>
            </tr>
        `;
        
        year++;
    }
    
    tableHTML += `</tbody></table></div>`;
    
    if (depleted) {
        tableHTML += `<p class="warning">Warning: Corpus depleted in year ${year}</p>`;
    } else {
        tableHTML += `<p class="success">Corpus lasted through ${maxYears} years of retirement</p>`;
    }
    
    document.getElementById(resultElementId).innerHTML += tableHTML;
}

function formatNumber(num) {
    return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}