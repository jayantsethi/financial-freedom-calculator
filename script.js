// Constants
const CALCULATOR_CONFIG = {
    maxSimulationYears: 50,
    maxSimulationAttempts: 100,
    corpusSearchStep: 100000,
    corpusSearchPrecision: 1000
};

// Utility functions
const formatNumber = (num) => num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

const getInputValue = (id, defaultValue = 0) => {
    const value = parseFloat(document.getElementById(id).value);
    return isNaN(value) ? defaultValue : value;
};

const getIntValue = (id, defaultValue = 0) => {
    const value = parseInt(document.getElementById(id).value);
    return isNaN(value) ? defaultValue : value;
};

const validateBucketAllocations = (allocations) => {
    const total = allocations.reduce((sum, alloc) => sum + alloc, 0);
    return Math.abs(total - 100) < 0.01;
};

const showError = (message) => {
    alert(message);
};

// DOM Management
const DOM = {
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeTabs();
            this.initializeCalculators();
        });
    },
    
    initializeTabs() {
        const hamburger = document.getElementById('hamburger-menu');
        const sideMenu = document.getElementById('side-menu');
        const closeMenu = document.getElementById('close-menu');
        const menuOverlay = document.getElementById('menu-overlay');
        const menuItems = document.querySelectorAll('.menu-item');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Open menu
        hamburger.addEventListener('click', () => {
            sideMenu.classList.add('active');
            menuOverlay.classList.add('active');
        });
        
        // Close menu
        const closeSideMenu = () => {
            sideMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
        };
        
        closeMenu.addEventListener('click', closeSideMenu);
        menuOverlay.addEventListener('click', closeSideMenu);
        
        // Handle menu item clicks
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all items and contents
                menuItems.forEach(mi => mi.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Show corresponding tab
                const tabId = item.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                // Close menu
                closeSideMenu();
            });
        });
    },
    
    initializeCalculators() {
        document.getElementById('calculate-corpus').addEventListener('click', () => Calculators.corpus());
        document.getElementById('calculate-bucket').addEventListener('click', () => Calculators.bucketStrategy());
        document.getElementById('calculate-swp').addEventListener('click', () => Calculators.swpStrategy());
        document.getElementById('calculate-bucket-suggest').addEventListener('click', () => Calculators.suggestedBucket());
        document.getElementById('calculate-swp-suggest').addEventListener('click', () => Calculators.suggestedSWP());
    },
    
    updateResult(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    },
    
    appendResult(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML += html;
        }
    }
};

