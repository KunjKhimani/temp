import { API } from "./apis";

export type Transaction = {
  _id: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentProvider: string;
  transactionId: string;
  sellerCommission: number;
  adminCommission: number;
  createdAt: string;
  purchasedItem?: {
    _id: string;
  };
};

export type TransactionResponse = {
  success: boolean;
  count: number;
  totalItems: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  stats: {
    totalRevenue: number;
    adminRevenue: number;
    sellerRevenue: number;
  };
  data: Transaction[];
};

export const getTransactions = async (params: any = {}): Promise<TransactionResponse | null> => {
  try {
    const response = await API.get("/transactions", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return null;
  }
};

export const getTransactionByOrderId = async (orderId: string): Promise<Transaction | null> => {
  try {
    const response = await API.get(`/transactions/${orderId}`);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return null;
  }
};
