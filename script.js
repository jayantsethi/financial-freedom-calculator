// Constants
const CALCULATOR_CONFIG = {
    maxSimulationYears: 50,
    maxSimulationAttempts: 100,
    corpusSearchStep: 50000,
    corpusSearchPrecision: 500
};

// Global corpus storage for summation
const GlobalCorpus = {
    equity: 0,
    epf: 0,
    ppf: 0,
    fd: 0,
    
    getTotal() {
        return this.equity + this.epf + this.ppf + this.fd;
    },
    
    updateCorpus(type, value) {
        this[type] = value;
        this.updateWithdrawalStrategyCorpus();
    },
    
    updateWithdrawalStrategyCorpus() {
        const total = this.getTotal();
        if (total > 0) {
            document.getElementById('bucket-corpus').value = total.toFixed(2);
            document.getElementById('swp-corpus').value = total.toFixed(2);
        }
    }
};

// Modal System
const Modal = {
    show(message, type = 'info', autoClose = true) {
        // Remove existing modal if any
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal-content modal-${type}">
                    <div class="modal-message">${message}</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add click handler to close modal when clicking outside
        const modalOverlay = document.querySelector('.modal-overlay');
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.hide();
            }
        });
        
        if (autoClose) {
            setTimeout(() => {
                this.hide();
            }, 3000);
        }
    },
    
    hide() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }
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
    Modal.show(message, 'error');
};