// Calculator Implementations
const Calculators = {
    corpus() {
        const inputs = {
            lumpsum: getInputValue('lumpsum'),
            lumpsumCAGR: getInputValue('lumpsum-cagr'),
            sip: getInputValue('sip'),
            sipStepup: getInputValue('sip-stepup'),
            sipCAGR: getInputValue('sip-cagr'),
            years: getIntValue('years-to-retire')
        };
        
        const lumpsumFutureValue = FinancialCalculations.calculateFutureValue(
            inputs.lumpsum, inputs.lumpsumCAGR, inputs.years
        );
        
        const sipFutureValue = FinancialCalculations.calculateSIPFutureValue(
            inputs.sip, inputs.sipCAGR, inputs.sipStepup, inputs.years
        );
        
        const totalCorpus = lumpsumFutureValue + sipFutureValue;
        
        const resultHTML = Templates.corpusResult(lumpsumFutureValue, sipFutureValue, totalCorpus);
        DOM.updateResult('corpus-result', resultHTML);
        
        // Update corpus fields in other tabs
        document.getElementById('bucket-corpus').value = totalCorpus.toFixed(2);
        document.getElementById('swp-corpus').value = totalCorpus.toFixed(2);
    },

    bucketStrategy() {
        const inputs = {
            currentExpense: getInputValue('current-expense'),
            inflation: getInputValue('inflation'),
            yearsToRetire: getIntValue('bucket-years-to-retire'),
            corpus: getInputValue('bucket-corpus'),
            returns: {
                bucket1: getInputValue('bucket1-return'),
                bucket2: getInputValue('bucket2-return'),
                bucket3: getInputValue('bucket3-return')
            },
            allocations: {
                bucket1: getInputValue('bucket1-allocation'),
                bucket2: getInputValue('bucket2-allocation'),
                bucket3: getInputValue('bucket3-allocation')
            }
        };
        
        const allocations = [inputs.allocations.bucket1, inputs.allocations.bucket2, inputs.allocations.bucket3];
        if (!validateBucketAllocations(allocations)) {
            showError('Bucket allocations must add up to 100%');
            return;
        }
        
        Strategies.calculateBucketStrategy(inputs, 'bucket-result');
    },

    swpStrategy() {
        const inputs = {
            currentExpense: getInputValue('swp-current-expense'),
            inflation: getInputValue('swp-inflation'),
            yearsToRetire: getIntValue('swp-years-to-retire'),
            corpus: getInputValue('swp-corpus'),
            expectedReturn: getInputValue('swp-return')
        };
        
        Strategies.calculateSWPStrategy(inputs, 'swp-result');
    },

    suggestedBucket() {
        const inputs = {
            currentExpense: getInputValue('suggest-current-expense'),
            inflation: getInputValue('suggest-inflation'),
            yearsToRetire: getIntValue('suggest-years-to-retire'),
            retirementYears: getIntValue('suggest-retirement-years', 30),
            returns: {
                bucket1: getInputValue('suggest-bucket1-return'),
                bucket2: getInputValue('suggest-bucket2-return'),
                bucket3: getInputValue('suggest-bucket3-return')
            },
            allocations: {
                bucket1: getInputValue('suggest-bucket1-allocation'),
                bucket2: getInputValue('suggest-bucket2-allocation'),
                bucket3: getInputValue('suggest-bucket3-allocation')
            }
        };
        
        const allocations = [inputs.allocations.bucket1, inputs.allocations.bucket2, inputs.allocations.bucket3];
        if (!validateBucketAllocations(allocations)) {
            showError('Bucket allocations must add up to 100%');
            return;
        }
        
        // Calculate monthly expense at retirement
        const monthlyExpenseAtRetirement = inputs.currentExpense * Math.pow(1 + inputs.inflation / 100, inputs.yearsToRetire);
        const annualExpenseAtRetirement = monthlyExpenseAtRetirement * 12;
        
        // Calculate required corpus using the weighted average return
        const weightedReturn = (inputs.returns.bucket1 * inputs.allocations.bucket1 + 
                               inputs.returns.bucket2 * inputs.allocations.bucket2 + 
                               inputs.returns.bucket3 * inputs.allocations.bucket3) / 100;
        
        // Use a more sophisticated corpus calculation
        let requiredCorpus = 0;
        let annualWithdrawal = annualExpenseAtRetirement;
        
        // Calculate present value of all future withdrawals
        for (let year = 0; year < inputs.retirementYears; year++) {
            const presentValue = annualWithdrawal / Math.pow(1 + weightedReturn / 100, year);
            requiredCorpus += presentValue;
            annualWithdrawal *= (1 + inputs.inflation / 100);
        }
        
        // Add a 10% buffer for safety
        requiredCorpus *= 1.1;
        
        const resultHTML = `
            <h3>Suggested 3-Bucket Corpus</h3>
            <div class="result-highlight">
                <span class="result-label">Required Corpus:</span>
                <span class="result-value">₹${formatNumber(requiredCorpus)}</span>
            </div>
            <div class="summary">
                <p>Monthly Expense at Retirement: ₹${formatNumber(monthlyExpenseAtRetirement)}</p>
                <p>Weighted Average Return: ${weightedReturn.toFixed(2)}%</p>
                <p>This corpus should support your withdrawals for ${inputs.retirementYears} years of retirement.</p>
            </div>
        `;
        DOM.updateResult('bucket-suggest-result', resultHTML);
        
        // Show the year-by-year plan
        const strategyInputs = { ...inputs, corpus: requiredCorpus };
        Strategies.calculateBucketStrategy(strategyInputs, 'bucket-suggest-result', inputs.retirementYears);
    },

    suggestedSWP() {
        const inputs = {
            currentExpense: getInputValue('suggest-swp-current-expense'),
            inflation: getInputValue('suggest-swp-inflation'),
            yearsToRetire: getIntValue('suggest-swp-years-to-retire'),
            retirementYears: getIntValue('suggest-swp-retirement-years', 30),
            expectedReturn: getInputValue('suggest-swp-return')
        };
        
        const suggestedCorpus = CorpusFinder.findOptimalSWPCorpus(inputs);
        
        const resultHTML = Templates.suggestedCorpusResult(
            'Suggested SWP Corpus',
            suggestedCorpus,
            inputs.retirementYears
        );
        DOM.updateResult('swp-suggest-result', resultHTML);
        
        const strategyInputs = { ...inputs, corpus: suggestedCorpus };
        Strategies.calculateSWPStrategy(strategyInputs, 'swp-suggest-result', inputs.retirementYears);
    }
};

