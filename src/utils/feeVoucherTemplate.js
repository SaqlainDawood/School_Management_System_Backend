export const generateFeeVoucherHTML = (fee, student, school) => {
  const today = new Date();
  const invoiceNumber = `INV-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(fee._id).slice(-6)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Fee Voucher - ${invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: #f0f4f8; padding: 40px 20px; }
        .voucher-container { max-width: 900px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .voucher-header { background: linear-gradient(135deg, #1a237e 0%, #1565c0 100%); padding: 30px 40px; color: white; }
        .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
        .school-name { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .school-tagline { font-size: 13px; opacity: 0.8; }
        .school-address { font-size: 12px; opacity: 0.7; margin-top: 6px; }
        .voucher-badge { background: rgba(255,255,255,0.15); padding: 12px 24px; border-radius: 8px; text-align: center; }
        .voucher-badge .label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; }
        .voucher-badge .number { font-size: 18px; font-weight: 700; margin-top: 2px; }
        .voucher-body { padding: 30px 40px; }
        .title-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f0f4f8; }
        .title-section h2 { font-size: 22px; color: #1a237e; }
        .status { padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-paid { background: #e8f5e9; color: #2e7d32; }
        .status-pending { background: #fff3e0; color: #e65100; }
        .status-overdue { background: #ffebee; color: #c62828; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .info-group { background: #f8fafc; padding: 14px 18px; border-radius: 8px; border: 1px solid #e8ecf0; }
        .info-group .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; }
        .info-group .value { font-size: 15px; font-weight: 600; color: #1a2332; margin-top: 4px; }
        .info-group .sub-value { font-size: 13px; color: #64748b; margin-top: 2px; }
        .fee-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .fee-table thead th { text-align: left; padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #94a3b8; background: #f8fafc; }
        .fee-table tbody td { padding: 14px 16px; border-bottom: 1px solid #f0f4f8; font-size: 14px; }
        .total-row td { background: #f8fafc; font-weight: 700; border-radius: 8px; padding: 16px; }
        .payment-section { margin-top: 24px; padding: 16px 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #1a237e; font-size: 13px; color: #64748b; line-height: 1.6; }
        .voucher-footer { padding: 20px 40px 30px; border-top: 1px solid #f0f4f8; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="voucher-container">
        <div class="voucher-header">
          <div class="header-content">
            <div>
              <div class="school-name">🏫 ${school?.name || 'School Management System'}</div>
              <div class="school-tagline">Excellence in Education</div>
              <div class="school-address">
                ${school?.address?.street || '123 Education Street'}<br>
                ${school?.address?.city || 'Lahore'}, ${school?.address?.state || 'Punjab'}
              </div>
            </div>
            <div class="voucher-badge">
              <div class="label">Fee Voucher</div>
              <div class="number">#${invoiceNumber}</div>
            </div>
          </div>
        </div>

        <div class="voucher-body">
          <div class="title-section">
            <h2>Fee Payment Voucher</h2>
            <span class="status status-${fee.status}">${fee.status.toUpperCase()}</span>
          </div>

          <div class="info-grid">
            <div class="info-group">
              <div class="label">Student Information</div>
              <div class="value">${student.name}</div>
              <div class="sub-value">Student ID: ${student.studentId}</div>
              <div class="sub-value">Roll No: ${student.rollNumber}</div>
            </div>
            <div class="info-group">
              <div class="label">Academic Information</div>
              <div class="value">${student.class?.name || 'N/A'}</div>
              <div class="sub-value">Section: ${student.section || 'N/A'}</div>
              <div class="sub-value">Academic Year: ${fee.academicYear}</div>
            </div>
            <div class="info-group">
              <div class="label">Fee Details</div>
              <div class="value" style="text-transform: capitalize;">${fee.feeType}</div>
              <div class="sub-value">Semester: ${fee.semester}</div>
              <div class="sub-value">Due Date: ${new Date(fee.dueDate).toLocaleDateString()}</div>
            </div>
            <div class="info-group">
              <div class="label">Payment Status</div>
              <div class="value">${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</div>
              ${fee.paymentDate ? `<div class="sub-value">Paid on: ${new Date(fee.paymentDate).toLocaleDateString()}</div>` : ''}
              ${fee.receiptNumber ? `<div class="sub-value">Receipt: ${fee.receiptNumber}</div>` : ''}
            </div>
          </div>

          <table class="fee-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Fee Type</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${fee.feeType.charAt(0).toUpperCase() + fee.feeType.slice(1)} Fee</strong></td>
                <td>${fee.feeType}</td>
                <td style="text-align: right;">Rs. ${fee.amount.toFixed(2)}</td>
              </tr>
              ${fee.discount > 0 ? `
              <tr>
                <td>Discount</td>
                <td>${fee.discountReason || 'Discount'}</td>
                <td style="text-align: right; color: #2e7d32;">-Rs. ${fee.discount.toFixed(2)}</td>
              </tr>` : ''}
              ${fee.lateFee > 0 ? `
              <tr>
                <td>Late Fee</td>
                <td>Late Payment</td>
                <td style="text-align: right; color: #c62828;">+Rs. ${fee.lateFee.toFixed(2)}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td colspan="2" style="text-align: right;"><strong>Total Amount</strong></td>
                <td style="text-align: right;">Rs. ${fee.amount.toFixed(2)}</td>
              </tr>
              ${fee.paidAmount > 0 ? `
              <tr>
                <td colspan="2" style="text-align: right; color: #2e7d32;"><strong>Amount Paid</strong></td>
                <td style="text-align: right; color: #2e7d32; font-weight: 700;">Rs. ${fee.paidAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="2" style="text-align: right; color: #c62828;"><strong>Balance Due</strong></td>
                <td style="text-align: right; color: #c62828; font-weight: 700;">Rs. ${(fee.amount - fee.paidAmount).toFixed(2)}</td>
              </tr>` : ''}
            </tbody>
          </table>

          <div class="payment-section">
            <strong>💳 Payment Instructions:</strong><br>
            Please make the payment before the due date to avoid late fees.<br>
            You can pay via Cash, Bank Transfer, Online Payment, or Cheque.<br>
            <strong>Bank Details:</strong> Account: 1234-5678-9012 | Bank: National Bank
          </div>
        </div>

        <div class="voucher-footer">
          <div>
            <strong>Generated on:</strong> ${today.toLocaleString()}<br>
            <strong>Invoice:</strong> ${invoiceNumber}
          </div>
          <div style="text-align: center;">
            <div style="width: 180px; border-top: 2px dashed #d0d5dd; margin: 8px auto 4px;"></div>
            <div style="text-transform: uppercase;">Authorized Signature</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};