// DOM Management
const DOM = {
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeHamburgerMenu();
            this.initializeDropdowns();
            this.initializeTabs();
            this.initializeCalculators();
            this.initializeInputListeners();
            this.hideEmptyResults();
        });
    },
    
    initializeHamburgerMenu() {
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const mobileNav = document.getElementById('mobile-nav');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        
        // Toggle hamburger menu
        hamburgerMenu.addEventListener('click', () => {
            hamburgerMenu.classList.toggle('active');
            mobileNav.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (mobileNav.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Handle mobile navigation category toggles
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const navItem = link.closest('.mobile-nav-item');
                const isActive = navItem.classList.contains('active');
                
                // Close all other mobile nav items
                document.querySelectorAll('.mobile-nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Toggle current item
                if (!isActive) {
                    navItem.classList.add('active');
                }
            });
        });
        
        // Close mobile menu when clicking outside
        mobileNav.addEventListener('click', (e) => {
            if (e.target === mobileNav) {
                hamburgerMenu.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close mobile menu when clicking on a submenu item
        const mobileSubmenuItems = document.querySelectorAll('.mobile-submenu-item');
        mobileSubmenuItems.forEach(item => {
            item.addEventListener('click', () => {
                hamburgerMenu.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    },
    
    initializeDropdowns() {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const dropdown = toggle.closest('.dropdown');
                const isActive = dropdown.classList.contains('active');
                
                // Close all other dropdowns
                document.querySelectorAll('.dropdown').forEach(d => {
                    d.classList.remove('active');
                });
                
                // Toggle current dropdown
                if (!isActive) {
                    dropdown.classList.add('active');
                }
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(d => {
                    d.classList.remove('active');
                });
            }
        });
    },
    
    initializeTabs() {
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        const mobileSubmenuItems = document.querySelectorAll('.mobile-submenu-item');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Handle dropdown item clicks (desktop)
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get current active tab for analytics
                const currentActiveTab = document.querySelector('.dropdown-item.active')?.getAttribute('data-tab') || 'none';
                const newTab = item.getAttribute('data-tab');
                
                // Track tab switch
                Analytics.trackTabSwitch(currentActiveTab, newTab);
                
                // Remove active class from all items and contents
                dropdownItems.forEach(di => di.classList.remove('active'));
                mobileSubmenuItems.forEach(mi => mi.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Show corresponding tab
                const tabId = item.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                // Close dropdown
                document.querySelectorAll('.dropdown').forEach(d => {
                    d.classList.remove('active');
                });
            });
        });
        
        // Handle mobile submenu item clicks
        mobileSubmenuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get current active tab for analytics
                const currentActiveTab = document.querySelector('.mobile-submenu-item.active')?.getAttribute('data-tab') || 'none';
                const newTab = item.getAttribute('data-tab');
                
                // Track tab switch
                Analytics.trackTabSwitch(currentActiveTab, newTab);
                
                // Remove active class from all items and contents
                dropdownItems.forEach(di => di.classList.remove('active'));
                mobileSubmenuItems.forEach(mi => mi.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Show corresponding tab
                const tabId = item.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
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
        document.getElementById('calculate-fd').addEventListener('click', () => Calculators.fdCalculator());
    },
    
    initializeInputListeners() {
        // Add input change listeners for suggested corpus calculators
        const bucketSuggestInputs = [
            'suggest-current-expense',
            'suggest-inflation',
            'suggest-years-to-retire',
            'suggest-retirement-years',
            'suggest-bucket1-return',
            'suggest-bucket2-return',
            'suggest-bucket3-return',
            'suggest-bucket1-allocation',
            'suggest-bucket2-allocation',
            'suggest-bucket3-allocation'
        ];
        
        const swpSuggestInputs = [
            'suggest-swp-current-expense',
            'suggest-swp-inflation',
            'suggest-swp-years-to-retire',
            'suggest-swp-retirement-years',
            'suggest-swp-return'
        ];
        
        bucketSuggestInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    // Clear the result when inputs change
                    document.getElementById('bucket-suggest-result').innerHTML = '';
                    DOM.hideEmptyResults();
                });
            }
        });
        
        swpSuggestInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    // Clear the result when inputs change
                    document.getElementById('swp-suggest-result').innerHTML = '';
                    DOM.hideEmptyResults();
                });
            }
        });
    },
    
    hideEmptyResults() {
        const resultElements = document.querySelectorAll('.result');
        resultElements.forEach(element => {
            if (element.innerHTML.trim() === '') {
                element.style.display = 'none';
            } else {
                element.style.display = 'block';
            }
        });
    },
    
    updateResult(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
            DOM.hideEmptyResults();
        }
    },
    
    appendResult(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML += html;
            DOM.hideEmptyResults();
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
        
        // Update global corpus
        GlobalCorpus.updateCorpus('equity', totalCorpus);
        
        const resultHTML = Templates.corpusResult(lumpsumFutureValue, sipFutureValue, totalCorpus);
        DOM.updateResult('corpus-result', resultHTML);
    },

    fdCalculator() {
        const inputs = {
            currentAmount: getInputValue('fd-current-amount'),
            interestRate: getInputValue('fd-interest-rate'),
            monthlyInvestment: getInputValue('fd-monthly-investment'),
            investmentStepup: getInputValue('fd-investment-stepup'),
            years: getIntValue('fd-years')
        };
        
        const currentAmountFV = FinancialCalculations.calculateFutureValue(
            inputs.currentAmount, inputs.interestRate, inputs.years
        );
        
        const monthlyInvestmentFV = FinancialCalculations.calculateSIPFutureValue(
            inputs.monthlyInvestment, inputs.interestRate, inputs.investmentStepup, inputs.years
        );
        
        const totalCorpus = currentAmountFV + monthlyInvestmentFV;
        
        // Update global corpus
        GlobalCorpus.updateCorpus('fd', totalCorpus);
        
        const resultHTML = Templates.fdResult(inputs.currentAmount, currentAmountFV, inputs.monthlyInvestment, monthlyInvestmentFV, totalCorpus);
        DOM.updateResult('fd-result', resultHTML);
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
        
        const initialWithdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        const resultHTML = Templates.strategyHeader('3-Bucket Withdrawal Strategy', initialWithdrawal);
        DOM.updateResult('bucket-result', resultHTML);
        
        FinancialCalculations.calculateBucketStrategy(inputs, 'bucket-result', CALCULATOR_CONFIG.maxSimulationYears);
    },

    swpStrategy() {
        const inputs = {
            currentExpense: getInputValue('swp-current-expense'),
            inflation: getInputValue('swp-inflation'),
            yearsToRetire: getIntValue('swp-years-to-retire'),
            corpus: getInputValue('swp-corpus'),
            return: getInputValue('swp-return')
        };
        
        const initialWithdrawal = FinancialCalculations.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        const resultHTML = Templates.strategyHeader('SWP Withdrawal Strategy', initialWithdrawal);
        DOM.updateResult('swp-result', resultHTML);
        
        FinancialCalculations.calculateSWPStrategy(inputs, 'swp-result', CALCULATOR_CONFIG.maxSimulationYears);
    },

    suggestedBucket() {
        const inputs = {
            currentExpense: getInputValue('suggest-current-expense'),
            inflation: getInputValue('suggest-inflation'),
            yearsToRetire: getIntValue('suggest-years-to-retire'),
            retirementYears: getIntValue('suggest-retirement-years'),
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
        
        const optimalCorpus = FinancialCalculations.findOptimalBucketCorpus(inputs);
        
        const resultHTML = Templates.suggestedCorpusResult('Suggested 3-Bucket Corpus', optimalCorpus, inputs.retirementYears);
        DOM.updateResult('bucket-suggest-result', resultHTML);
        
        // Simulate the strategy with the suggested corpus
        const simulationInputs = {
            ...inputs,
            corpus: optimalCorpus
        };
        
        FinancialCalculations.calculateBucketStrategyWithHeader(
            simulationInputs, 
            'bucket-suggest-result', 
            inputs.retirementYears,
            '<h3>Simulation with Suggested Corpus:</h3>'
        );
    },

    simulateBucketForMinimum(corpus, inputs) {
        const simulationInputs = {
            ...inputs,
            corpus: corpus
        };
        
        const result = FinancialCalculations.simulateBucketStrategy(corpus, inputs);
        
        if (result.depleted) {
            return false;
        }
        
        return true;
    },

    simulateOptimalBucketStrategy(corpus, inputs) {
        const simulationInputs = {
            ...inputs,
            corpus: corpus
        };
        
        const result = FinancialCalculations.simulateBucketStrategy(corpus, inputs);
        
        if (result.depleted) {
            return false;
        }
        
        return true;
    },

    suggestedSWP() {
        const inputs = {
            currentExpense: getInputValue('suggest-swp-current-expense'),
            inflation: getInputValue('suggest-swp-inflation'),
            yearsToRetire: getIntValue('suggest-swp-years-to-retire'),
            retirementYears: getIntValue('suggest-swp-retirement-years'),
            return: getInputValue('suggest-swp-return')
        };
        
        const optimalCorpus = FinancialCalculations.findOptimalSWPCorpus(inputs);
        
        const resultHTML = Templates.suggestedCorpusResult('Suggested SWP Corpus', optimalCorpus, inputs.retirementYears);
        DOM.updateResult('swp-suggest-result', resultHTML);
        
        // Simulate the strategy with the suggested corpus
        const simulationInputs = {
            ...inputs,
            corpus: optimalCorpus
        };
        
        FinancialCalculations.calculateSWPStrategy(simulationInputs, 'swp-suggest-result', inputs.retirementYears);
    },

    simulateSWPForMinimum(corpus, inputs) {
        const simulationInputs = {
            ...inputs,
            corpus: corpus
        };
        
        const result = FinancialCalculations.simulateSWPStrategy(corpus, inputs);
        
        if (result.depleted) {
            return false;
        }
        
        return true;
    },

    simulateOptimalSWPStrategy(corpus, inputs) {
        const simulationInputs = {
            ...inputs,
            corpus: corpus
        };
        
        const result = FinancialCalculations.simulateSWPStrategy(corpus, inputs);
        
        if (result.depleted) {
            return false;
        }
        
        return true;
    },

    epfCalculator() {
        const inputs = {
            currentCorpus: getInputValue('epf-current-corpus'),
            interestRate: getInputValue('epf-interest-rate'),
            yearlyContribution: getInputValue('epf-yearly-contribution'),
            contributionIncrease: getInputValue('epf-contribution-increase'),
            years: getIntValue('epf-years')
        };
        
        const currentCorpusFV = FinancialCalculations.calculateFutureValue(
            inputs.currentCorpus, inputs.interestRate, inputs.years
        );
        
        const contributionsFV = FinancialCalculations.calculateSIPFutureValue(
            inputs.yearlyContribution / 12, // Convert yearly to monthly
            inputs.interestRate,
            inputs.contributionIncrease,
            inputs.years
        );
        
        const totalFutureValue = currentCorpusFV + contributionsFV;
        
        // Update global corpus
        GlobalCorpus.updateCorpus('epf', totalFutureValue);
        
        const resultHTML = Templates.epfPpfResultWithContributions(
            'EPF', 
            inputs.currentCorpus, 
            inputs.yearlyContribution, 
            inputs.contributionIncrease, 
            inputs.interestRate, 
            inputs.years, 
            currentCorpusFV, 
            contributionsFV, 
            totalFutureValue
        );
        DOM.updateResult('epf-result', resultHTML);
    },

    ppfCalculator() {
        const inputs = {
            currentCorpus: getInputValue('ppf-current-corpus'),
            interestRate: getInputValue('ppf-interest-rate'),
            yearlyContribution: getInputValue('ppf-yearly-contribution'),
            years: getIntValue('ppf-years')
        };
        
        const currentCorpusFV = FinancialCalculations.calculateFutureValue(
            inputs.currentCorpus, inputs.interestRate, inputs.years
        );
        
        const contributionsFV = FinancialCalculations.calculateSIPFutureValue(
            inputs.yearlyContribution / 12, // Convert yearly to monthly
            inputs.interestRate,
            0, // No step-up for PPF
            inputs.years
        );
        
        const totalFutureValue = currentCorpusFV + contributionsFV;
        
        // Update global corpus
        GlobalCorpus.updateCorpus('ppf', totalFutureValue);
        
        const resultHTML = Templates.epfPpfResultWithContributions(
            'PPF', 
            inputs.currentCorpus, 
            inputs.yearlyContribution, 
            0, // No step-up
            inputs.interestRate, 
            inputs.years, 
            currentCorpusFV, 
            contributionsFV, 
            totalFutureValue
        );
        DOM.updateResult('ppf-result', resultHTML);
    }
};

