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

type monthlyReturn = {
    income: number
    capital: number
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

type TotalPerformance = {
    month: number
    investment: number
    assets: number
    income: number
    capital: number
    totalReturn: number
}

class StockMonthlyPerformance {
    stockPlan: StockPlan
    #monthlyPerformances: TotalPerformance[]

    constructor(stockPlan: StockPlan) {
        this.#monthlyPerformances = []
        this.stockPlan = stockPlan
    }

    get monthlyPerformances() {
        return this.#monthlyPerformances
    }

    estimateMonthlyInvestments(): number[] {
        const monthlyInvestments: number[] = new Array(MAX_MONTH).fill(0)

        this.stockPlan.investmentPlans.forEach(investmentPlan => {
            const { startMonth, endMonth, investment } = investmentPlan;
            // startMonth から endMonth までの各月に対して投資額を追加
            for (let month = startMonth; month <= endMonth; month++) {
                monthlyInvestments[month - 1] += investment;
            }
        });
        return monthlyInvestments

    }

    estimateTotalInvestmentTrends() {
        const monthlyInvestments: number[] = this.estimateMonthlyInvestments()
        let totalInvestment = 0; // その月の累計投資額
        return monthlyInvestments.map((investment) => {
            totalInvestment += investment; // 現在の月の投資額を累計に加算
            return totalInvestment; // 累計投資額を返す
        });
    }

    estimateMonthlyReturns() {
        const monthlyInvestments: number[] = this.estimateMonthlyInvestments()
        const { name, capitalRate, incomeRate } = this.stockPlan.stock
        const monthlyReturns: monthlyReturn[] = [];
        let prevTotalAssets = 0; // 前月の総資産額
        return monthlyInvestments.map((investment) => {
            const monthlyIncome = (investment + prevTotalAssets) * incomeRate
            const monthlyCapital = (investment + prevTotalAssets) * capitalRate
            prevTotalAssets += investment + monthlyCapital + monthlyIncome
            return { income: monthlyIncome, capital: monthlyCapital }
        })
    }

    // Reduceを使った実装
    estimateTotalPerformance() {
        const monthlyReturns: monthlyReturn[] = this.estimateMonthlyReturns()
        const monthlyInvestments: number[] = this.estimateMonthlyInvestments()
        const totalPerformances: TotalPerformance[] = Array.from(
            { length: MAX_MONTH }, (_, i) => ({ month: i + 1, investment: 0, assets: 0, income: 0, capital: 0, totalReturn: 0 })
        )
        const initialPerformance = {
            month: 1,
            investment: monthlyInvestments[0],
            assets: monthlyInvestments[0],
            capital: 0,
            income: 0,
            totalReturn: 0
        }

        return totalPerformances.reduce((prev, _, index) => {
            const totalPerformance = {
                month: index + 1,
                investment: prev.investment + monthlyInvestments[index],
                assets: prev.assets + monthlyReturns[index].capital,
                income: prev.income + monthlyReturns[index].income,
                capital: prev.capital + monthlyReturns[index].income,
                totalReturn: prev.totalReturn + monthlyReturns[index].capital + monthlyReturns[index].income,
            }
            totalPerformances[index] = totalPerformance
            return totalPerformance
        }, initialPerformance)

    }
}