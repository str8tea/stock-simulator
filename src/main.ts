const MAX_MONTH = 12 * 50

function myFunction() {
    const stock: Stock = {
        name: 'SHCD',
        capitalRate: 0.003,
        incomeRate: 0.003
    }

    const investmentPeriod: InvestmentPeriod[] = [
        { investment: 10000, startMonth: 1, endMonth: 12 },
        { investment: 20000, startMonth: 13, endMonth: 24 },
    ]

    const investmentPlan = new InvestmentPlan(stock, investmentPeriod)
    const performanceCalculator = new PerformanceCalculator(investmentPlan)
    console.log(performanceCalculator.monthlyPerformances)
}

function calcInvestmentTrends(investment: number, durationMonth: number) {
    const investmentTrends = []
    for (let month = 1; month <= durationMonth; month++) {
        investmentTrends.push(investment * month)
    }
    return investmentTrends
}

interface Stock {
    name: string
    capitalRate: number
    incomeRate: number
}

interface InvestmentPeriod {
    investment: number
    startMonth: number
    endMonth: number
}

type MonthlyReturn = {
    income: number
    capital: number
}

class InvestmentPlan {

    readonly stock: Stock
    readonly periods: InvestmentPeriod[]

    constructor(stock: Stock, periods: InvestmentPeriod[]) {
        this.stock = stock
        this.periods = [...periods].sort((a, b) => a.startMonth - b.startMonth)
        this.validateMonth()
    }


    validateMonth() {
        if (this.periods.length === 0) {
            throw new Error('No invest plan')
        }

        // 開始月 > 終了月になっていないかチェック
        this.periods.forEach(period => {
            const { startMonth, endMonth } = period
            if (startMonth > endMonth) {
                throw new Error('startMonth > endMonth')
            }
        })

        // 終了月が次回の開始月より前になっていないかチェック
        this.periods.reduce((prevPlan, currentPlan) => {
            if (prevPlan && prevPlan.endMonth > currentPlan.startMonth) {
                throw new Error('End month of a plan is greater than start month of the next plan')
            }
            return currentPlan; // 次の比較のために現在のプランを次の累積値にする
        }, null); // 初回の prevPlan を null に設定
    }
}

// class Portfolio {}

interface PerformanceMetorics {
    month: number
    investment: number
    assets: number
    income: number
    capital: number
    totalReturn: number
}

class PerformanceCalculator {
    readonly investmentPlan: InvestmentPlan
    private _performances: PerformanceMetorics[] | null = null

    constructor(investmentPlan: InvestmentPlan) {
        this.investmentPlan = investmentPlan
    }

    get monthlyPerformances() {
        if (!this._performances) {
            this._performances = this.estimatePerformance()
        }
        return this._performances
    }

    estimateMonthlyInvestments(): number[] {
        const monthlyInvestments = new Array(MAX_MONTH).fill(0)

        this.investmentPlan.periods.forEach(({ startMonth, endMonth, investment }) => {
            // startMonth から endMonth までの各月に対して投資額を追加
            for (let month = startMonth - 1; month < endMonth; month++) {
                monthlyInvestments[month] += investment
            }
        });
        return monthlyInvestments

    }

    estimateMonthlyReturns(): MonthlyReturn[] {
        const monthlyInvestments = this.estimateMonthlyInvestments()
        const stock = this.investmentPlan.stock
        let prevTotalAssets = 0; // 前月の総資産額
        return monthlyInvestments.map((investment) => {
            const monthlyIncome = (investment + prevTotalAssets) * stock.incomeRate
            const monthlyCapital = (investment + prevTotalAssets) * stock.capitalRate
            prevTotalAssets += investment + monthlyCapital
            return { income: monthlyIncome, capital: monthlyCapital }
        })
    }

    estimatePerformance(): PerformanceMetorics[] {
        const performance: PerformanceMetorics[] = Array.from(
            { length: MAX_MONTH }, (_, i) => ({
                month: i + 1,
                investment: 0,
                assets: 0,
                income: 0,
                capital: 0,
                totalReturn: 0
            })
        )
        const monthlyReturns: MonthlyReturn[] = this.estimateMonthlyReturns()
        const monthlyInvestments: number[] = this.estimateMonthlyInvestments()

        // 初期値
        performance[0] = {
            month: 1,
            investment: monthlyInvestments[0],
            assets: monthlyInvestments[0],
            capital: 0,
            income: 0,
            totalReturn: 0
        }

        for (let month = 1; month <= MAX_MONTH; month++) {
            const prev = performance[month - 1]
            const investment = monthlyInvestments[month - 1]
            const { income, capital } = monthlyReturns[month - 1]

            // 月のパフォーマンスを計算
            performance[month] = {
                month: month + 1,
                investment: prev.investment + investment,
                assets: prev.assets + investment + capital,
                income: prev.income + income,
                capital: prev.capital + capital,
                totalReturn: prev.totalReturn + capital + income,
            }
        }

        return performance
    }
}