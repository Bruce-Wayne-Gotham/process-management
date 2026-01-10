import { useState } from 'react';

export default function EWayBillForm({ lotId, lotCode, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    buyer_gstin: '',
    buyer_name: '',
    buyer_address: '',
    buyer_city: '',
    buyer_pincode: '',
    buyer_state_code: '',
    transporter_id: '',
    transporter_name: '',
    vehicle_no: '',
    transport_doc_no: '',
    transport_mode: '1',
    distance: '',
    taxable_amount: '',
    cgst_rate: '9',
    sgst_rate: '9',
    igst_rate: '0',
    cess_rate: '0'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateTax = () => {
    const taxable = parseFloat(formData.taxable_amount) || 0;
    const cgst = (taxable * parseFloat(formData.cgst_rate)) / 100;
    const sgst = (taxable * parseFloat(formData.sgst_rate)) / 100;
    const igst = (taxable * parseFloat(formData.igst_rate)) / 100;
    const cess = (taxable * parseFloat(formData.cess_rate)) / 100;
    return { cgst, sgst, igst, cess, total: taxable + cgst + sgst + igst + cess };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const tax = calculateTax();
    
    try {
      const response = await fetch('/api/eway-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotId,
          buyerDetails: {
            buyer_gstin: formData.buyer_gstin,
            buyer_name: formData.buyer_name,
            buyer_address: formData.buyer_address,
            buyer_city: formData.buyer_city,
            buyer_pincode: formData.buyer_pincode,
            buyer_state_code: formData.buyer_state_code
          },
          transportDetails: {
            transporter_id: formData.transporter_id,
            transporter_name: formData.transporter_name,
            vehicle_no: formData.vehicle_no,
            transport_doc_no: formData.transport_doc_no,
            transport_mode: formData.transport_mode,
            distance: formData.distance,
            transport_date: new Date()
          },
          taxDetails: {
            taxable_amount: formData.taxable_amount,
            cgst_rate: formData.cgst_rate,
            sgst_rate: formData.sgst_rate,
            igst_rate: formData.igst_rate,
            cess_rate: formData.cess_rate,
            cgst: tax.cgst,
            sgst: tax.sgst,
            igst: tax.igst,
            cess: tax.cess,
            total_value: formData.taxable_amount,
            invoice_value: tax.total
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`E-Way Bill Generated: ${result.ewayBillNo}`);
        onSuccess && onSuccess(result);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tax = calculateTax();

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded">
      <h3 className="font-bold text-lg">Generate E-Way Bill for {lotCode}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Buyer GSTIN</label>
          <input name="buyer_gstin" value={formData.buyer_gstin} onChange={handleChange} className="w-full border p-2 rounded" placeholder="29XXXXX1234X1Z5" />
        </div>
        <div>
          <label className="block text-sm font-medium">Buyer Name *</label>
          <input name="buyer_name" value={formData.buyer_name} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Address *</label>
          <input name="buyer_address" value={formData.buyer_address} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">City *</label>
          <input name="buyer_city" value={formData.buyer_city} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Pincode *</label>
          <input name="buyer_pincode" value={formData.buyer_pincode} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">State Code *</label>
          <input name="buyer_state_code" value={formData.buyer_state_code} onChange={handleChange} required className="w-full border p-2 rounded" placeholder="29" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Vehicle No *</label>
          <input name="vehicle_no" value={formData.vehicle_no} onChange={handleChange} required className="w-full border p-2 rounded" placeholder="KA01AB1234" />
        </div>
        <div>
          <label className="block text-sm font-medium">Distance (km) *</label>
          <input name="distance" type="number" value={formData.distance} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Transporter Name</label>
          <input name="transporter_name" value={formData.transporter_name} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Transport Doc No</label>
          <input name="transport_doc_no" value={formData.transport_doc_no} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Taxable Amount *</label>
          <input name="taxable_amount" type="number" step="0.01" value={formData.taxable_amount} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">CGST Rate (%)</label>
          <input name="cgst_rate" type="number" step="0.01" value={formData.cgst_rate} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">SGST Rate (%)</label>
          <input name="sgst_rate" type="number" step="0.01" value={formData.sgst_rate} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">IGST Rate (%)</label>
          <input name="igst_rate" type="number" step="0.01" value={formData.igst_rate} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
      </div>

      <div className="bg-gray-100 p-3 rounded">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>CGST: ₹{tax.cgst.toFixed(2)}</div>
          <div>SGST: ₹{tax.sgst.toFixed(2)}</div>
          <div>IGST: ₹{tax.igst.toFixed(2)}</div>
          <div className="font-bold">Total: ₹{tax.total.toFixed(2)}</div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
        {loading ? 'Generating...' : 'Generate E-Way Bill'}
      </button>
    </form>
  );
}
