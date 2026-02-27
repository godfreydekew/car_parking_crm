import requests
from typing import Optional

from app.config import settings

GOOGLE_REVIEW_URL = "https://g.page/r/Cf9MOqvx-6_1EBM/review"
WHATSAPP_URL = "https://wa.me/27735440774"
PHONE_NUMBER = "+27 73 544 0774"
COMPANY_NAME = "Or Tambo Premium Parking"
SENDER_EMAIL = "noreply@ortambopremiumparking.co.za"


def _build_booking_confirmation_html(
    name: str,
    *,
    departure_date: Optional[str] = None,
    drop_off_time: Optional[str] = None,
    arrival_date: Optional[str] = None,
    pickup_time: Optional[str] = None,
    flight_type: Optional[str] = None,
    vehicle_reg: Optional[str] = None,
    vehicle_make_model: Optional[str] = None,
    vehicle_color: Optional[str] = None,
    payment_method: Optional[str] = None,
    cost: Optional[str] = None,
    special_instructions: Optional[str] = None,
) -> str:
    """Build professional HTML email body. All booking fields are optional."""
    has_details = any(
        [
            departure_date,
            drop_off_time,
            arrival_date,
            pickup_time,
            flight_type,
            vehicle_reg,
            vehicle_make_model,
            vehicle_color,
            payment_method,
            cost,
        ]
    )

    td_label = "padding:10px 14px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:110px;"
    td_value = "padding:10px 14px;color:#1e293b;font-size:13px;font-weight:600;border-bottom:1px solid #f1f5f9;"

    details_rows = []
    if departure_date or drop_off_time:
        details_rows.append(
            f"<tr><td style='{td_label}'>Drop-off</td>"
            f"<td style='{td_value}'>{departure_date or '—'} at {drop_off_time or '—'}</td></tr>"
        )
    if arrival_date or pickup_time:
        details_rows.append(
            f"<tr><td style='{td_label}'>Pick-up</td>"
            f"<td style='{td_value}'>{arrival_date or '—'} at {pickup_time or '—'}</td></tr>"
        )
    if flight_type:
        details_rows.append(
            f"<tr><td style='{td_label}'>Flight</td>"
            f"<td style='{td_value}'>{flight_type}</td></tr>"
        )
    if vehicle_reg or vehicle_make_model or vehicle_color:
        vehicle_desc = " · ".join(
            x for x in [vehicle_make_model, vehicle_color, vehicle_reg] if x
        )
        details_rows.append(
            f"<tr><td style='{td_label}'>Vehicle</td>"
            f"<td style='{td_value}'>{vehicle_desc or '—'}</td></tr>"
        )
    if payment_method:
        details_rows.append(
            f"<tr><td style='{td_label}'>Payment</td>"
            f"<td style='{td_value}'>{payment_method}</td></tr>"
        )
    if cost:
        details_rows.append(
            f"<tr><td style='{td_label}'>Total</td>"
            f"<td style='{td_value}'>R{cost}</td></tr>"
        )

    details_block = ""
    if has_details and details_rows:
        details_block = f"""
        <table style='width:100%;border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:8px;overflow:hidden;'>
            <tbody>
                {"".join(details_rows)}
            </tbody>
        </table>
        """
    if special_instructions and special_instructions.strip():
        details_block += f"""
        <p style='margin:0 0 16px;color:#64748b;font-size:13px;'>
            <strong style='color:#475569;'>Note:</strong> {special_instructions.strip()}
        </p>
        """

    stars = "&#9733;" * 5
    first_name = name.split()[0] if name else name

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking confirmed</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;color:#1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">

                    <!-- Header -->
                    <tr>
                        <td style="background:#166534;padding:28px 24px;text-align:center;">
                            <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">{COMPANY_NAME}</h1>
                        </td>
                    </tr>

                    <!-- Confirmation badge -->
                    <tr>
                        <td style="padding:28px 24px 0;" align="center">
                            <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:6px 16px;">
                                <span style="color:#166534;font-size:13px;font-weight:600;">&#10003; Booking confirmed</span>
                            </div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:20px 24px 0;">
                            <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#1e293b;">
                                Hi {first_name}, your parking is booked.
                            </p>
                            <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#64748b;">
                                We'll confirm details via WhatsApp shortly. Questions? Call
                                <a href="tel:{PHONE_NUMBER.replace(' ', '')}" style="color:#166534;text-decoration:none;font-weight:600;">{PHONE_NUMBER}</a>
                                or message on
                                <a href="{WHATSAPP_URL}" style="color:#166534;text-decoration:none;font-weight:600;">WhatsApp</a>.
                            </p>
                            {details_block}
                        </td>
                    </tr>

                    <!-- Review CTA -->
                    <tr>
                        <td style="padding:8px 24px 28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;overflow:hidden;">
                                <tr>
                                    <td style="padding:20px 20px;text-align:center;">
                                        <p style="margin:0 0 2px;font-size:24px;letter-spacing:2px;color:#f59e0b;">{stars}</p>
                                        <p style="margin:0 0 14px;font-size:12px;color:#a16207;line-height:1.4;">
                                            A quick Google review helps other travellers find safe parking. Takes under 30 seconds.
                                        </p>
                                        <a href="{GOOGLE_REVIEW_URL}" style="display:inline-block;background:#166534;color:#ffffff;font-size:13px;font-weight:600;padding:10px 28px;border-radius:6px;text-decoration:none;">
                                            Leave a Review
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:14px 24px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center;">
                            &copy; {COMPANY_NAME}
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def send_booking_confirmation_email(
    email: str,
    name: str,
    *,
    departure_date: Optional[str] = None,
    drop_off_time: Optional[str] = None,
    arrival_date: Optional[str] = None,
    pickup_time: Optional[str] = None,
    flight_type: Optional[str] = None,
    vehicle_reg: Optional[str] = None,
    vehicle_make_model: Optional[str] = None,
    vehicle_color: Optional[str] = None,
    payment_method: Optional[str] = None,
    cost: Optional[str] = None,
    special_instructions: Optional[str] = None,
):
    html_content = _build_booking_confirmation_html(
        name,
        departure_date=departure_date,
        drop_off_time=drop_off_time,
        arrival_date=arrival_date,
        pickup_time=pickup_time,
        flight_type=flight_type,
        vehicle_reg=vehicle_reg,
        vehicle_make_model=vehicle_make_model,
        vehicle_color=vehicle_color,
        payment_method=payment_method,
        cost=cost,
        special_instructions=special_instructions,
    )
    
    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": settings.BREVO_API_KEY},
        json={
            "subject": "Booking received – Or Tambo Premium Parking",
            "htmlContent": html_content,
            "sender": {
                "email": SENDER_EMAIL,
                "name": COMPANY_NAME,
            },
            "to": [{"email": email, "name": name}],
            "headers": {"X-Mailer": "Airport CRM"},
        },
    )
    
    print("Booking confirmation email sent:", response)
    
    return response

# if __name__ == "__main__":
#   response = send_booking_confirmation_email(
#       "dekewgodfrey@gmail.com",
#       "Jane Smith",
#       departure_date="2025-02-15",
#     #   drop_off_time="06:00",
#       arrival_date="2025-02-20",
#       pickup_time="14:00",
#       flight_type="International",
#       vehicle_reg="ABC 123 GP",
#       vehicle_make_model="Toyota Corolla",
#       vehicle_color="Silver",
#       payment_method="Card",
#       cost="450.00",
#       special_instructions="Please park in shade.",
#   )
#   print(response)

#Debugging