import os
import io
import qrcode
import base64
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Image, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from flask import current_app

def generate_ticket_qr(booking):
    """Generates a base64 encoded QR code string for the booking"""
    agency_name = booking.trip.route.agency.name if booking.trip and booking.trip.route and booking.trip.route.agency else '3M SERVICES'
    client_ref = f"REF-{booking.user.id:05d}" if booking.user else "N/A"
    
    # Rich, human-readable QR code content
    qr_data = "\n".join([
        f"=== 3M SERVICES - BILLET ELECTRONIQUE ===",
        f"Agence       : {agency_name}",
        f"Code Billet  : {booking.booking_code or booking.id}",
        f"Ref. Client  : {client_ref}",
        f"Passager     : {booking.passenger_name or 'N/A'}",
        f"Trajet       : {booking.trip.route.origin} → {booking.trip.route.destination}",
        f"Depart       : {booking.trip.departure_time.strftime('%d/%m/%Y a %H:%M')}",
        f"Arrivee      : {booking.trip.arrival_time.strftime('%d/%m/%Y a %H:%M') if booking.trip.arrival_time else 'N/A'}",
        f"Siege        : {booking.seat_number or 'N/A'}",
        f"Statut Pmt   : {(booking.payment_status or '').upper()}",
        f"Prix         : {int(booking.price_paid or 0):,} FCFA",
        f"=====================================",
    ])
    
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to bytes
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return img_str, buffered.getvalue()

def generate_pdf_ticket(booking):
    """Generates a professional PDF ticket for the booking using ReportLab"""
    buffer = io.BytesIO()
    
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#C92A2A'), spaceAfter=20, alignment=1
    )
    normal_style = styles['Normal']
    bold_style = ParagraphStyle('BoldText', parent=styles['Normal'], fontName='Helvetica-Bold')
    
    elements = []
    
    # Header: Logo & Title
    logo_path = os.path.join(current_app.root_path, 'static', 'logorv.png')
    if os.path.exists(logo_path):
        img = Image(logo_path, width=2.5*inch, height=0.8*inch, kind='proportional')
        img.hAlign = 'CENTER'
        elements.append(img)
        elements.append(Spacer(1, 10))
    
    elements.append(Paragraph("Contrat de Location VIP & Facture Proforma", title_style))
    elements.append(Spacer(1, 10))
    
    # Generate QR Code
    b64_str, qr_bytes = generate_ticket_qr(booking)
    qr_img = Image(io.BytesIO(qr_bytes), width=1.5*inch, height=1.5*inch)
    qr_img.hAlign = 'RIGHT'
    
    # Information Table Data
    vehicle_info = str(booking.trip.bus.name or booking.trip.bus.model or booking.trip.bus.license_plate) if booking.trip and booking.trip.bus else 'SUV VIP 4x4'
    if booking.trip and booking.trip.bus and booking.trip.bus.license_plate:
        vehicle_info += f" ({booking.trip.bus.license_plate})"

    data = [
        ['RÉFÉRENCE DU CONTRAT:', str(booking.booking_code or booking.id or '')],
        ['NOM DU CLIENT VIP:', str(booking.passenger_name or booking.user.real_name or booking.user.username or 'Non spécifié')],
        ['TÉLÉPHONE CLIENT VIP:', str(booking.user.phone or "Non spécifié")],
        ['MISSION / ITINÉRAIRE:', f"{booking.trip.route.origin if booking.trip and booking.trip.route else ''} ➔ {booking.trip.route.destination if booking.trip and booking.trip.route else ''}"],
        ['DATE DE MISE À DISPOSITION:', booking.trip.departure_time.strftime('%d/%m/%Y') if booking.trip else ''],
        ['HEURE DE PRISE EN CHARGE:', booking.trip.departure_time.strftime('%H:%M') if booking.trip else ''],
        ['POSTE / RÉFÉRENCE:', str(booking.seat_number or '1')],
        ['VÉHICULE VIP ASSIGNÉ:', vehicle_info],
        ['STATUT DU PAIEMENT:', 'PAYÉ' if booking.payment_status == 'paid' else str(booking.payment_status or '').upper()],
        ['MONTANT TOTAL:', f"{int(booking.price_paid or 0)} FCFA"]
    ]
    
    # Create Table
    t = Table(data, colWidths=[200, 250])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6c757d')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.lightgrey),
    ]))
    
    # Add Table and QR Code side by side (using an outer table)
    outer_data = [
        [t, qr_img]
    ]
    outer_table = Table(outer_data, colWidths=[400, 120])
    outer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT')
    ]))
    
    elements.append(outer_table)
    elements.append(Spacer(1, 30))
    
    # Footer info
    terms_text = (
        "<b>Conditions de location & conciergerie VIP :</b><br/>"
        "1. Présentation d'une pièce d'identité valide ou passeport requise lors de la remise des clés.<br/>"
        "2. Véhicule VIP avec chauffeur exécutif bilingue ou formule autonomie avec caution.<br/>"
        "3. Assurance tous risques et assistance routière 24h/24 incluses.<br/>"
        "4. Le QR Code certifie l'authenticité du contrat de mise à disposition."
    )
    elements.append(Paragraph(terms_text, normal_style))
    
    elements.append(Spacer(1, 40))
    elements.append(Paragraph("<b>3M SERVICES SARL :</b> Yaoundé Omnisports, Face Pharmacie Le Bon Berger | +237 691 78 64 47 / +237 698 66 87 61 | contact@3mservice.shop", ParagraphStyle('CenterBold', parent=normal_style, alignment=1)))
    
    # Build PDF
    doc.build(elements)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes, b64_str


