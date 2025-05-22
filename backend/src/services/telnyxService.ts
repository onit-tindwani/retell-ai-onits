import axios from 'axios';

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_API_BASE = 'https://api.telnyx.com/v2';

export async function purchaseNumber(phoneNumber: string) {
  const res = await axios.post(
    `${TELNYX_API_BASE}/number_orders`,
    { phone_numbers: [{ phone_number: phoneNumber }] },
    { headers: { Authorization: `Bearer ${TELNYX_API_KEY}` } }
  );
  return res.data;
}

// Add more Telnyx API functions as needed 