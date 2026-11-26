const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '');

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    const networkError = new Error(
      'Tidak dapat terhubung ke server backend. Pastikan server berjalan di http://localhost:5000.'
    );
    networkError.isNetworkError = true;
    throw networkError;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const error = new Error(
      data?.error || data?.message || `Permintaan gagal (HTTP ${response.status}).`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function getBills() {
  return request('/bills');
}

export function getBillById(id) {
  return request(`/bills/${id}`);
}

export function createBill(payload) {
  return request('/bills', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateParticipantStatus(id, isPaid) {
  return request(`/participants/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_paid: Boolean(isPaid) }),
  });
}

export function deleteBill(id) {
  return request(`/bills/${id}`, {
    method: 'DELETE',
  });
}
