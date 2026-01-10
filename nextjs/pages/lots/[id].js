'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import EWayBillForm from '../../components/EWayBillForm';

export default function LotViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [lot, setLot] = useState(null);
  const [showEWayForm, setShowEWayForm] = useState(false);
  const [ewayBills, setEwayBills] = useState([]);

  useEffect(() => {
    if (id) {
      fetchLot();
      fetchEWayBills();
    }
  }, [id]);

  const fetchLot = async () => {
    const res = await fetch(`/api/lots/${id}`);
    if (res.ok) setLot(await res.json());
  };

  const fetchEWayBills = async () => {
    const res = await fetch(`/api/eway-bill?lotId=${id}`);
    if (res.ok) setEwayBills(await res.json());
  };

  if (!lot) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <Card title={`Lot: ${lot.lot_code}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Date:</strong> {new Date(lot.lot_date).toLocaleDateString()}</div>
            <div><strong>Input Weight:</strong> {lot.total_input_weight} kg</div>
            <div className="col-span-2"><strong>Remarks:</strong> {lot.remarks || 'N/A'}</div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">E-Way Bills</h3>
              <button onClick={() => setShowEWayForm(!showEWayForm)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {showEWayForm ? 'Cancel' : 'Generate E-Way Bill'}
              </button>
            </div>

            {showEWayForm && (
              <EWayBillForm 
                lotId={id} 
                lotCode={lot.lot_code} 
                onSuccess={() => { setShowEWayForm(false); fetchEWayBills(); }}
              />
            )}

            {ewayBills.length > 0 && (
              <div className="mt-4">
                <table className="w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">E-Way Bill No</th>
                      <th className="p-2 border">Date</th>
                      <th className="p-2 border">Valid Upto</th>
                      <th className="p-2 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ewayBills.map(bill => (
                      <tr key={bill.id}>
                        <td className="p-2 border">{bill.eway_bill_no}</td>
                        <td className="p-2 border">{new Date(bill.eway_bill_date).toLocaleDateString()}</td>
                        <td className="p-2 border">{new Date(bill.valid_upto).toLocaleString()}</td>
                        <td className="p-2 border">{bill.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Layout>
  );
}
