const MAX_MONTH = 12 * 50

function myFunction() {
    const stock = new Stock('株式', 0.01, 0.02)
    Logger.log(stock)
}

// function calcInvestTrends(invest, startMonth = 1, endMonth = MAX_MONTH) {
//     const investTrends = new startMonth[]- 1).fill(0);
//     for (let investMonth = 1; investMonth <= endMonth - startMonth + 1; investMonth++) {
//         investTrends.push(invest * investMonth)
//     }
//     return investTrends
// }

function calcInvestmentTrends(investment: number, durationMonth: number) {
    const investmentTrends = []
    for (let month = 1; month <= durationMonth; month++) {
        investmentTrends.push(investment * month)
    }
    return investmentTrends
}

type Stock = {
    name: string
    capitalRate: number
    incomeRate: number
}

type InvestmentPlan = {
    investment: number
    startMonth: number
    endMonth: number
}

type MonthlyInvestment = {
    month: number
    investment: number
}

class StockPlan {

    stock: Stock
    investmentPlans: InvestmentPlan[]
    #estimatedInvestmentTrends: number[]

    constructor(stock: Stock, investmentPlans: InvestmentPlan[]) {
        this.#estimatedInvestmentTrends = []
        this.stock = stock
        this.investmentPlans = investmentPlans
        this.checkMonth()
    }

    sortByStartMonth() {
        this.investmentPlans.sort((a, b) => a.startMonth - b.startMonth)
    }

    checkMonth() {
        if (this.investmentPlans.length === 0) {
            throw new Error('No invest plan')
        }

        this.sortByStartMonth()

        // 開始月 > 終了月になっていないかチェック
        this.investmentPlans.forEach(investmentPlan => {
            const { startMonth, endMonth } = investmentPlan
            if (startMonth > endMonth) {
                throw new Error('startMonth > endMonth')
            }
        })

        // 終了月が次回の開始月より前になっていないかチェック
        this.investmentPlans.reduce((prevPlan, currentPlan) => {
            if (prevPlan && prevPlan.endMonth > currentPlan.startMonth) {
                throw new Error('End month of a plan is greater than start month of the next plan');
            }
            return currentPlan; // 次の比較のために現在のプランを次の累積値にする
        }, null); // 初回の prevPlan を null に設定
    }

    estimateInvestmentTrends() {
        // 各投資プランの投資額の推移を計算
        const investmentTrendsArray = this.investmentPlans.map(plan => {
            const duration = plan.endMonth - plan.startMonth + 1
            return calcInvestmentTrends(plan.investment, duration)
        })

        // 投資プランの順番で投資を行った際の合計投資額の推移を計算
        this.#estimatedInvestmentTrends = investmentTrendsArray.reduce((prev, current) => {
            const totalInvestment = prev[prev.length - 1] // 前回までの合計投資額
            current = current.map(value => value + totalInvestment)
            return prev.concat(current)
        }, [])
        return this.#estimatedInvestmentTrends
    }

    calcCapitalGrowth() {

    }
}

// class Portfolio {}

type MonthlyPerformance = {
    month: number
    totalInvestment: number
    profit: number
    totalAssets: number
    income: number
    totalReturn: number
}

class StockMonthlyPerformance {
    stockPlan: StockPlan
    #monthlyPerformances: MonthlyPerformance[]

    constructor(stockPlan: StockPlan) {
        this.#monthlyPerformances = []
        this.stockPlan = stockPlan
    }

    get monthlyPerformances() {
        return this.#monthlyPerformances
    }

    estimateMonthlyInvestmentSchedule() {
        const monthlyInvestmentSchedule: MonthlyInvestment[] = []

        this.stockPlan.investmentPlans.forEach(investmentPlan => {
            const { startMonth, endMonth, investment } = investmentPlan;
            // startMonth から endMonth までの各月に対して投資額を追加
            for (let month = startMonth; month <= endMonth; month++) {
                monthlyInvestmentSchedule.push({ month, investment });
            }
        });
        return monthlyInvestmentSchedule

    }

    estimateInvestmentTrends() {
        const monthlyInvestmentSchedule = this.estimateMonthlyInvestmentSchedule()

        // 各投資プランの投資額の推移を計算

        return monthlyInvestmentSchedule
    }
}