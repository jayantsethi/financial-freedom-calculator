// Constants
const CALCULATOR_CONFIG = {
    maxSimulationYears: 50,
    maxSimulationAttempts: 100,
    corpusSearchStep: 100000,
    corpusSearchPrecision: 1000
};

// Utility functions
const formatNumber = (num) => {
    if (isNaN(num)) return '0.00';
    
    const numStr = Math.abs(num).toFixed(2);
    const [integerPart, decimalPart] = numStr.split('.');
    
    // Indian number formatting: last 3 digits, then groups of 2
    let formatted = '';
    const digits = integerPart.split('').reverse();
    
    for (let i = 0; i < digits.length; i++) {
        if (i === 3) {
            formatted = ',' + formatted;
        } else if (i > 3 && (i - 3) % 2 === 0) {
            formatted = ',' + formatted;
        }
        formatted = digits[i] + formatted;
    }
    
    return (num < 0 ? '-' : '') + formatted + '.' + decimalPart;
};

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
        const menuItems = document.querySelectorAll('.menu-item');
        const tabContents = document.querySelectorAll('.tab-content');
        const navToggle = document.getElementById('nav-toggle');
        const navContent = document.getElementById('nav-content');
        const navHeader = document.querySelector('.nav-header');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        // Initialize navigation state
        let isNavCollapsed = false;
        
        // Toggle navigation
        const toggleNavigation = () => {
            isNavCollapsed = !isNavCollapsed;
            navContent.classList.toggle('collapsed', isNavCollapsed);
            toggleIcon.style.transform = isNavCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
        };
        
        // Handle toggle button click
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNavigation();
        });
        
        // Handle header click (for mobile convenience)
        navHeader.addEventListener('click', (e) => {
            if (e.target !== navToggle && e.target !== toggleIcon) {
                toggleNavigation();
            }
        });
        
        // Handle menu item clicks
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get current active tab for analytics
                const currentActiveTab = document.querySelector('.menu-item.active')?.getAttribute('data-tab') || 'none';
                const newTab = item.getAttribute('data-tab');
                
                // Track tab switch
                Analytics.trackTabSwitch(currentActiveTab, newTab);
                
                // Remove active class from all items and contents
                menuItems.forEach(mi => mi.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Show corresponding tab
                const tabId = item.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                // Collapse navigation after selection
                if (isNavCollapsed === false) {
                    toggleNavigation();
                }
            });
        });
    },
    
    initializeCalculators() {
        document.getElementById('calculate-corpus').addEventListener('click', () => Calculators.corpus());
        document.getElementById('calculate-bucket').addEventListener('click', () => Calculators.bucketStrategy());
        document.getElementById('calculate-swp').addEventListener('click', () => Calculators.swpStrategy());
        document.getElementById('calculate-bucket-suggest').addEventListener('click', () => Calculators.suggestedBucket());
        document.getElementById('calculate-swp-suggest').addEventListener('click', () => Calculators.suggestedSWP());
        document.getElementById('calculate-epf').addEventListener('click', () => Calculators.epfCalculator());
        document.getElementById('calculate-ppf').addEventListener('click', () => Calculators.ppfCalculator());
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
        
        // Calculate the "perpetuity corpus" for 3-bucket strategy
        const weightedReturn = (inputs.returns.bucket1 * inputs.allocations.bucket1 + 
                               inputs.returns.bucket2 * inputs.allocations.bucket2 + 
                               inputs.returns.bucket3 * inputs.allocations.bucket3) / 100;
        
        const perpetuityCorpus = annualExpenseAtRetirement / (weightedReturn / 100);
        
        // Binary search to find minimum viable corpus for 3-bucket strategy
        let minCorpus = perpetuityCorpus * 0.8;
        let maxCorpus = perpetuityCorpus * 2.0; // More conservative upper bound for 3-bucket
        let bestCorpus = null;
        
        // Binary search for optimal 3-bucket corpus
        for (let i = 0; i < 100; i++) {
            const testCorpus = (minCorpus + maxCorpus) / 2;
            const result = Calculators.simulateBucketForMinimum(testCorpus, inputs);
            
            if (result.survives) {
                // Corpus works, try lower
                if (bestCorpus === null || testCorpus < bestCorpus) {
                    bestCorpus = testCorpus;
                }
                maxCorpus = testCorpus;
                
                // If final corpus is reasonable, we can stop
                if (result.finalCorpus < annualExpenseAtRetirement * 0.5) {
                    break;
                }
            } else {
                // Corpus too low, need higher
                minCorpus = testCorpus;
            }
            
            // Stop if range is small enough
            if ((maxCorpus - minCorpus) < 1000) {
                break;
            }
        }
        
        const suggestedCorpus = bestCorpus || perpetuityCorpus * 1.5; // Conservative fallback
        
        const customHeader = `
            <h3>Suggested 3-Bucket Corpus</h3>
            <div class="result-highlight">
                <span class="result-label">Optimized Corpus:</span>
                <span class="result-value">₹${formatNumber(suggestedCorpus)}</span>
            </div>
            <div class="summary">
                <p>Monthly Expense at Retirement: ₹${formatNumber(monthlyExpenseAtRetirement)}</p>
                <p>Weighted Average Return: ${weightedReturn.toFixed(2)}%</p>
                <p>This corpus is optimized to deplete by the end of ${inputs.retirementYears} years of retirement.</p>
            </div>
        `;
        
        const strategyInputs = { ...inputs, corpus: suggestedCorpus };
        Strategies.calculateBucketStrategyWithHeader(strategyInputs, 'bucket-suggest-result', inputs.retirementYears, customHeader);
    },
    
    simulateBucketForMinimum(corpus, inputs) {
        let bucket1 = corpus * inputs.allocations.bucket1 / 100;
        let bucket2 = corpus * inputs.allocations.bucket2 / 100;
        let bucket3 = corpus * inputs.allocations.bucket3 / 100;
        
        let withdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        for (let year = 1; year <= inputs.retirementYears; year++) {
            // Apply returns first (to match actual bucket strategy)
            bucket1 *= (1 + inputs.returns.bucket1 / 100);
            bucket2 *= (1 + inputs.returns.bucket2 / 100);
            bucket3 *= (1 + inputs.returns.bucket3 / 100);
            
            const totalBeforeWithdrawal = bucket1 + bucket2 + bucket3;
            
            // Check if we can withdraw
            if (totalBeforeWithdrawal < withdrawal) {
                return { survives: false, year: year, finalCorpus: totalBeforeWithdrawal };
            }
            
            // Then withdraw from buckets in order
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
        
        const finalCorpus = bucket1 + bucket2 + bucket3;
        return { survives: true, finalCorpus: finalCorpus };
    },
    
    simulateOptimalBucketStrategy(corpus, inputs) {
        let bucket1 = corpus * inputs.allocations.bucket1 / 100;
        let bucket2 = corpus * inputs.allocations.bucket2 / 100;
        let bucket3 = corpus * inputs.allocations.bucket3 / 100;
        
        let withdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        for (let year = 1; year <= inputs.retirementYears; year++) {
            // Apply returns
            bucket1 *= (1 + inputs.returns.bucket1 / 100);
            bucket2 *= (1 + inputs.returns.bucket2 / 100);
            bucket3 *= (1 + inputs.returns.bucket3 / 100);
            
            const totalBeforeWithdrawal = bucket1 + bucket2 + bucket3;
            
            if (totalBeforeWithdrawal < withdrawal) {
                return { success: false, year: year, finalCorpus: totalBeforeWithdrawal };
            }
            
            // Withdraw from buckets in order
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
            
            withdrawal *= (1 + inputs.inflation / 100);
        }
        
        const finalCorpus = bucket1 + bucket2 + bucket3;
        const initialWithdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        // Very strict criteria: final corpus should be less than 0.5% of initial withdrawal
        const maxAllowedLeftover = initialWithdrawal * 0.005;
        
        return { 
            success: finalCorpus <= maxAllowedLeftover,
            finalCorpus: finalCorpus 
        };
    },

    suggestedSWP() {
        const inputs = {
            currentExpense: getInputValue('suggest-swp-current-expense'),
            inflation: getInputValue('suggest-swp-inflation'),
            yearsToRetire: getIntValue('suggest-swp-years-to-retire'),
            retirementYears: getIntValue('suggest-swp-retirement-years', 30),
            expectedReturn: getInputValue('suggest-swp-return')
        };
        
        // Calculate monthly expense at retirement
        const monthlyExpenseAtRetirement = inputs.currentExpense * Math.pow(1 + inputs.inflation / 100, inputs.yearsToRetire);
        const annualExpenseAtRetirement = monthlyExpenseAtRetirement * 12;
        
        // Calculate the "perpetuity corpus" for SWP - the minimum where returns = withdrawals
        // For a perpetuity: Corpus * Return Rate = First Year Withdrawal
        // Therefore: Minimum Corpus = First Year Withdrawal / Return Rate
        const perpetuityCorpus = annualExpenseAtRetirement / (inputs.expectedReturn / 100);
        
        // Now we need to find a corpus that depletes to near zero
        // Start from perpetuity corpus and work upwards in small increments
        let requiredCorpus = perpetuityCorpus * 0.9; // Start slightly below perpetuity
        let step = annualExpenseAtRetirement * 0.05; // 5% of annual expense steps
        let lastWorkingCorpus = perpetuityCorpus * 4.0; // fallback - much higher
        
        // Use binary search to find optimal corpus
        // First, find if ANY corpus works by testing a wider range
        let testRange = perpetuityCorpus * 3.0;
        let foundWorking = false;
        
        // Test if a high corpus works
        for (let multiplier = 1.2; multiplier <= 3.0; multiplier += 0.2) {
            const testCorpus = perpetuityCorpus * multiplier;
            const result = Calculators.simulateSWPForMinimum(testCorpus, inputs);
            
            if (result.survives) {
                foundWorking = true;
                testRange = testCorpus;
                break;
            }
        }
        
        if (!foundWorking) {
            // Use a very conservative estimate
            testRange = perpetuityCorpus * 4.0;
        }
        
        let minCorpus = perpetuityCorpus * 0.8;
        let maxCorpus = testRange;
        let bestCorpus = null;
        
        // Binary search for optimal corpus
        for (let i = 0; i < 100; i++) {
            const testCorpus = (minCorpus + maxCorpus) / 2;
            const result = Calculators.simulateSWPForMinimum(testCorpus, inputs);
            
            if (result.survives) {
                // Corpus works, try lower
                if (bestCorpus === null || testCorpus < bestCorpus) {
                    bestCorpus = testCorpus;
                }
                maxCorpus = testCorpus;
                
                // If final corpus is reasonable, we can stop
                if (result.finalCorpus < annualExpenseAtRetirement * 0.5) {
                    break;
                }
            } else {
                // Corpus too low, need higher
                minCorpus = testCorpus;
            }
            
            // Stop if range is small enough
            if ((maxCorpus - minCorpus) < 1000) {
                break;
            }
        }
        
        const suggestedCorpus = bestCorpus || lastWorkingCorpus;
        
        const resultHTML = `
            <h3>Suggested SWP Corpus</h3>
            <div class="result-highlight">
                <span class="result-label">Optimized Corpus:</span>
                <span class="result-value">₹${formatNumber(suggestedCorpus)}</span>
            </div>
            <div class="summary">
                <p>Monthly Expense at Retirement: ₹${formatNumber(monthlyExpenseAtRetirement)}</p>
                <p>Expected Annual Return: ${inputs.expectedReturn}%</p>
                <p>Perpetuity Corpus (Reference): ₹${formatNumber(perpetuityCorpus)}</p>
                <p>This corpus is optimized to deplete by the end of ${inputs.retirementYears} years of retirement.</p>
            </div>
        `;
        DOM.updateResult('swp-suggest-result', resultHTML);
        
        const strategyInputs = { ...inputs, corpus: suggestedCorpus };
        Strategies.calculateSWPStrategy(strategyInputs, 'swp-suggest-result', inputs.retirementYears);
    },
    
    simulateSWPForMinimum(corpus, inputs) {
        let currentCorpus = corpus;
        let withdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        for (let year = 1; year <= inputs.retirementYears; year++) {
            // Apply returns first (to match actual SWP strategy)
            currentCorpus *= (1 + inputs.expectedReturn / 100);
            
            // Check if we can withdraw
            if (currentCorpus < withdrawal) {
                return { survives: false, year: year, finalCorpus: currentCorpus };
            }
            
            // Then withdraw
            currentCorpus -= withdrawal;
            
            withdrawal *= (1 + inputs.inflation / 100);
        }
        
        return { survives: true, finalCorpus: currentCorpus };
    },
    
    simulateOptimalSWPStrategy(corpus, inputs) {
        let currentCorpus = corpus;
        let withdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        for (let year = 1; year <= inputs.retirementYears; year++) {
            currentCorpus *= (1 + inputs.expectedReturn / 100);
            
            if (currentCorpus < withdrawal) {
                return { success: false, year: year };
            }
            
            currentCorpus -= withdrawal;
            withdrawal *= (1 + inputs.inflation / 100);
        }
        
        // Return success if final corpus is reasonably close to zero (within 50% of initial withdrawal)
        const initialWithdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        // Very strict criteria: final corpus should be less than 0.5% of initial withdrawal
        const maxAllowedLeftover = initialWithdrawal * 0.005;
        
        return { 
            success: currentCorpus <= maxAllowedLeftover,
            finalCorpus: currentCorpus 
        };
    },

    epfCalculator() {
        const currentCorpus = getInputValue('epf-current-corpus');
        const interestRate = getInputValue('epf-interest-rate');
        const yearlyContribution = getInputValue('epf-yearly-contribution');
        const contributionIncrease = getInputValue('epf-contribution-increase');
        const years = getIntValue('epf-years');

        // Track button click
        Analytics.trackButtonClick('calculate', 'epf_calculator');

        if (interestRate <= 0 || years <= 0) {
            showError('Please enter valid positive values for interest rate and years.');
            return;
        }

        // Track calculator usage with inputs
        Analytics.trackCalculatorUsage('epf_calculator', {
            current_corpus: currentCorpus,
            interest_rate: interestRate,
            yearly_contribution: yearlyContribution,
            contribution_increase: contributionIncrease,
            years: years
        });

        // Calculate future value of current corpus
        const currentCorpusFV = currentCorpus > 0 ? 
            FinancialCalculations.calculateFutureValue(currentCorpus, interestRate, years) : 0;
        
        // Calculate future value of yearly contributions with step-up
        const contributionsFV = yearlyContribution > 0 ? 
            FinancialCalculations.calculateSIPFutureValue(
                yearlyContribution / 12, // Convert yearly to monthly
                interestRate, 
                contributionIncrease, 
                years
            ) : 0;

        const totalFutureValue = currentCorpusFV + contributionsFV;

        // Track calculation result
        Analytics.trackCalculationResult('epf_calculator', totalFutureValue);

        const resultHtml = Templates.epfPpfResultWithContributions(
            'EPF',
            currentCorpus,
            yearlyContribution,
            contributionIncrease,
            interestRate,
            years,
            currentCorpusFV,
            contributionsFV,
            totalFutureValue
        );

        DOM.updateResult('epf-result', resultHtml);
    },

    ppfCalculator() {
        const currentCorpus = getInputValue('ppf-current-corpus');
        const interestRate = getInputValue('ppf-interest-rate');
        const yearlyContribution = getInputValue('ppf-yearly-contribution');
        const years = getIntValue('ppf-years');

        // Track button click
        Analytics.trackButtonClick('calculate', 'ppf_calculator');

        if (interestRate <= 0 || years <= 0) {
            showError('Please enter valid positive values for interest rate and years.');
            return;
        }

        // Track calculator usage with inputs
        Analytics.trackCalculatorUsage('ppf_calculator', {
            current_corpus: currentCorpus,
            interest_rate: interestRate,
            yearly_contribution: yearlyContribution,
            years: years
        });

        // Calculate future value of current corpus
        const currentCorpusFV = currentCorpus > 0 ? 
            FinancialCalculations.calculateFutureValue(currentCorpus, interestRate, years) : 0;
        
        // Calculate future value of yearly contributions (no step-up for PPF)
        const contributionsFV = yearlyContribution > 0 ? 
            FinancialCalculations.calculateSIPFutureValue(
                yearlyContribution / 12, // Convert yearly to monthly
                interestRate, 
                0, // No step-up for PPF
                years
            ) : 0;

        const totalFutureValue = currentCorpusFV + contributionsFV;

        // Track calculation result
        Analytics.trackCalculationResult('ppf_calculator', totalFutureValue);

        const resultHtml = Templates.epfPpfResultWithContributions(
            'PPF',
            currentCorpus,
            yearlyContribution,
            0, // No step-up for PPF
            interestRate,
            years,
            currentCorpusFV,
            contributionsFV,
            totalFutureValue
        );

        DOM.updateResult('ppf-result', resultHtml);
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
        ) + `
            <div class="summary">
                <p>Initial Corpus Allocation: Bucket 1: ₹${formatNumber(bucket1)}, Bucket 2: ₹${formatNumber(bucket2)}, Bucket 3: ₹${formatNumber(bucket3)}</p>
                <p>Total Initial Corpus: ₹${formatNumber(bucket1 + bucket2 + bucket3)}</p>
            </div>
        ` + Templates.bucketTableHeader();
        
        let year = 0; // Start from year 0 to show initial state
        let depleted = false;
        
        // Show initial state
        const initialTotal = bucket1 + bucket2 + bucket3;
        tableHTML += Templates.bucketRow(year, 0, bucket1, bucket2, bucket3, initialTotal);
        year = 1;
        
        while (!depleted && year <= maxYears) {
            // Apply returns first
            bucket1 *= (1 + inputs.returns.bucket1 / 100);
            bucket2 *= (1 + inputs.returns.bucket2 / 100);
            bucket3 *= (1 + inputs.returns.bucket3 / 100);
            
            const totalBeforeWithdrawal = bucket1 + bucket2 + bucket3;
            
            if (totalBeforeWithdrawal < withdrawal) {
                tableHTML += Templates.depletedRow(year, withdrawal, 4);
                depleted = true;
                break;
            }
            
            // Withdraw from buckets in order
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
            
            const totalAfterWithdrawal = bucket1 + bucket2 + bucket3;
            tableHTML += Templates.bucketRow(year, withdrawal, bucket1, bucket2, bucket3, totalAfterWithdrawal);
            
            withdrawal *= (1 + inputs.inflation / 100);
            year++;
        }
        
        tableHTML += Templates.tableFooter();
        tableHTML += Templates.resultMessage(depleted, year, maxYears);
        
        DOM.updateResult(resultElementId, tableHTML);
    },
    
    calculateBucketStrategyWithHeader(inputs, resultElementId, maxYears = CALCULATOR_CONFIG.maxSimulationYears, customHeader = '') {
        let bucket1 = inputs.corpus * inputs.allocations.bucket1 / 100;
        let bucket2 = inputs.corpus * inputs.allocations.bucket2 / 100;
        let bucket3 = inputs.corpus * inputs.allocations.bucket3 / 100;
        
        let withdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        const initialWithdrawal = withdrawal;
        
        let tableHTML = customHeader + Templates.strategyHeader(
            '3-Bucket Withdrawal Strategy',
            initialWithdrawal
        ) + `
            <div class="summary">
                <p>Initial Corpus Allocation: Bucket 1: ₹${formatNumber(bucket1)}, Bucket 2: ₹${formatNumber(bucket2)}, Bucket 3: ₹${formatNumber(bucket3)}</p>
                <p>Total Initial Corpus: ₹${formatNumber(bucket1 + bucket2 + bucket3)}</p>
            </div>
        ` + Templates.bucketTableHeader();
        
        let year = 0; // Start from year 0 to show initial state
        let depleted = false;
        
        // Show initial state
        const initialTotal = bucket1 + bucket2 + bucket3;
        tableHTML += Templates.bucketRow(year, 0, bucket1, bucket2, bucket3, initialTotal);
        year = 1;
        
        while (!depleted && year <= maxYears) {
            // Apply returns first
            bucket1 *= (1 + inputs.returns.bucket1 / 100);
            bucket2 *= (1 + inputs.returns.bucket2 / 100);
            bucket3 *= (1 + inputs.returns.bucket3 / 100);
            
            const totalBeforeWithdrawal = bucket1 + bucket2 + bucket3;
            
            if (totalBeforeWithdrawal < withdrawal) {
                tableHTML += Templates.depletedRow(year, withdrawal, 4);
                depleted = true;
                break;
            }
            
            // Withdraw from buckets in order
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
            
            const totalAfterWithdrawal = bucket1 + bucket2 + bucket3;
            tableHTML += Templates.bucketRow(year, withdrawal, bucket1, bucket2, bucket3, totalAfterWithdrawal);
            
            withdrawal *= (1 + inputs.inflation / 100);
            year++;
        }
        
        tableHTML += Templates.tableFooter();
        tableHTML += Templates.resultMessage(depleted, year, maxYears);
        
        DOM.updateResult(resultElementId, tableHTML);
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
        ) + `
            <div class="summary">
                <p>Initial Corpus: ₹${formatNumber(currentCorpus)}</p>
                <p>Expected Annual Return: ${inputs.expectedReturn}%</p>
            </div>
        ` + Templates.swpTableHeader();
        
        let year = 0; // Start from year 0 to show initial state
        let depleted = false;
        
        // Show initial state
        tableHTML += Templates.swpRow(year, 0, 0, currentCorpus);
        year = 1;
        
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
        
        DOM.updateResult(resultElementId, tableHTML);
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
    },

    epfPpfResult(type, currentCorpus, interestRate, years, futureValue) {
        const growth = futureValue - currentCorpus;
        const growthPercentage = ((futureValue - currentCorpus) / currentCorpus * 100).toFixed(2);
        
        return `
            <div class="result-summary">
                <h3>${type} Corpus Calculation Results</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="label">Current ${type} Corpus:</span>
                        <span class="value">₹${formatNumber(currentCorpus)}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Interest Rate:</span>
                        <span class="value">${interestRate}% per annum</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Years to Retirement:</span>
                        <span class="value">${years} years</span>
                    </div>
                    <div class="result-item highlight">
                        <span class="label">Total ${type} Corpus at Retirement:</span>
                        <span class="value">₹${formatNumber(futureValue)}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Total Growth:</span>
                        <span class="value">₹${formatNumber(growth)} (${growthPercentage}%)</span>
                    </div>
                </div>
            </div>
        `;
    },

    epfPpfResultWithContributions(type, currentCorpus, yearlyContribution, contributionIncrease, interestRate, years, currentCorpusFV, contributionsFV, totalFutureValue) {
        const totalInvestment = currentCorpus + (yearlyContribution * years);
        const totalGrowth = totalFutureValue - totalInvestment;
        const growthPercentage = totalInvestment > 0 ? ((totalGrowth / totalInvestment) * 100).toFixed(2) : '0.00';
        
        return `
            <div class="result-summary">
                <h3>${type} Corpus Calculation Results</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="label">Current ${type} Corpus:</span>
                        <span class="value">₹${formatNumber(currentCorpus)}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Yearly Contribution:</span>
                        <span class="value">₹${formatNumber(yearlyContribution)}</span>
                    </div>
                    ${contributionIncrease > 0 ? `
                    <div class="result-item">
                        <span class="label">Yearly Increase in Contribution:</span>
                        <span class="value">${contributionIncrease}% per annum</span>
                    </div>` : ''}
                    <div class="result-item">
                        <span class="label">Interest Rate:</span>
                        <span class="value">${interestRate}% per annum</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Years to Retirement:</span>
                        <span class="value">${years} years</span>
                    </div>
                    <div class="result-breakdown">
                        <h4>Breakdown:</h4>
                        <div class="result-item">
                            <span class="label">Future Value of Current Corpus:</span>
                            <span class="value">₹${formatNumber(currentCorpusFV)}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Future Value of Contributions:</span>
                            <span class="value">₹${formatNumber(contributionsFV)}</span>
                        </div>
                    </div>
                    <div class="result-item highlight">
                        <span class="label">Total ${type} Corpus at Retirement:</span>
                        <span class="value">₹${formatNumber(totalFutureValue)}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Total Investment:</span>
                        <span class="value">₹${formatNumber(totalInvestment)}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Total Growth:</span>
                        <span class="value">₹${formatNumber(totalGrowth)} (${growthPercentage}%)</span>
                    </div>
                </div>
            </div>
        `;
    }
};

// Analytics Tracking Functions
const Analytics = {
    // Track calculator usage
    trackCalculatorUsage(calculatorType, inputs = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculator_used', {
                'calculator_type': calculatorType,
                'custom_parameters': inputs
            });
        }
    },

    // Track tab switches
    trackTabSwitch(fromTab, toTab) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'tab_switch', {
                'from_tab': fromTab,
                'to_tab': toTab
            });
        }
    },

    // Track button clicks
    trackButtonClick(buttonType, calculatorType) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'button_click', {
                'button_type': buttonType,
                'calculator_type': calculatorType
            });
        }
    },

    // Track user engagement (time spent on calculator)
    trackEngagement(calculatorType, timeSpent) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'user_engagement', {
                'calculator_type': calculatorType,
                'engagement_time_msec': timeSpent
            });
        }
    },

    // Track calculation results
    trackCalculationResult(calculatorType, resultValue) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculation_completed', {
                'calculator_type': calculatorType,
                'result_value': resultValue,
                'currency': 'INR'
            });
        }
    }
};

// Initialize the application
DOM.init();