// Financial Calculations
const FinancialCalculations = {
    calculateFutureValue(principal, rate, years) {
        if (rate === 0) return principal;
        return principal * Math.pow(1 + rate / 100, years);
    },

    calculateSIPFutureValue(sip, cagr, stepup, years) {
        if (cagr === 0) return sip * 12 * years;
        
        let total = 0;
        for (let year = 1; year <= years; year++) {
            const monthlySIP = sip * Math.pow(1 + stepup / 100, year - 1);
            const yearFV = monthlySIP * 12 * Math.pow(1 + cagr / 100, years - year + 1);
            total += yearFV;
        }
        return total;
    },

    calculateInitialWithdrawal(currentExpense, inflation, yearsToRetire) {
        // currentExpense is monthly, so we need to calculate annual expense at retirement
        const monthlyExpenseAtRetirement = currentExpense * Math.pow(1 + inflation / 100, yearsToRetire);
        return monthlyExpenseAtRetirement * 12; // Return annual expense
    },

    calculateRealReturn(expectedReturn, inflation) {
        return ((1 + expectedReturn / 100) / (1 + inflation / 100) - 1) * 100;
    },

    findOptimalBucketCorpus(inputs) {
        // Calculate initial withdrawal amount (annual)
        const initialWithdrawal = this.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        // Start with a more precise estimate - closer to actual needs
        let low = initialWithdrawal * inputs.retirementYears * 0.5;
        let high = initialWithdrawal * inputs.retirementYears * 1.5;
        let optimalCorpus = high;
        
        // Ensure we have a valid range
        if (low <= 0) low = initialWithdrawal * 5;
        if (high <= low) high = low * 2;
        
        for (let attempt = 0; attempt < CALCULATOR_CONFIG.maxSimulationAttempts; attempt++) {
            const mid = (low + high) / 2;
            const result = this.simulateBucketStrategy(mid, inputs);
            
            if (!result.depleted) {
                optimalCorpus = mid;
                high = mid;
            } else {
                low = mid;
            }
            
            if (high - low < CALCULATOR_CONFIG.corpusSearchPrecision) {
                break;
            }
        }
        
        // Round up to nearest step
        return Math.ceil(optimalCorpus / CALCULATOR_CONFIG.corpusSearchStep) * CALCULATOR_CONFIG.corpusSearchStep;
    },

    findOptimalSWPCorpus(inputs) {
        // Calculate initial withdrawal amount (annual)
        const initialWithdrawal = this.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        // Start with a more precise estimate - closer to actual needs
        let low = initialWithdrawal * inputs.retirementYears * 0.5;
        let high = initialWithdrawal * inputs.retirementYears * 1.5;
        let optimalCorpus = high;
        
        // Ensure we have a valid range
        if (low <= 0) low = initialWithdrawal * 5;
        if (high <= low) high = low * 2;
        
        for (let attempt = 0; attempt < CALCULATOR_CONFIG.maxSimulationAttempts; attempt++) {
            const mid = (low + high) / 2;
            const result = this.simulateSWPStrategy(mid, inputs);
            
            if (!result.depleted) {
                optimalCorpus = mid;
                high = mid;
            } else {
                low = mid;
            }
            
            if (high - low < CALCULATOR_CONFIG.corpusSearchPrecision) {
                break;
            }
        }
        
        // Round up to nearest step
        return Math.ceil(optimalCorpus / CALCULATOR_CONFIG.corpusSearchStep) * CALCULATOR_CONFIG.corpusSearchStep;
    },

    simulateBucketStrategy(corpus, inputs) {
        const initialWithdrawal = this.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        let bucket1 = corpus * inputs.allocations.bucket1 / 100;
        let bucket2 = corpus * inputs.allocations.bucket2 / 100;
        let bucket3 = corpus * inputs.allocations.bucket3 / 100;
        
        let currentWithdrawal = initialWithdrawal;
        
        for (let year = 1; year <= inputs.retirementYears; year++) {
            // Withdraw from bucket 1 first
            if (bucket1 >= currentWithdrawal) {
                bucket1 -= currentWithdrawal;
            } else {
                const remaining = currentWithdrawal - bucket1;
                bucket1 = 0;
                
                if (bucket2 >= remaining) {
                    bucket2 -= remaining;
                } else {
                    const finalRemaining = remaining - bucket2;
                    bucket2 = 0;
                    
                    if (bucket3 >= finalRemaining) {
                        bucket3 -= finalRemaining;
                    } else {
                        return { depleted: true, year };
                    }
                }
            }
            
            // Rebalance and grow
            const total = bucket1 + bucket2 + bucket3;
            bucket1 = total * inputs.allocations.bucket1 / 100 * (1 + inputs.returns.bucket1 / 100);
            bucket2 = total * inputs.allocations.bucket2 / 100 * (1 + inputs.returns.bucket2 / 100);
            bucket3 = total * inputs.allocations.bucket3 / 100 * (1 + inputs.returns.bucket3 / 100);
            
            // Increase withdrawal for inflation
            currentWithdrawal *= (1 + inputs.inflation / 100);
        }
        
        return { depleted: false, year: inputs.retirementYears };
    },

    calculateBucketStrategy(inputs, resultElementId, maxYears = CALCULATOR_CONFIG.maxSimulationYears) {
        const initialWithdrawal = this.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        let bucket1 = inputs.corpus * inputs.allocations.bucket1 / 100;
        let bucket2 = inputs.corpus * inputs.allocations.bucket2 / 100;
        let bucket3 = inputs.corpus * inputs.allocations.bucket3 / 100;
        
        let currentWithdrawal = initialWithdrawal;
        let depleted = false;
        let depletedYear = 0;
        
        let tableHTML = Templates.bucketTableHeader();
        
        for (let year = 1; year <= maxYears; year++) {
            const yearStartTotal = bucket1 + bucket2 + bucket3;
            
            // Withdraw from bucket 1 first
            if (bucket1 >= currentWithdrawal) {
                bucket1 -= currentWithdrawal;
            } else {
                const remaining = currentWithdrawal - bucket1;
                bucket1 = 0;
                
                if (bucket2 >= remaining) {
                    bucket2 -= remaining;
                } else {
                    const finalRemaining = remaining - bucket2;
                    bucket2 = 0;
                    
                    if (bucket3 >= finalRemaining) {
                        bucket3 -= finalRemaining;
                    } else {
                        depleted = true;
                        depletedYear = year;
                        tableHTML += Templates.depletedRow(year, currentWithdrawal, 5);
                        break;
                    }
                }
            }
            
            const yearEndTotal = bucket1 + bucket2 + bucket3;
            
            tableHTML += Templates.bucketRow(
                year, 
                currentWithdrawal, 
                bucket1, 
                bucket2, 
                bucket3, 
                yearEndTotal
            );
            
            // Rebalance and grow
            bucket1 = yearEndTotal * inputs.allocations.bucket1 / 100 * (1 + inputs.returns.bucket1 / 100);
            bucket2 = yearEndTotal * inputs.allocations.bucket2 / 100 * (1 + inputs.returns.bucket2 / 100);
            bucket3 = yearEndTotal * inputs.allocations.bucket3 / 100 * (1 + inputs.returns.bucket3 / 100);
            
            // Increase withdrawal for inflation
            currentWithdrawal *= (1 + inputs.inflation / 100);
        }
        
        tableHTML += Templates.tableFooter();
        tableHTML += Templates.resultMessage(depleted, depletedYear, maxYears);
        
        DOM.appendResult(resultElementId, tableHTML);
    },

    calculateBucketStrategyWithHeader(inputs, resultElementId, maxYears = CALCULATOR_CONFIG.maxSimulationYears, customHeader = '') {
        const initialWithdrawal = this.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        let bucket1 = inputs.corpus * inputs.allocations.bucket1 / 100;
        let bucket2 = inputs.corpus * inputs.allocations.bucket2 / 100;
        let bucket3 = inputs.corpus * inputs.allocations.bucket3 / 100;
        
        let currentWithdrawal = initialWithdrawal;
        let depleted = false;
        let depletedYear = 0;
        
        let tableHTML = customHeader + Templates.bucketTableHeader();
        
        for (let year = 1; year <= maxYears; year++) {
            const yearStartTotal = bucket1 + bucket2 + bucket3;
            
            // Withdraw from bucket 1 first
            if (bucket1 >= currentWithdrawal) {
                bucket1 -= currentWithdrawal;
            } else {
                const remaining = currentWithdrawal - bucket1;
                bucket1 = 0;
                
                if (bucket2 >= remaining) {
                    bucket2 -= remaining;
                } else {
                    const finalRemaining = remaining - bucket2;
                    bucket2 = 0;
                    
                    if (bucket3 >= finalRemaining) {
                        bucket3 -= finalRemaining;
                    } else {
                        depleted = true;
                        depletedYear = year;
                        tableHTML += Templates.depletedRow(year, currentWithdrawal, 5);
                        break;
                    }
                }
            }
            
            const yearEndTotal = bucket1 + bucket2 + bucket3;
            
            tableHTML += Templates.bucketRow(
                year, 
                currentWithdrawal, 
                bucket1, 
                bucket2, 
                bucket3, 
                yearEndTotal
            );
            
            // Rebalance and grow
            bucket1 = yearEndTotal * inputs.allocations.bucket1 / 100 * (1 + inputs.returns.bucket1 / 100);
            bucket2 = yearEndTotal * inputs.allocations.bucket2 / 100 * (1 + inputs.returns.bucket2 / 100);
            bucket3 = yearEndTotal * inputs.allocations.bucket3 / 100 * (1 + inputs.returns.bucket3 / 100);
            
            // Increase withdrawal for inflation
            currentWithdrawal *= (1 + inputs.inflation / 100);
        }
        
        tableHTML += Templates.tableFooter();
        tableHTML += Templates.resultMessage(depleted, depletedYear, maxYears);
        
        DOM.appendResult(resultElementId, tableHTML);
    },

    calculateSWPStrategy(inputs, resultElementId, maxYears = CALCULATOR_CONFIG.maxSimulationYears) {
        const initialWithdrawal = this.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        let corpus = inputs.corpus;
        let currentWithdrawal = initialWithdrawal;
        let depleted = false;
        let depletedYear = 0;
        
        let tableHTML = Templates.swpTableHeader();
        
        for (let year = 1; year <= maxYears; year++) {
            if (corpus < currentWithdrawal) {
                depleted = true;
                depletedYear = year;
                tableHTML += Templates.depletedRow(year, currentWithdrawal, 3);
                break;
            }
            
            corpus -= currentWithdrawal;
            const returns = corpus * inputs.return / 100;
            corpus += returns;
            
            tableHTML += Templates.swpRow(year, currentWithdrawal, returns, corpus);
            
            // Increase withdrawal for inflation
            currentWithdrawal *= (1 + inputs.inflation / 100);
        }
        
        tableHTML += Templates.tableFooter();
        tableHTML += Templates.resultMessage(depleted, depletedYear, maxYears);
        
        DOM.appendResult(resultElementId, tableHTML);
    },

    simulateSWPStrategy(corpus, inputs) {
        const initialWithdrawal = this.calculateInitialWithdrawal(
            inputs.currentExpense, inputs.inflation, inputs.yearsToRetire
        );
        
        let currentCorpus = corpus;
        let currentWithdrawal = initialWithdrawal;
        
        for (let year = 1; year <= inputs.retirementYears; year++) {
            if (currentCorpus < currentWithdrawal) {
                return { depleted: true, year };
            }
            
            currentCorpus -= currentWithdrawal;
            const returns = currentCorpus * inputs.return / 100;
            currentCorpus += returns;
            
            // Increase withdrawal for inflation
            currentWithdrawal *= (1 + inputs.inflation / 100);
        }
        
        return { depleted: false, year: inputs.retirementYears };
    }
};

