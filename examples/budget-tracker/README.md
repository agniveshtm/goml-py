# Budget Tracker

A personal budget tracker that uses GOML as its data store format.

## Features

- Track income and expenses by category
- Dashboard with spending overview
- Add, edit, delete transactions
- Monthly/weekly views
- Category breakdown with percentages
- **Export/Import GOML files**
- **Export/Import JSON files**
- Toggle between GOML and JSON preview
- Data persists in browser (localStorage)
- Beautiful dark theme UI

## How It Uses GOML

All data is stored in GOML format:

```goml
# budget.goml
settings {
  currency = USD
  monthly_budget = 3000
}

categories [
  { name = Food, color = #ff6b6b, icon = food }
  { name = Transport, color = #4ecdc4, icon = car }
  { name = Entertainment, color = #a855f7, icon = play }
  { name = Bills, color = #f59e0b, icon = bolt }
]

transactions [
  {
    id = 1
    description = Grocery Store
    amount = 85.50
    category = Food
    date = 2024-01-15
    type = expense
  }
  {
    id = 2
    description = Salary
    amount = 5000
    category = Income
    date = 2024-01-01
    type = income
  }
]
```

## Usage

1. Open `index.html` in a browser
2. Add transactions using the form
3. View spending by category
4. Export your data as `.goml` or `.json`
5. Import GOML or JSON files to restore data
6. Toggle between GOML and JSON preview

## Files

- `index.html` - Main HTML file
- `styles.css` - Dark theme styles
- `app.js` - Application logic + GOML parser
- `data.goml` - Sample data (GOML format)