// Financial Calculations
const FinancialCalculations = {
    calculateFutureValue(principal, rate, years) {
        return principal * Math.pow(1 + rate / 100, years);
    },
    
    calculateSIPFutureValue(sip, cagr, stepup, years) {
        let futureValue = 0;
        let monthlySIP = sip;
        const monthlyRate = Math.pow(1 + cagr / 100, 1 / 12) - 1;
        
        for (let year = 1; year <= years; year++) {
            for (let month = 1; month <= 12; month++) {
                futureValue = (futureValue + monthlySIP) * (1 + monthlyRate);
            }
            monthlySIP *= (1 + stepup / 100);
        }
        
        return futureValue;
    },
    
    calculateInitialWithdrawal(currentExpense, inflation, yearsToRetire) {
        return currentExpense * 12 * Math.pow(1 + inflation / 100, yearsToRetire);
    },
    
    calculateRealReturn(expectedReturn, inflation) {
        return ((1 + expectedReturn / 100) / (1 + inflation / 100)) - 1;
    }
};

// Corpus Finding Logic
const CorpusFinder = {
    findOptimalBucketCorpus(inputs) {
        let suggestedCorpus = 0;
        let found = false;
        let step = CALCULATOR_CONFIG.corpusSearchStep;
        let attempts = 0;
        
        while (!found && attempts < CALCULATOR_CONFIG.maxSimulationAttempts) {
            attempts++;
            const corpus = suggestedCorpus + step;
            const success = Simulations.simulateBucketStrategy(corpus, inputs);
            
            if (success) {
                if (step <= CALCULATOR_CONFIG.corpusSearchPrecision) {
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
        
        return found ? suggestedCorpus : 0;
    },
    
    findOptimalSWPCorpus(inputs) {
        const initialWithdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        const realReturn = FinancialCalculations.calculateRealReturn(
            inputs.expectedReturn, inputs.inflation
        );
        
        if (Math.abs(realReturn) < 0.0001) {
            return initialWithdrawal * inputs.retirementYears;
        } else {
            return initialWithdrawal * 
                (1 - Math.pow(1 + inputs.inflation / 100, inputs.retirementYears) * 
                Math.pow(1 + inputs.expectedReturn / 100, -inputs.retirementYears)) / 
                (inputs.expectedReturn / 100 - inputs.inflation / 100);
        }
    }
};

// Simulation Logic
const Simulations = {
    simulateBucketStrategy(corpus, inputs) {
        let bucket1 = corpus * inputs.allocations.bucket1 / 100;
        let bucket2 = corpus * inputs.allocations.bucket2 / 100;
        let bucket3 = corpus * inputs.allocations.bucket3 / 100;
        
        let withdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        for (let year = 1; year <= inputs.retirementYears; year++) {
            bucket1 *= (1 + inputs.returns.bucket1 / 100);
            bucket2 *= (1 + inputs.returns.bucket2 / 100);
            bucket3 *= (1 + inputs.returns.bucket3 / 100);
            
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
            
            withdrawal *= (1 + inputs.inflation / 100);
        }
        
        return true;
    }
};

// Strategy Calculations
const Strategies = {
    calculateBucketStrategy(inputs, resultElementId, maxYears = CALCULATOR_CONFIG.maxSimulationYears) {
        let bucket1 = inputs.corpus * inputs.allocations.bucket1 / 100;
        let bucket2 = inputs.corpus * inputs.allocations.bucket2 / 100;
        let bucket3 = inputs.corpus * inputs.allocations.bucket3 / 100;
        
        let withdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        const initialWithdrawal = withdrawal;
        
        let tableHTML = Templates.strategyHeader(
            '3-Bucket Withdrawal Strategy',
            initialWithdrawal
        ) + Templates.bucketTableHeader();
        
        let year = 1;
        let depleted = false;
        
        while (!depleted && year <= maxYears) {
            bucket1 *= (1 + inputs.returns.bucket1 / 100);
            bucket2 *= (1 + inputs.returns.bucket2 / 100);
            bucket3 *= (1 + inputs.returns.bucket3 / 100);
            
            const total = bucket1 + bucket2 + bucket3;
            if (total < withdrawal) {
                tableHTML += Templates.depletedRow(year, withdrawal, 4);
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
            
            tableHTML += Templates.bucketRow(year, withdrawal, bucket1, bucket2, bucket3, total);
            
            withdrawal *= (1 + inputs.inflation / 100);
            
            year++;
        }
        
        tableHTML += Templates.tableFooter();
        tableHTML += Templates.resultMessage(depleted, year, maxYears);
        
        DOM.appendResult(resultElementId, tableHTML);
    },
    
    calculateSWPStrategy(inputs, resultElementId, maxYears = CALCULATOR_CONFIG.maxSimulationYears) {
        let currentCorpus = inputs.corpus;
        let withdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        const initialWithdrawal = withdrawal;
        
        let tableHTML = Templates.strategyHeader(
            'SWP Withdrawal Strategy',
            initialWithdrawal
        ) + Templates.swpTableHeader();
        
        let year = 1;
        let depleted = false;
        
        while (!depleted && year <= maxYears) {
            currentCorpus *= (1 + inputs.expectedReturn / 100);
            
            if (currentCorpus < withdrawal) {
                tableHTML += Templates.depletedRow(year, withdrawal, 2);
                depleted = true;
                break;
            }
            
            currentCorpus -= withdrawal;
            tableHTML += Templates.swpRow(
                year, 
                withdrawal, 
                currentCorpus * inputs.expectedReturn / 100, 
                currentCorpus
            );
            
            withdrawal *= (1 + inputs.inflation / 100);
            
            year++;
        }
        
        tableHTML += Templates.tableFooter();
        tableHTML += Templates.resultMessage(depleted, year, maxYears);
        
        DOM.appendResult(resultElementId, tableHTML);
    }
};

// HTML Templates
const Templates = {
    corpusResult(lumpsumFV, sipFV, total) {
        return `
            <h3>Projected Retirement Corpus</h3>
            <div class="result-grid">
                <div class="result-item">
                    <span class="result-label">Lumpsum Future Value:</span>
                    <span class="result-value">₹${formatNumber(lumpsumFV)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">SIP Future Value:</span>
                    <span class="result-value">₹${formatNumber(sipFV)}</span>
                </div>
                <div class="result-item highlight">
                    <span class="result-label">Total Retirement Corpus:</span>
                    <span class="result-value">₹${formatNumber(total)}</span>
                </div>
            </div>
        `;
    },
    
    suggestedCorpusResult(title, corpus, years) {
        return `
            <h3>${title}</h3>
            <div class="result-highlight">
                <span class="result-label">Required Corpus:</span>
                <span class="result-value">₹${formatNumber(corpus)}</span>
            </div>
            <p>This corpus should support your withdrawals for ${years} years of retirement.</p>
        `;
    },
    
    strategyHeader(title, initialWithdrawal) {
        return `
            <h3>${title}</h3>
            <div class="summary">
                <p>Initial Monthly Expense at Retirement: ₹${formatNumber(initialWithdrawal / 12)}</p>
                <p>Initial Annual Withdrawal: ₹${formatNumber(initialWithdrawal)}</p>
            </div>
        `;
    },
    
    bucketTableHeader() {
        return `
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
    },
    
    swpTableHeader() {
        return `
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
    },
    
    bucketRow(year, withdrawal, bucket1, bucket2, bucket3, total) {
        return `
            <tr>
                <td>${year}</td>
                <td>₹${formatNumber(withdrawal)}</td>
                <td>₹${formatNumber(bucket1)}</td>
                <td>₹${formatNumber(bucket2)}</td>
                <td>₹${formatNumber(bucket3)}</td>
                <td>₹${formatNumber(total)}</td>
            </tr>
        `;
    },
    
    swpRow(year, withdrawal, returns, corpus) {
        return `
            <tr>
                <td>${year}</td>
                <td>₹${formatNumber(withdrawal)}</td>
                <td>₹${formatNumber(returns)}</td>
                <td>₹${formatNumber(corpus)}</td>
            </tr>
        `;
    },
    
    depletedRow(year, withdrawal, colspan) {
        return `
            <tr class="depleted">
                <td>${year}</td>
                <td>₹${formatNumber(withdrawal)}</td>
                <td colspan="${colspan}">Corpus Depleted</td>
            </tr>
        `;
    },
    
    tableFooter() {
        return `</tbody></table></div>`;
    },
    
    resultMessage(depleted, year, maxYears) {
        if (depleted) {
            return `<p class="warning">Warning: Corpus depleted in year ${year}</p>`;
        } else {
            return `<p class="success">Corpus lasted through ${maxYears} years of retirement</p>`;
        }
    }
};

// Initialize the application
DOM.init();