def generate_parcel_qr(parcel):
    """Generates a base64 encoded QR code string for the parcel"""
    qr_data = f"PARCEL:{parcel.tracking_number}|SENDER:{parcel.sender_name}|RECEIVER:{parcel.receiver_name}|ROUTE:{parcel.trip.route.origin if parcel.trip else parcel.agency.city}-{parcel.receiver_city}|WT:{parcel.weight}kg|PRICE:{parcel.price}|STATUS:{parcel.status}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to bytes
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return img_str, buffered.getvalue()


def generate_pdf_parcel(parcel):
    """Generates a professional PDF bordereau for the parcel using ReportLab"""
    buffer = io.BytesIO()
    
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Heading1'], fontSize=22, textColor=colors.HexColor('#C92A2A'), spaceAfter=20, alignment=1
    )
    normal_style = styles['Normal']
    
    elements = []
    
    # Header: Logo & Title
    logo_path = os.path.join(current_app.root_path, 'static', 'logorv.png')
    if os.path.exists(logo_path):
        img = Image(logo_path, width=2.5*inch, height=0.8*inch, kind='proportional')
        img.hAlign = 'CENTER'
        elements.append(img)
        elements.append(Spacer(1, 10))
    
    elements.append(Paragraph("Bordereau d'Expédition de Colis", title_style))
    elements.append(Spacer(1, 10))
    
    # Generate QR Code
    b64_str, qr_bytes = generate_parcel_qr(parcel)
    qr_img = Image(io.BytesIO(qr_bytes), width=1.5*inch, height=1.5*inch)
    qr_img.hAlign = 'RIGHT'
    
    # Information Table Data
    data = [
        ['CODE DE SUIVI (TRACKING):', str(parcel.tracking_number)],
        ['EXPÉDITEUR:', f"{parcel.sender_name} ({parcel.sender_phone or ''})"],
        ['DESTINATAIRE:', f"{parcel.receiver_name} ({parcel.receiver_phone})"],
        ['ADRESSE LIVRAISON:', parcel.receiver_address or "Non spécifiée"],
        ['ITINÉRAIRE:', f"{parcel.trip.route.origin if parcel.trip else parcel.agency.city} ➔ {parcel.receiver_city}"],
        ['DATE D\'EXPÉDITION:', parcel.created_at.strftime('%d/%m/%Y')],
        ['TYPE DE COLIS:', parcel.parcel_type],
        ['DESCRIPTION:', parcel.description],
        ['POIDS / QUANTITÉ:', f"{parcel.weight} kg / {parcel.num_items} pièce(s)"],
        ['ASSURANCE:', 'OUI' if parcel.has_insurance else 'NON'],
        ['FRAIS D\'EXPÉDITION:', f"{int(parcel.price)} FCFA"],
        ['STATUT DU PAIEMENT:', 'PAYÉ' if parcel.payment_status == 'paid' else parcel.payment_status.upper()]
    ]
    
    # Create Table
    t = Table(data, colWidths=[200, 250])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6c757d')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.lightgrey),
    ]))
    
    # Add Table and QR Code side by side (using an outer table)
    outer_data = [
        [t, qr_img]
    ]
    outer_table = Table(outer_data, colWidths=[400, 120])
    outer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT')
    ]))
    
    elements.append(outer_table)
    elements.append(Spacer(1, 20))
    
    # Footer info
    terms_text = (
        "<b>Conditions d'expédition :</b><br/>"
        "1. Le destinataire doit présenter une pièce d'identité valide et le code de suivi pour retirer le colis.<br/>"
        "2. Les colis fragiles doivent être signalés à l'enregistrement.<br/>"
        "3. 3M SERVICES n'est pas responsable des articles de valeur non déclarés ou non assurés.<br/>"
        "4. Suivi disponible en temps réel sur notre application web."
    )
    elements.append(Paragraph(terms_text, normal_style))
    
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("<b>Contactez-nous :</b> contact@3mservice.shop | +237 698 103 282", ParagraphStyle('CenterBold', parent=normal_style, alignment=1)))
    
    # Build PDF
    doc.build(elements)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes, b64_str

