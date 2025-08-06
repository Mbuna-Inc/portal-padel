import { apiRequest } from './apiRequest';

export interface Expense {
  id: string;
  type: string;
  amount: number; // Amount in MWK
  description: string;
  date: string;
  addedBy: string;
  createdAt: string;
  paymentMethod: string;
}

export interface CreateExpenseData {
  type: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: string;
}

export interface UpdateExpenseData {
  type?: string;
  amount?: number;
  description?: string;
  date?: string;
  paymentMethod?: string;
}

// Get all expenses
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const response = await apiRequest('/expenses/GetAll', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload || [];
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw new Error('Failed to fetch expenses');
  }
};

// Get a single expense by ID
export const getExpense = async (expenseId: string): Promise<Expense> => {
  try {
    const response = await apiRequest(`/expenses/GetByID?id=${expenseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload[0]; // Backend returns array with single item
  } catch (error) {
    console.error('Error fetching expense:', error);
    throw new Error('Failed to fetch expense');
  }
};

// Create a new expense
export const createExpense = async (expenseData: CreateExpenseData): Promise<Expense> => {
  try {
    const response = await apiRequest('/expenses/Add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });
    return response.payload;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw new Error('Failed to create expense');
  }
};

// Update an existing expense
export const updateExpense = async (expenseId: string, updates: UpdateExpenseData): Promise<Expense> => {
  try {
    const response = await apiRequest(`/expenses/Update?id=${expenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.payload;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw new Error('Failed to update expense');
  }
};

// Delete an expense
export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    await apiRequest(`/expenses/Delete?id=${expenseId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Failed to delete expense');
  }
};

// Get expenses by date range
export const getExpensesByDateRange = async (startDate: string, endDate: string): Promise<Expense[]> => {
  try {
    const response = await apiRequest(`/expenses/GetByDateRange?startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload || [];
  } catch (error) {
    console.error('Error fetching expenses by date range:', error);
    throw new Error('Failed to fetch expenses by date range');
  }
};

// Get expenses by type
export const getExpensesByType = async (type: string): Promise<Expense[]> => {
  try {
    const response = await apiRequest(`/expenses/GetByType?type=${type}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload || [];
  } catch (error) {
    console.error('Error fetching expenses by type:', error);
    throw new Error('Failed to fetch expenses by type');
  }
};

// Get expenses statistics
export const getExpensesStats = async (): Promise<{
  totalExpenses: number;
  monthlyExpenses: number;
  expensesByType: Record<string, number>;
  expensesByPaymentMethod: Record<string, number>;
}> => {
  try {
    const response = await apiRequest('/expenses/GetStats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload;
  } catch (error) {
    console.error('Error fetching expense statistics:', error);
    throw new Error('Failed to fetch expense statistics');
  }
};
