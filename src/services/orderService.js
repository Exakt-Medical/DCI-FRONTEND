// src/services/orderService.js
class OrderService {
  async getOrderDetails(orderId) {
    try {
      // TODO: Replace with your actual API endpoint
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();

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