// Templates
const Templates = {
    corpusResult(lumpsumFV, sipFV, total) {
        return `
            <div class="result-grid">
                <div class="result-item">
                    <div class="result-label">Lumpsum Future Value</div>
                    <div class="result-value">₹${formatNumber(lumpsumFV)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">SIP Future Value</div>
                    <div class="result-value">₹${formatNumber(sipFV)}</div>
                </div>
                <div class="result-item highlight">
                    <div class="result-label">Total Corpus</div>
                    <div class="result-value">₹${formatNumber(total)}</div>
                </div>
            </div>
        `;
    },

    fdResult(currentAmount, currentAmountFV, monthlyInvestment, monthlyInvestmentFV, total) {
        return `
            <div class="result-grid">
                <div class="result-item">
                    <div class="result-label">Current FD Future Value</div>
                    <div class="result-value">₹${formatNumber(currentAmountFV)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Monthly FD Future Value</div>
                    <div class="result-value">₹${formatNumber(monthlyInvestmentFV)}</div>
                </div>
                <div class="result-item highlight">
                    <div class="result-label">Total FD Corpus</div>
                    <div class="result-value">₹${formatNumber(total)}</div>
                </div>
            </div>
        `;
    },

    suggestedCorpusResult(title, corpus, years) {
        return `
            <div class="result-highlight">
                ${title}: ₹${formatNumber(corpus)}
            </div>
            <div class="summary">
                <p><strong>This corpus is designed to last for ${years} years in retirement.</strong></p>
                <p>The calculation assumes your expenses will increase with inflation and your portfolio will generate returns to sustain your withdrawals.</p>
            </div>
        `;
    },

    strategyHeader(title, initialWithdrawal) {
        return `
            <div class="result-highlight">
                ${title}
            </div>
            <div class="summary">
                <p><strong>Initial Annual Withdrawal:</strong> ₹${formatNumber(initialWithdrawal)}</p>
                <p>This amount will increase annually with inflation to maintain your purchasing power.</p>
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
                            <th>Total</th>
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
                            <th>Returns</th>
                            <th>Corpus</th>
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
                <td colspan="${colspan}">Corpus depleted - ₹${formatNumber(withdrawal)} required but not available</td>
            </tr>
        `;
    },

    tableFooter() {
        return `
                    </tbody>
                </table>
            </div>
        `;
    },

    resultMessage(depleted, year, maxYears) {
        if (depleted) {
            return `<div class="warning">⚠️ Corpus depleted in year ${year}. Consider increasing your corpus or adjusting your strategy.</div>`;
        } else {
            return `<div class="success">✅ Corpus sustained for ${maxYears} years. Your withdrawal strategy is sustainable!</div>`;
        }
    },

    epfPpfResult(type, currentCorpus, interestRate, years, futureValue) {
        return `
            <div class="result-grid">
                <div class="result-item">
                    <div class="result-label">Current ${type} Corpus</div>
                    <div class="result-value">₹${formatNumber(currentCorpus)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Interest Rate</div>
                    <div class="result-value">${interestRate}%</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Years to Retirement</div>
                    <div class="result-value">${years}</div>
                </div>
                <div class="result-item highlight">
                    <div class="result-label">Future ${type} Corpus</div>
                    <div class="result-value">₹${formatNumber(futureValue)}</div>
                </div>
            </div>
        `;
    },

    epfPpfResultWithContributions(type, currentCorpus, yearlyContribution, contributionIncrease, interestRate, years, currentCorpusFV, contributionsFV, totalFutureValue) {
        return `
            <div class="result-grid">
                <div class="result-item">
                    <div class="result-label">Current ${type} Corpus</div>
                    <div class="result-value">₹${formatNumber(currentCorpus)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Current Corpus Future Value</div>
                    <div class="result-value">₹${formatNumber(currentCorpusFV)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Yearly Contribution</div>
                    <div class="result-value">₹${formatNumber(yearlyContribution)}</div>
                </div>
                ${contributionIncrease > 0 ? `
                <div class="result-item">
                    <div class="result-label">Contribution Increase</div>
                    <div class="result-value">${contributionIncrease}% annually</div>
                </div>
                ` : ''}
                <div class="result-item">
                    <div class="result-label">Contributions Future Value</div>
                    <div class="result-value">₹${formatNumber(contributionsFV)}</div>
                </div>
                <div class="result-item highlight">
                    <div class="result-label">Total ${type} Corpus</div>
                    <div class="result-value">₹${formatNumber(totalFutureValue)}</div>
                </div>
            </div>
            <div class="summary">
                <p><strong>Breakdown:</strong></p>
                <p>• Current corpus will grow to: ₹${formatNumber(currentCorpusFV)}</p>
                <p>• Future contributions will grow to: ₹${formatNumber(contributionsFV)}</p>
                <p>• Total ${type} corpus at retirement: ₹${formatNumber(totalFutureValue)}</p>
            </div>
        `;
    }
};

// Analytics
const Analytics = {
    trackCalculatorUsage(calculatorType, inputs = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculator_usage', {
                calculator_type: calculatorType,
                ...inputs
            });
        }
    },

    trackTabSwitch(fromTab, toTab) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'tab_switch', {
                from_tab: fromTab,
                to_tab: toTab
            });
        }
    },

    trackButtonClick(buttonType, calculatorType) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'button_click', {
                button_type: buttonType,
                calculator_type: calculatorType
            });
        }
    },

    trackEngagement(calculatorType, timeSpent) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'engagement', {
                calculator_type: calculatorType,
                time_spent: timeSpent
            });
        }
    },

    trackCalculationResult(calculatorType, resultValue) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculation_result', {
                calculator_type: calculatorType,
                result_value: resultValue
            });
        }
    }
};

// Initialize the application
DOM.init();