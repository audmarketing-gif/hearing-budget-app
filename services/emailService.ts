import emailjs from '@emailjs/browser';

/**
 * --- EMAILJS TEMPLATE DRAFT ---
 * Copy and paste the following HTML into the "Source Code" (< >) view of your EmailJS Template body.
 * 
 * SUBJECT LINE: 💰 Allocation Alert: {{description}}
 * 
 * HTML CONTENT:
 * <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
 *   <!-- Header -->
 *   <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
 *     <h1 style="color: #ffffff; margin: 0; font-family: 'Arial Black', sans-serif; letter-spacing: -1px;">VISION CARE</h1>
 *     <div style="background-color: #06b6d4; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 10px; display: inline-block; margin-top: 5px; letter-spacing: 2px;">HEARING SOLUTIONS</div>
 *   </div>
 * 
 *   <!-- Body -->
 *   <div style="padding: 30px; background-color: #ffffff;">
 *     <h2 style="color: #1c1917; margin-top: 0;">Incoming Allocation Alert</h2>
 *     <p style="color: #57534e; line-height: 1.5;">
 *       This is an automated notification regarding an upcoming budget allocation.
 *     </p>
 * 
 *     <!-- Card -->
 *     <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
 *       <p style="margin: 0; color: #065f46; font-weight: bold; font-size: 16px;">{{description}}</p>
 *       <p style="margin: 5px 0 0; color: #047857; font-size: 14px;">Due Date: {{date}}</p>
 *     </div>
 * 
 *     <div style="text-align: center; margin: 30px 0;">
 *        <span style="font-size: 32px; font-weight: bold; color: #059669;">LKR {{amount}}</span>
 *        <p style="margin: 5px 0 0; color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Allocated Amount</p>
 *     </div>
 * 
 *     <p style="color: #57534e; font-size: 14px; text-align: center; margin-bottom: 30px;">
 *       Please ensure this allocation is accounted for in your financial planning for this month.
 *     </p>
 *     
 *     <div style="text-align: center;">
 *       <a href="{{app_link}}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Open Budget Portal</a>
 *     </div>
 *   </div>
 * 
 *   <!-- Footer -->
 *   <div style="background-color: #f5f5f4; padding: 15px; text-align: center; color: #a8a29e; font-size: 12px; border-top: 1px solid #e7e5e4;">
 *     &copy; 2025 Vision Care Hearing Solutions.<br>
 *     Automated Budget Alert System.
 *   </div>
 * </div>
 */

export const sendAllocationAlert = async (
  email: string, 
  item: { description: string, date: string, amount: number },
  config: { serviceId?: string, templateId?: string, publicKey?: string }
) => {
  console.log(`[EMAIL SERVICE] Attempting to send alert to: ${email}`);

  if (!config.serviceId || !config.templateId || !config.publicKey) {
    console.warn("[EMAIL SERVICE] Missing EmailJS configuration. Please check Settings.");
    return false;
  }

  try {
    const templateParams = {
      to_email: email,
      description: item.description,
      amount: item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      date: item.date,
      message: `Incoming allocation of LKR ${item.amount.toLocaleString()} due on ${item.date}`,
      app_link: window.location.origin + window.location.pathname // Helper link to get back to app
    };

    const response = await emailjs.send(
      config.serviceId, 
      config.templateId, 
      templateParams, 
      config.publicKey
    );

    console.log('[EMAIL SERVICE] Email sent successfully!', response.status, response.text);
    return true;
  } catch (error) {
    console.error('[EMAIL SERVICE] Failed to send email:', error);
    return false;
  }
};