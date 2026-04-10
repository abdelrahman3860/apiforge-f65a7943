```javascript
// Import required packages
const express = require('express');
const cors = require('cors');
const Joi = require('joi');

// Create an Express app
const app = express();

// Enable CORS for all origins
app.use(cors());

// Middleware for API key authentication
const authenticate = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid API key' });
  }
  next();
};

// Schema for validating expenses
const expenseSchema = Joi.object({
  amount: Joi.number().required(),
  category: Joi.string().required(),
});

// Endpoint to generate monthly budget summary
app.post('/summary', authenticate, (req, res) => {
  const expenses = req.body.expenses;

  // Validate each expense
  const validatedExpenses = expenses.map((expense) => {
    const { error } = expenseSchema.validate(expense);
    if (error) {
      return { ...expense, error: error.message };
    }
    return expense;
  });

  // Filter out invalid expenses
  const validExpenses = validatedExpenses.filter((expense) => !expense.error);

  // Group expenses by category and calculate totals
  const categoryTotals = {};
  validExpenses.forEach((expense) => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += expense.amount;
  });

  // Calculate overspend warnings
  const overspendWarnings = [];
  Object.keys(categoryTotals).forEach((category) => {
    if (categoryTotals[category] > 1000) { // Assuming $1000 as the overspend threshold
      overspendWarnings.push({ category, amount: categoryTotals[category] });
    }
  });

  // Return monthly budget summary
  res.json({
    success: true,
    data: {
      categoryTotals,
      overspendWarnings,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found', message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal Server Error', message: 'An error occurred' });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```