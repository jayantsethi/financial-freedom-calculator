# FIRE Calculator - Invest for Financial Independence, Retire Early

A comprehensive suite of financial planning calculators designed to help you achieve Financial Independence and Retire Early (FIRE). This web application provides various investment planning tools including EPF, PPF calculators, retirement corpus planning, and advanced withdrawal strategies.

## 🌟 Features

- **Investment Corpus Calculator** - Plan your lumpsum and SIP investments
- **EPF Retirement Calculator** - Calculate your Employee Provident Fund corpus
- **PPF Investment Calculator** - Plan your Public Provident Fund investments
- **3-Bucket Withdrawal Strategy** - Diversified retirement portfolio management
- **SWP Retirement Strategy** - Systematic Withdrawal Plan for sustainable income
- **Optimal Corpus Planning** - Find the minimum corpus needed for retirement

## 🚀 Live Demo

Visit [https://investforfire.com](https://investforfire.com) to use the calculators online.

## 📊 Calculator Details

### 1. Investment Corpus Calculator

**Purpose**: Calculate the total corpus you'll accumulate through lumpsum investments and Systematic Investment Plans (SIPs).

**Inputs**:
- Current lumpsum amount
- Expected CAGR for lumpsum investments
- Monthly SIP amount
- SIP step-up percentage (annual)
- Expected CAGR for SIP investments
- Years to retirement

**Formulas Used**:

**Lumpsum Future Value**:
```
FV = Principal × (1 + Rate)^Years
```

**SIP Future Value with Step-up**:
```
Monthly Rate = (1 + CAGR)^(1/12) - 1
For each year:
  For each month:
    FV = (FV + Monthly SIP) × (1 + Monthly Rate)
  Monthly SIP = Monthly SIP × (1 + Step-up %)
```

**Total Corpus**:
```
Total = Lumpsum FV + SIP FV
```

### 2. EPF Retirement Calculator

**Purpose**: Calculate the future value of your Employee Provident Fund corpus including yearly contributions with step-up increases.

**Inputs**:
- Current EPF corpus
- Average interest rate
- Yearly contribution
- Yearly percentage increase in contribution
- Years left to retirement

**Formulas Used**:

**Current Corpus Future Value**:
```
Current Corpus FV = Current Corpus × (1 + Interest Rate)^Years
```

**Contributions Future Value**:
```
Monthly Contribution = Yearly Contribution ÷ 12
Monthly Rate = (1 + Interest Rate)^(1/12) - 1

For each year:
  For each month:
    FV = (FV + Monthly Contribution) × (1 + Monthly Rate)
  Monthly Contribution = Monthly Contribution × (1 + Contribution Increase %)
```

**Total EPF Corpus**:
```
Total = Current Corpus FV + Contributions FV
```

### 3. PPF Investment Calculator

**Purpose**: Calculate the future value of your Public Provident Fund investments with fixed yearly contributions.

**Inputs**:
- Current PPF corpus
- Average interest rate
- Yearly contribution
- Years left to retirement

**Formulas Used**:

**Current Corpus Future Value**:
```
Current Corpus FV = Current Corpus × (1 + Interest Rate)^Years
```

**Contributions Future Value** (no step-up for PPF):
```
Monthly Contribution = Yearly Contribution ÷ 12
Monthly Rate = (1 + Interest Rate)^(1/12) - 1

For each year:
  For each month:
    FV = (FV + Monthly Contribution) × (1 + Monthly Rate)
```

**Total PPF Corpus**:
```
Total = Current Corpus FV + Contributions FV
```

### 4. 3-Bucket Withdrawal Strategy

**Purpose**: Implement a diversified withdrawal strategy using three buckets with different risk profiles and returns.

**Inputs**:
- Current monthly expenses
- Expected inflation rate
- Years to retirement
- Retirement corpus
- Bucket returns (Cash/FD, Debt/Hybrid, Equity)
- Bucket allocations (must total 100%)

**Formulas Used**:

**Initial Withdrawal Amount**:
```
Initial Withdrawal = Current Monthly Expense × 12 × (1 + Inflation)^Years to Retirement
```

**Bucket Allocation**:
```
Bucket 1 Amount = Corpus × Bucket 1 Allocation %
Bucket 2 Amount = Corpus × Bucket 2 Allocation %
Bucket 3 Amount = Corpus × Bucket 3 Allocation %
```

**Annual Returns**:
```
Bucket 1 Value = Bucket 1 Value × (1 + Bucket 1 Return %)
Bucket 2 Value = Bucket 2 Value × (1 + Bucket 2 Return %)
Bucket 3 Value = Bucket 3 Value × (1 + Bucket 3 Return %)
```

**Withdrawal Strategy**:
1. Withdraw from Bucket 1 (Cash/FD) first
2. If insufficient, withdraw from Bucket 2 (Debt/Hybrid)
3. If still insufficient, withdraw from Bucket 3 (Equity)
4. Increase withdrawal amount by inflation rate annually

### 5. SWP Retirement Strategy

**Purpose**: Implement a Systematic Withdrawal Plan for sustainable retirement income.

**Inputs**:
- Current monthly expenses
- Expected inflation rate
- Years to retirement
- Retirement corpus
- Expected portfolio return

**Formulas Used**:

**Initial Withdrawal Amount**:
```
Initial Withdrawal = Current Monthly Expense × 12 × (1 + Inflation)^Years to Retirement
```

**Annual Portfolio Growth**:
```
Portfolio Value = Portfolio Value × (1 + Expected Return %)
```

**Annual Withdrawal**:
```
Withdrawal = Previous Withdrawal × (1 + Inflation %)
```

**Portfolio Depletion Check**:
```
If Portfolio Value < Withdrawal Amount:
  Portfolio is depleted
```

### 6. Optimal 3-Bucket Corpus Planning

**Purpose**: Calculate the minimum corpus required for a sustainable 3-bucket withdrawal strategy.

**Inputs**:
- Current monthly expenses
- Expected inflation rate
- Years to retirement
- Expected years in retirement
- Bucket returns and allocations

**Formulas Used**:

**Weighted Portfolio Return**:
```
Weighted Return = (Bucket1 Return × Bucket1 Allocation + 
                   Bucket2 Return × Bucket2 Allocation + 
                   Bucket3 Return × Bucket3 Allocation) ÷ 100
```

**Perpetuity Corpus** (conservative estimate):
```
Perpetuity Corpus = Annual Expense at Retirement ÷ (Weighted Return ÷ 100)
```

**Binary Search Algorithm**:
- Start with perpetuity corpus as lower bound
- Use binary search to find minimum viable corpus
- Test each corpus using 3-bucket simulation
- Return the minimum corpus that sustains for retirement years

### 7. Optimal SWP Corpus Planning

**Purpose**: Calculate the minimum corpus required for a sustainable SWP strategy.

**Inputs**:
- Current monthly expenses
- Expected inflation rate
- Years to retirement
- Years in retirement
- Expected portfolio return

**Formulas Used**:

**Initial Withdrawal Amount**:
```
Initial Withdrawal = Current Monthly Expense × 12 × (1 + Inflation)^Years to Retirement
```

**Real Return**:
```
Real Return = ((1 + Expected Return) ÷ (1 + Inflation)) - 1
```

**Optimal Corpus** (using present value of annuity):
```
If Real Return ≈ 0:
  Optimal Corpus = Initial Withdrawal × Retirement Years
Else:
  Optimal Corpus = Initial Withdrawal × 
    (1 - (1 + Inflation)^Retirement Years × (1 + Expected Return)^(-Retirement Years)) ÷ 
    (Expected Return - Inflation)
```

## 🛠️ Technical Implementation

### File Structure
```
invest-for-fire/
├── index.html          # Main HTML file with calculator interfaces
├── script.js           # JavaScript logic for all calculators
├── style.css           # CSS styling for the application
└── CNAME               # Custom domain configuration
```

### Key Features
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Calculations**: Instant results without page refresh
- **Input Validation**: Ensures valid inputs and provides helpful error messages
- **Indian Number Formatting**: Displays amounts in Indian numbering system (lakhs, crores)

### Browser Compatibility
- Chrome
- Firefox
- Safari
- Edge

## 📈 Usage Examples

### Example 1: Basic Corpus Planning
- Current lumpsum: ₹10,00,000
- Monthly SIP: ₹25,000
- SIP step-up: 10% annually
- Expected returns: 12% CAGR
- Years to retirement: 20

**Result**: Total corpus of approximately ₹3.5 crores

### Example 2: EPF Planning
- Current EPF: ₹5,00,000
- Yearly contribution: ₹2,40,000
- Contribution increase: 5% annually
- Interest rate: 8.1%
- Years to retirement: 15

**Result**: EPF corpus of approximately ₹1.2 crores

### Example 3: 3-Bucket Strategy
- Monthly expenses: ₹50,000
- Inflation: 6%
- Corpus: ₹2 crores
- Bucket allocation: 10% Cash, 30% Debt, 60% Equity
- Returns: 6%, 8%, 12% respectively

**Result**: Sustainable for 30+ years with proper bucket management

## ⚠️ Disclaimer

These calculators are for educational and planning purposes only. The results are estimates based on the inputs provided and various assumptions about future market performance, inflation rates, and economic conditions. 

**Important Notes**:
- Past performance does not guarantee future results
- Market returns can vary significantly from historical averages
- Inflation rates may change over time
- Tax implications are not considered in these calculations
- Please consult with a qualified financial advisor for personalized investment advice

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
