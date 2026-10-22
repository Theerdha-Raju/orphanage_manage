import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

def number_to_words_inr(num):
    """Simple number to Indian currency words converter."""
    try:
        n = int(float(num))
    except (ValueError, TypeError):
        return ""
    
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
             "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
             "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def convert_below_thousand(val):
        result = []
        if val >= 100:
            result.append(units[val // 100] + " Hundred")
            val %= 100
        if val >= 20:
            result.append(tens[val // 10])
            val %= 10
        if val > 0:
            result.append(units[val])
        return " ".join(result)

    if n == 0:
        return "Zero Rupees Only"

    parts = []
    # Crores
    if n >= 10000000:
        parts.append(convert_below_thousand(n // 10000000) + " Crore")
        n %= 10000000
    # Lakhs
    if n >= 100000:
        parts.append(convert_below_thousand(n // 100000) + " Lakh")
        n %= 100000
    # Thousands
    if n >= 1000:
        parts.append(convert_below_thousand(n // 1000) + " Thousand")
        n %= 1000
    # Remainder
    if n > 0:
        parts.append(convert_below_thousand(n))

    return " ".join(parts).strip() + " Rupees Only"

def build_pdf_styles():
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e3a8a'),
        alignment=TA_CENTER
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748b'),
        alignment=TA_CENTER
    )
    badge_style = ParagraphStyle(
        'ReceiptBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#0f766e'),
        alignment=TA_CENTER
    )
    header_label = ParagraphStyle(
        'HeaderLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0f172a')
    )
    cell_regular = ParagraphStyle(
        'CellRegular',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    amount_style = ParagraphStyle(
        'AmountLarge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#15803d'),
        alignment=TA_RIGHT
    )
    footer_text = ParagraphStyle(
        'FooterText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#64748b'),
        alignment=TA_CENTER
    )

    return {
        'title': title_style,
        'subtitle': subtitle_style,
        'badge': badge_style,
        'header_label': header_label,
        'cell_bold': cell_bold,
        'cell_reg': cell_regular,
        'amount': amount_style,
        'footer': footer_text
    }

def generate_monetary_receipt_pdf(donation):
    """
    Generates an official downloadable PDF receipt for a verified monetary donation.
    Returns bytes of the generated PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = build_pdf_styles()
    story = []

    # 1. Header & Organization Identity
    story.append(Paragraph("HopeNest", styles['title']))
    story.append(Paragraph("Intelligent Child Development and Orphanage Management System", styles['subtitle']))
    story.append(Paragraph("80G Registration No: AABCH8829LF20214 | DARPAN ID: DL/2021/029104", styles['subtitle']))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceBefore=2, spaceAfter=8))

    # 2. Receipt Badge & Meta
    receipt_no = donation.receipt_number or f"HN-REC-{datetime.now().year}-{donation.donation_id:04d}"
    receipt_badge_text = f"<b>OFFICIAL MONETARY DONATION RECEIPT</b> &nbsp;|&nbsp; <b>RECEIPT NO:</b> {receipt_no}"
    story.append(Paragraph(receipt_badge_text, styles['badge']))
    story.append(Spacer(1, 10))

    # 3. Key Meta Table (Date, Status, Reference)
    donation_date = str(donation.donation_date)
    payment_ref = donation.razorpay_payment_id or donation.payment_method or 'Razorpay Online'
    order_ref = donation.razorpay_order_id or 'Direct Verified'

    meta_data = [
        [
            Paragraph("<b>Receipt Date:</b>", styles['cell_bold']),
            Paragraph(donation_date, styles['cell_reg']),
            Paragraph("<b>Payment Status:</b>", styles['cell_bold']),
            Paragraph(f"<font color='#16a34a'><b>{donation.payment_status or 'Successful'}</b></font>", styles['cell_reg']),
        ],
        [
            Paragraph("<b>Payment Gateway:</b>", styles['cell_bold']),
            Paragraph("Razorpay Secure", styles['cell_reg']),
            Paragraph("<b>Payment Reference (Txn ID):</b>", styles['cell_bold']),
            Paragraph(payment_ref, styles['cell_reg']),
        ],
        [
            Paragraph("<b>Order Reference:</b>", styles['cell_bold']),
            Paragraph(order_ref, styles['cell_reg']),
            Paragraph("<b>Currency:</b>", styles['cell_bold']),
            Paragraph("Indian Rupees (INR - ₹)", styles['cell_reg']),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[130, 140, 140, 130])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # 4. Donor Information Table
    donor_name = donation.donor.full_name if donation.donor else "Valued Donor"
    donor_email = donation.donor.email if (donation.donor and donation.donor.email) else "—"
    donor_phone = donation.donor.phone_number if (donation.donor and donation.donor.phone_number) else "—"
    donor_addr = donation.donor.address if (donation.donor and donation.donor.address) else "Registered Supporter"

    donor_data = [
        [Paragraph("<b>DONOR DETAILS</b>", styles['header_label']), Paragraph("", styles['cell_reg'])],
        [Paragraph("<b>Full Name:</b>", styles['cell_bold']), Paragraph(donor_name, styles['cell_reg'])],
        [Paragraph("<b>Email Address:</b>", styles['cell_bold']), Paragraph(donor_email, styles['cell_reg'])],
        [Paragraph("<b>Phone Number:</b>", styles['cell_bold']), Paragraph(donor_phone, styles['cell_reg'])],
        [Paragraph("<b>Address / City:</b>", styles['cell_bold']), Paragraph(donor_addr, styles['cell_reg'])],
    ]
    donor_table = Table(donor_data, colWidths=[150, 390])
    donor_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eff6ff')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bfdbfe')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dbeafe')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(donor_table)
    story.append(Spacer(1, 12))

    # 5. Donation Breakdown Table
    amt_val = float(donation.amount or 0)
    amt_formatted = f"₹ {amt_val:,.2f}"
    amt_words = number_to_words_inr(amt_val)
    purpose = donation.purpose or "General Child Welfare & Nutrition"
    message = donation.message or "Thank you for supporting child education and healthcare."

    item_rows = [
        [
            Paragraph("<b>Contribution Description / Purpose</b>", styles['cell_bold']),
            Paragraph("<b>Category</b>", styles['cell_bold']),
            Paragraph("<b>Amount</b>", styles['cell_bold'])
        ],
        [
            Paragraph(f"<b>{purpose}</b><br/><font color='#64748b' size='8'>Donor Note: {message}</font>", styles['cell_reg']),
            Paragraph("Monetary Donation", styles['cell_reg']),
            Paragraph(amt_formatted, styles['amount'])
        ],
        [
            Paragraph(f"<b>Amount in Words:</b> <i>{amt_words}</i>", styles['cell_reg']),
            Paragraph("<b>Total Received:</b>", styles['cell_bold']),
            Paragraph(amt_formatted, styles['amount'])
        ]
    ]
    item_table = Table(item_rows, colWidths=[310, 110, 120])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 14))

    # 6. Statutory Tax Exemption Note & Signatures
    tax_note = (
        "<b>Section 80G Tax Exemption Certificate:</b> Donations made to HopeNest Child Development Society "
        "are exempt from Income Tax under Section 80G(5)(vi) of the Income Tax Act, 1961. "
        "This is an electronically generated and cryptographically verified transaction receipt. No physical signature is required."
    )
    tax_box = Table([[Paragraph(tax_note, styles['cell_reg'])]], colWidths=[540])
    tax_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bbf7d0')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(tax_box)
    story.append(Spacer(1, 14))

    # 7. Signature & Seal Table
    sig_data = [
        [
            Paragraph("<b>Verified By:</b><br/>HopeNest Financial Operations<br/>Finance & Audit Committee", styles['cell_reg']),
            Paragraph("<b>Authorized Signatory:</b><br/>HopeNest Child Care Society<br/>Treasurer / Executive Director", styles['cell_reg'])
        ]
    ]
    sig_table = Table(sig_data, colWidths=[270, 270])
    sig_table.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 10))

    # 8. Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94a3b8'), spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("HopeNest Orphanage & Child Care System &bull; Email: contact@hopenest.org &bull; Phone: +91 98765 43210 &bull; www.hopenest.org", styles['footer']))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

def generate_item_acknowledgement_pdf(donation):
    """
    Generates an official downloadable PDF acknowledgement receipt for non-monetary (in-kind) donations.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = build_pdf_styles()
    story = []

    # 1. Header
    story.append(Paragraph("HopeNest", styles['title']))
    story.append(Paragraph("Intelligent Child Development and Orphanage Management System", styles['subtitle']))
    story.append(Paragraph("DARPAN ID: DL/2021/029104 &bull; In-Kind Donation Registry", styles['subtitle']))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#d97706'), spaceBefore=2, spaceAfter=8))

    # 2. Receipt Badge & Meta
    ack_no = donation.receipt_number or f"HN-ACK-{datetime.now().year}-{donation.donation_id:04d}"
    badge_text = f"<b>IN-KIND ITEM DONATION ACKNOWLEDGEMENT</b> &nbsp;|&nbsp; <b>REF NO:</b> {ack_no}"
    badge_style = ParagraphStyle(
        'AckBadge',
        parent=styles['badge'],
        textColor=colors.HexColor('#b45309')
    )
    story.append(Paragraph(badge_text, badge_style))
    story.append(Spacer(1, 10))

    # 3. Meta Table
    donation_date = str(donation.donation_date)
    meta_data = [
        [
            Paragraph("<b>Receipt Date:</b>", styles['cell_bold']),
            Paragraph(donation_date, styles['cell_reg']),
            Paragraph("<b>Collection Status:</b>", styles['cell_bold']),
            Paragraph(f"<font color='#d97706'><b>{donation.collection_status or 'Pending Collection'}</b></font>", styles['cell_reg']),
        ],
        [
            Paragraph("<b>Donation Type:</b>", styles['cell_bold']),
            Paragraph(donation.donation_type or 'Item Donation', styles['cell_reg']),
            Paragraph("<b>Fulfillment Mode:</b>", styles['cell_bold']),
            Paragraph(donation.delivery_option or 'Pickup', styles['cell_reg']),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[130, 140, 140, 130])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # 4. Donor Info
    donor_name = donation.donor.full_name if donation.donor else "Valued Donor"
    donor_email = donation.donor.email if (donation.donor and donation.donor.email) else "—"
    donor_phone = donation.donor.phone_number if (donation.donor and donation.donor.phone_number) else "—"
    delivery_addr = donation.delivery_address or (donation.donor.address if donation.donor else "—") or "Orphanage Campus"

    donor_data = [
        [Paragraph("<b>CONTRIBUTOR DETAILS</b>", styles['header_label']), Paragraph("", styles['cell_reg'])],
        [Paragraph("<b>Donor Name:</b>", styles['cell_bold']), Paragraph(donor_name, styles['cell_reg'])],
        [Paragraph("<b>Contact Email:</b>", styles['cell_bold']), Paragraph(donor_email, styles['cell_reg'])],
        [Paragraph("<b>Phone Number:</b>", styles['cell_bold']), Paragraph(donor_phone, styles['cell_reg'])],
        [Paragraph("<b>Pickup / Delivery Address:</b>", styles['cell_bold']), Paragraph(delivery_addr, styles['cell_reg'])],
    ]
    donor_table = Table(donor_data, colWidths=[160, 380])
    donor_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fffbeb')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#fde68a')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fef3c7')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(donor_table)
    story.append(Spacer(1, 12))

    # 5. Item Contribution Details
    category = donation.item_category or donation.donation_type or "Essential Items"
    item_title = donation.item_name or donation.item_description or "General In-Kind Supply"
    qty_str = f"{donation.quantity} {donation.unit}" if (donation.quantity and donation.unit) else (donation.item_description or "1 Lot")
    notes = donation.message or donation.item_description or "Items intended for children welfare."

    items_data = [
        [
            Paragraph("<b>Item Category</b>", styles['cell_bold']),
            Paragraph("<b>Item Description / Name</b>", styles['cell_bold']),
            Paragraph("<b>Quantity &amp; Unit</b>", styles['cell_bold']),
            Paragraph("<b>Status</b>", styles['cell_bold'])
        ],
        [
            Paragraph(category, styles['cell_reg']),
            Paragraph(item_title, styles['cell_reg']),
            Paragraph(qty_str, styles['cell_bold']),
            Paragraph(donation.collection_status or 'Scheduled', styles['cell_reg'])
        ],
        [
            Paragraph("<b>Donor Notes / Specifications:</b>", styles['cell_bold']),
            Paragraph(notes, styles['cell_reg']),
            Paragraph("", styles['cell_reg']),
            Paragraph("", styles['cell_reg'])
        ]
    ]
    items_table = Table(items_data, colWidths=[140, 210, 110, 80])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fef3c7')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#fde68a')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fef3c7')),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 14))

    # 6. Acknowledgement Text
    ack_note = (
        "<b>Inventory Acknowledgement:</b> HopeNest gratefully acknowledges the receipt/pledge of the above-mentioned "
        "in-kind items. These items are allocated directly to our orphanage care facilities, nutrition programs, and educational centers. "
        "No goods or commercial services were provided in exchange for this contribution."
    )
    ack_box = Table([[Paragraph(ack_note, styles['cell_reg'])]], colWidths=[540])
    ack_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fefce8')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#fef08a')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(ack_box)
    story.append(Spacer(1, 14))

    # 7. Signatures
    sig_data = [
        [
            Paragraph("<b>Inventory Receiver:</b><br/>HopeNest Logistics & Supplies<br/>Orphanage Storekeeper", styles['cell_reg']),
            Paragraph("<b>Supervising Officer:</b><br/>HopeNest Child Care Society<br/>Welfare Operations Head", styles['cell_reg'])
        ]
    ]
    sig_table = Table(sig_data, colWidths=[270, 270])
    sig_table.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 10))

    # 8. Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94a3b8'), spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("HopeNest Orphanage & Child Care System &bull; Email: contact@hopenest.org &bull; Phone: +91 98765 43210 &bull; www.hopenest.org", styles['footer']))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
