const axios = require('axios');

class EWayBillService {
  constructor() {
    this.baseURL = process.env.EWAY_BASE_URL || 'https://api.mastergst.com/ewaybillapi/v1.03';
    this.username = process.env.EWAY_USERNAME;
    this.password = process.env.EWAY_PASSWORD;
    this.gstin = process.env.EWAY_GSTIN;
    this.authToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    if (this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.authToken;
    }

    try {
      const response = await axios.post(`${this.baseURL}/authenticate`, {
        username: this.username,
        password: this.password,
        gstin: this.gstin
      });

      this.authToken = response.data.authtoken;
      this.tokenExpiry = Date.now() + (6 * 60 * 60 * 1000); // 6 hours
      return this.authToken;
    } catch (error) {
      console.error('[EWAY] Authentication failed:', error.message);
      throw new Error('E-Way Bill authentication failed');
    }
  }

  async generateEWayBill(lotData) {
    const authToken = await this.authenticate();

    const payload = {
      supplyType: 'O', // Outward
      subSupplyType: '1', // Supply
      docType: 'INV', // Invoice
      docNo: lotData.lot_code,
      docDate: this.formatDate(lotData.lot_date),
      fromGstin: this.gstin,
      fromTrdName: process.env.COMPANY_NAME || 'Your Company',
      fromAddr1: process.env.COMPANY_ADDRESS || 'Address Line 1',
      fromPlace: process.env.COMPANY_CITY || 'City',
      fromPincode: parseInt(process.env.COMPANY_PINCODE || '000000'),
      fromStateCode: parseInt(process.env.COMPANY_STATE_CODE || '0'),
      toGstin: lotData.buyer_gstin || 'URP', // Unregistered Person
      toTrdName: lotData.buyer_name || 'Buyer',
      toAddr1: lotData.buyer_address || 'Address',
      toPlace: lotData.buyer_city || 'City',
      toPincode: parseInt(lotData.buyer_pincode || '000000'),
      toStateCode: parseInt(lotData.buyer_state_code || '0'),
      transactionType: 1, // Regular
      totalValue: parseFloat(lotData.total_value || 0),
      cgstValue: parseFloat(lotData.cgst || 0),
      sgstValue: parseFloat(lotData.sgst || 0),
      igstValue: parseFloat(lotData.igst || 0),
      cessValue: parseFloat(lotData.cess || 0),
      totInvValue: parseFloat(lotData.invoice_value || 0),
      transporterId: lotData.transporter_id || '',
      transporterName: lotData.transporter_name || '',
      transDocNo: lotData.transport_doc_no || '',
      transMode: lotData.transport_mode || '1', // Road
      transDistance: parseInt(lotData.distance || 0),
      transDocDate: this.formatDate(lotData.transport_date || new Date()),
      vehicleNo: lotData.vehicle_no || '',
      vehicleType: lotData.vehicle_type || 'R', // Regular
      itemList: [{
        productName: 'Tobacco',
        productDesc: `Lot ${lotData.lot_code}`,
        hsnCode: parseInt(process.env.TOBACCO_HSN_CODE || '24011010'),
        quantity: parseFloat(lotData.total_input_weight || 0),
        qtyUnit: 'KGS',
        taxableAmount: parseFloat(lotData.taxable_amount || 0),
        cgstRate: parseFloat(lotData.cgst_rate || 0),
        sgstRate: parseFloat(lotData.sgst_rate || 0),
        igstRate: parseFloat(lotData.igst_rate || 0),
        cessRate: parseFloat(lotData.cess_rate || 0)
      }]
    };

    try {
      const response = await axios.post(`${this.baseURL}/ewayapi/genewaybill`, payload, {
        headers: {
          'username': this.username,
          'password': this.password,
          'gstin': this.gstin,
          'authtoken': authToken,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        ewayBillNo: response.data.ewayBillNo,
        ewayBillDate: response.data.ewayBillDate,
        validUpto: response.data.validUpto,
        data: response.data
      };
    } catch (error) {
      console.error('[EWAY] Generation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getEWayBillDetails(ewayBillNo) {
    const authToken = await this.authenticate();

    try {
      const response = await axios.get(`${this.baseURL}/ewayapi/GetEwayBill`, {
        params: { ewbNo: ewayBillNo },
        headers: {
          'username': this.username,
          'password': this.password,
          'gstin': this.gstin,
          'authtoken': authToken
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('[EWAY] Fetch failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async cancelEWayBill(ewayBillNo, cancelReason, cancelRemarks) {
    const authToken = await this.authenticate();

    try {
      const response = await axios.post(`${this.baseURL}/ewayapi/canewb`, {
        ewbNo: parseInt(ewayBillNo),
        cancelRsnCode: parseInt(cancelReason),
        cancelRmrk: cancelRemarks
      }, {
        headers: {
          'username': this.username,
          'password': this.password,
          'gstin': this.gstin,
          'authtoken': authToken
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('[EWAY] Cancel failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

module.exports = new EWayBillService();
