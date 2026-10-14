/**
 * Base Shipping Provider Interface
 * All courier providers (Manual, Shiprocket, Delhivery, etc.) must implement this interface.
 */
class ShippingProvider {
  constructor(name = 'BaseProvider') {
    this.name = name;
  }

  /**
   * Check serviceability for destination pincode
   * @param {string} pincode
   * @param {Object} options
   * @returns {Promise<{ serviceable: boolean, codAvailable: boolean, estimatedDays: number, message: string }>}
   */
  async checkServiceability(pincode, options = {}) {
    throw new Error(`checkServiceability() not implemented by ${this.name}`);
  }

  /**
   * Create shipment record with courier
   * @param {Object} order
   * @param {Object} options
   * @returns {Promise<{ success: boolean, providerShipmentId: string, awbNumber: string, trackingUrl: string, labelUrl?: string }>}
   */
  async createShipment(order, options = {}) {
    throw new Error(`createShipment() not implemented by ${this.name}`);
  }

  /**
   * Track shipment by AWB or Shipment ID
   * @param {string} awbNumber
   * @returns {Promise<{ status: string, trackingEvents: Array<{ timestamp: Date, status: string, location: string, description: string }> }>}
   */
  async trackShipment(awbNumber) {
    throw new Error(`trackShipment() not implemented by ${this.name}`);
  }

  /**
   * Cancel shipment
   * @param {string} awbNumber
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async cancelShipment(awbNumber) {
    throw new Error(`cancelShipment() not implemented by ${this.name}`);
  }
}

module.exports = ShippingProvider;
