// src/services/orderService.js
import api from "./api";

class OrderService {
  async getOrderDetails(orderId) {
    try {
      // TODO: Replace with your actual API endpoint
      const authToken = localStorage.getItem("authToken");
      const config = authToken
        ? { headers: { Authorization: `Bearer ${authToken}` } }
        : undefined;

      const { data } = await api.get(`/api/orders/${orderId}`, config);

      // Transform API response to match your component's expected format
      return {
        selectedProduct: {
          name: data.product_name,
          price: data.amount,
        },
        quantity: data.quantity,
      };
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  getOrderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("order_id");
  }
}

export default new OrderService();
