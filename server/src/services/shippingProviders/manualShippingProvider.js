const ShippingProvider = require('./shippingProvider');

/**
 * Manual Shipping Provider
 * Allows authorized admins to fulfill shipments with custom carrier, AWB, and tracking URLs
 * without requiring third-party API credentials.
 */
class ManualShippingProvider extends ShippingProvider {
  constructor() {
    super('MANUAL');
  }

  /**
   * Configuration-based serviceability check (no fabricated courier APIs)
   */
  async checkServiceability(pincode, options = {}) {
    const isSixDigit = /^\d{6}$/.test(String(pincode).trim());
    if (!isSixDigit) {
      return {
        serviceable: false,
        codAvailable: false,
        estimatedDays: null,
        message: 'Invalid 6-digit Indian pincode.',
      };
    }

    return {
      serviceable: true,
      codAvailable: true,
      estimatedDays: options.estimatedDeliveryDays || 4,
      message: 'Serviceable via standard delivery (Manual/Configured Mode).',
    };
  }

  /**
   * Manual shipment creation does not call external courier APIs.
   * Generates a deterministic shipment ID if not provided.
   */
  async createShipment(order, options = {}) {
    const shipmentId = options.providerShipmentId || `MANUAL_${order.orderNumber}_${Date.now()}`;
    return {
      success: true,
      providerShipmentId: shipmentId,
      awbNumber: options.awbNumber || '',
      carrier: options.carrier || 'Manual Courier',
      trackingUrl: options.trackingUrl || '',
    };
  }

  async trackShipment(awbNumber) {
    return {
      status: 'IN_PROGRESS',
      trackingEvents: [],
      message: 'Tracking details maintained manually by store operations.',
    };
  }

  async cancelShipment(awbNumber) {
    return {
      success: true,
      message: 'Manual shipment cancelled by store administration.',
    };
  }
}

module.exports = ManualShippingProvider;
