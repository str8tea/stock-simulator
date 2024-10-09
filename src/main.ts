const MAX_MONTH = 12 * 30
function main() {
    const TOP_ROW = 5
    const PERFORMANCE_TOP_ROW = 13

    const url = "https://docs.google.com/spreadsheets/d/1sm5uQ0HTbfVOVlZjriJbNlz2sOFp1CB9f_8pf8Z7hZ4/edit"
    const ss = SpreadsheetApp.openByUrl(url)
    const sheet = ss.getSheetByName('シミュレーション')

    // NASDAQの投資計画
    const investmentPlan = readInvestmentInfo(sheet, TOP_ROW, PERFORMANCE_TOP_ROW - 1, 1)
    const performanceCalculator = new PerformanceCalculator(investmentPlan)
    const performance = performanceCalculator.monthlyPerformances
    writePerdformance(sheet, PERFORMANCE_TOP_ROW, 1, performance)

    // SCHDの投資計画
    const investmentPlan2 = readInvestmentInfo(sheet, TOP_ROW, PERFORMANCE_TOP_ROW - 1, 8)
    const performanceCalculator2 = new PerformanceCalculator(investmentPlan2)
    const performance2 = performanceCalculator2.monthlyPerformances
    console.log(performance2)
    writePerdformance(sheet, PERFORMANCE_TOP_ROW, 8, performance2)
}


function readInvestmentInfo(sheet: GoogleAppsScript.Spreadsheet.Sheet, topRow: number, bottomRow: number, leftColumn: number): InvestmentPlan {
    // 銘柄情報を取得
    const nameRange = sheet.getRange(topRow, leftColumn)
    const name = nameRange.getValue()
    const rateRange = sheet.getRange(topRow + 1, leftColumn + 1, 1, 2)
    const rateList = rateRange.getValues()
    const capitalRate = rateList[0][0]
    const incomeRate = rateList[0][1]

    const stock: Stock = {
        name: name,
        capitalRate: capitalRate / 12,
        incomeRate: incomeRate / 12,
    }

    // 投資計画を取得
    const investmentPlanRange = sheet.getRange(topRow + 1, leftColumn + 3, bottomRow - topRow, 3)
    const investmentPeriodValues = investmentPlanRange.getValues()
    const investmentPeriods: InvestmentPeriod[] =
        investmentPeriodValues.map((value) => {
            return {
                investment: value[0],
                startMonth: value[1],
                endMonth: value[2],
            }
        }).filter((value) =>
            value.investment > 0
        )

    return new InvestmentPlan(stock, investmentPeriods)
}

function writePerdformance(sheet: GoogleAppsScript.Spreadsheet.Sheet, topRow: number, leftColumn: number, performances: PerformanceMetorics[]) {
    // ヘッダーを描画
    const headerRange = sheet.getRange(topRow, leftColumn, 1, 6)
    headerRange.setValues([['月', '投資額', '資産額', '配当金', 'キャピタルゲイン', 'トータルリターン']])

    // パフォーマンスを表形式で描画
    const performanceTable = performances.map((performance) => {
        const { month, investment, assets, income, capital, totalReturn } = performance
        return [month, investment, assets, income, capital, totalReturn]
    })
    const performanceRange = sheet.getRange(topRow + 1, leftColumn, performances.length, performanceTable[0].length)
    performanceRange.setValues(performanceTable)
}

function calcInvestmentTrends(investment: number, durationMonth: number) {
    const investmentTrends = []
    for (let month = 1; month <= durationMonth; month++) {
        investmentTrends.push(investment * month)
    }
    return investmentTrends
}

interface Stock {
    readonly name: string
    readonly capitalRate: number
    readonly incomeRate: number
}

interface InvestmentPeriod {
    readonly investment: number
    readonly startMonth: number
    readonly endMonth: number
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

    private estimateMonthlyInvestments(): number[] {
        const monthlyInvestments = new Array(MAX_MONTH).fill(0)

        this.investmentPlan.periods.forEach(({ startMonth, endMonth, investment }) => {
            // startMonth から endMonth までの各月に対して投資額を追加
            for (let month = startMonth - 1; month < endMonth; month++) {
                monthlyInvestments[month] += investment
            }
        });
        return monthlyInvestments

    }

    private estimateMonthlyReturns(): MonthlyReturn[] {
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