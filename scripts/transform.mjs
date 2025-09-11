/**
 * @fileoverview XML transformation script using fast-xml-parser and qrcode
 * Transforms SAS XML contracts with data replacement and HTML generation
 */

import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
    QR_TARGET_URL: 'https://alt-site.example.com/contrato/585748',
    QR_SIZE: 200,
    INPUT_FILE: 'SAS-1.2-202303-585748.xml',
    OUTPUT_XML: 'dist/contratoSocial.updated.xml',
    OUTPUT_HTML: 'dist/index.html',
    OUTPUT_README: 'dist/README.md'
};

// Data replacements
const REPLACEMENTS = {
    'JORGE MEDINA GONZALEZ': 'EDUARDO ROSALES PAZ',
    'MEGJ640107QSA': 'ROPE6505115EA',
    'MEGJ640107HDFDNR07': 'ROPE650511HDFSZD07',
    'facturas.jmg@outlook.com': 'tiskamx@outlook.com'
};

/**
 * Read XML file and perform string replacements
 * @returns {string} XML content with replacements
 */
function readAndReplaceXML() {
    const xmlContent = fs.readFileSync(CONFIG.INPUT_FILE, 'utf8');
    let updatedContent = xmlContent;
    
    Object.entries(REPLACEMENTS).forEach(([old, newVal]) => {
        updatedContent = updatedContent.replace(
            new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            newVal
        );
    });
    
    return updatedContent;
}

/**
 * Parse XML to object and patch structured fields
 * @param {string} xmlContent - XML content string
 * @returns {Object} Parsed XML object
 */
function parseAndPatchXML(xmlContent) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text'
    });
    
    const xmlObj = parser.parse(xmlContent);
    
    // Remove Signature nodes (there might be multiple)
    if (xmlObj.contratoSocial.Signature) {
        delete xmlObj.contratoSocial.Signature;
    }
    // Also remove any Signature arrays if they exist
    if (Array.isArray(xmlObj.contratoSocial.Signature)) {
        xmlObj.contratoSocial.Signature = xmlObj.contratoSocial.Signature.filter(
            item => !item || !item['@_xmlns']?.includes('xmldsig')
        );
    }
    
    // Patch personaMoral fields
    const personaMoral = xmlObj.contratoSocial.personaMoral;
    personaMoral.nombreRepresentanteLegal = 'EDUARDO ROSALES PAZ';
    personaMoral.claveTramite = personaMoral.claveTramite.replace(
        'MEGJ640107QSA', 'ROPE6505115EA'
    );
    
    // Patch accionistas
    const accionista = xmlObj.contratoSocial.accionistas.accionista;
    accionista.rfc = 'ROPE6505115EA';
    accionista.curp = 'ROPE650511HDFSZD07';
    accionista.nombre = 'EDUARDO';
    accionista.apellidoPaterno = 'ROSALES';
    accionista.apellidoMaterno = 'PAZ';
    
    return xmlObj;
}

/**
 * Serialize XML object back to string
 * @param {Object} xmlObj - Parsed XML object
 * @returns {string} Serialized XML string
 */
function serializeXML(xmlObj) {
    const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        format: true,
        indentBy: '   '
    });
    
    return builder.build(xmlObj);
}

/**
 * Generate QR code as base64 PNG
 * @returns {Promise<string>} Base64 PNG data URL
 */
async function generateQRCode() {
    try {
        const qrDataURL = await QRCode.toDataURL(
            CONFIG.QR_TARGET_URL,
            {
                width: CONFIG.QR_SIZE,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }
        );
        return qrDataURL;
    } catch (error) {
        console.error('QR Code generation failed:', error);
        return null;
    }
}

/**
 * Build HTML template with embedded QR code
 * @param {Object} xmlObj - Parsed XML object
 * @param {string} qrDataURL - Base64 QR code data URL
 * @returns {string} Complete HTML string
 */
function buildHTML(xmlObj, qrDataURL) {
    const data = xmlObj.contratoSocial;
    const personaMoral = data.personaMoral;
    const accionista = data.accionistas.accionista;
    const domicilio = personaMoral.domicilio;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato Social - ${personaMoral.nombreMoral}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        *:focus,
        *:focus-visible,
        *:focus-within {
            outline: none !important;
        }
        
        /* Remove any red outlines that might be applied by browser or other sources */
        .documents-section *,
        .document-card *,
        .document-buttons * {
            outline: none !important;
            border-color: inherit !important;
        }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #2d3748;
            font-size: 16px;
        }
        
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            margin-top: 2rem;
            margin-bottom: 2rem;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        h1 { 
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .content {
            padding: 3rem 2rem;
        }
        
        h2 { 
            color: #2d3748;
            font-size: 1.5rem;
            font-weight: 600;
            margin: 2.5rem 0 1.5rem 0;
            position: relative;
            padding-left: 1rem;
        }
        
        h2::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }
        
        .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem; 
            margin-bottom: 2rem; 
        }
        
        .info-item { 
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            padding: 1.5rem; 
            border-radius: 16px; 
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .info-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .info-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .info-label { 
            font-weight: 600; 
            color: #4a5568; 
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-value { 
            color: #2d3748; 
            font-size: 1.1rem;
            font-weight: 500;
        }
        
        .highlight {
            background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%);
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-weight: 600;
            color: #d69e2e;
        }
        
        .address-card {
            background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
            padding: 2rem;
            border-radius: 16px;
            margin: 1.5rem 0;
            border: 1px solid #81e6d9;
        }
        
        .address-line {
            margin: 0.75rem 0;
            font-size: 1rem;
            color: #234e52;
        }
        
        .shareholder-card {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 2rem;
            border-radius: 16px;
            margin: 1.5rem 0;
            border: 1px solid #7dd3fc;
        }
        
        .documents-section {
            background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
            padding: 2rem;
            border-radius: 16px;
            margin: 1.5rem 0;
            border: 1px solid #fcd34d;
        }
        
        .document-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            outline: none !important;
        }
        
        .document-card:focus,
        .document-card:focus-visible,
        .document-card:focus-within {
            outline: none !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
        }
        
        .document-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }
        
        .document-buttons {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
        }
        
        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
            background: #6b7280;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #4b5563;
            transform: translateY(-1px);
        }
        
        .btn-success {
            background: #10b981;
            color: white;
        }
        
        .btn-success:hover {
            background: #059669;
            transform: translateY(-1px);
        }
        
        .document-url {
            font-size: 0.8rem;
            color: #6b7280;
            word-break: break-all;
            background: #f9fafb;
            padding: 0.75rem;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .qr-section { 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 3rem 2rem; 
            border-radius: 20px; 
            margin: 2rem 0; 
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .qr-section::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .qr-container { 
            display: inline-block; 
            background: white; 
            padding: 2rem; 
            border-radius: 20px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            position: relative;
            z-index: 1;
        }
        
        .qr-code { 
            border-radius: 12px;
            display: block;
        }
        
        .footer {
            background: #f8fafc;
            padding: 2rem;
            text-align: center;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        
        .tips-section {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            padding: 1.5rem;
            border-radius: 12px;
            margin: 1rem 0;
            border: 1px solid #cbd5e1;
        }
        
        .tips-title {
            font-weight: 600;
            color: #475569;
            margin-bottom: 1rem;
            font-size: 1rem;
        }
        
        .tips-list {
            list-style: none;
            padding: 0;
        }
        
        .tips-list li {
            padding: 0.5rem 0;
            color: #64748b;
            font-size: 0.9rem;
            position: relative;
            padding-left: 1.5rem;
        }
        
        .tips-list li::before {
            content: '•';
            color: #667eea;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 1rem;
                border-radius: 16px;
            }
            
            .header {
                padding: 2rem 1.5rem;
            }
            
            h1 {
                font-size: 2rem;
            }
            
            .content {
                padding: 2rem 1.5rem;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .document-buttons {
                flex-direction: column;
            }
            
            .btn {
                justify-content: center;
            }
        }
        
        @media (max-width: 480px) {
            .header {
                padding: 1.5rem 1rem;
            }
            
            h1 {
                font-size: 1.75rem;
            }
            
            .content {
                padding: 1.5rem 1rem;
            }
            
            .qr-section {
                padding: 2rem 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>📋 Contrato Social SAS</h1>
                <p class="subtitle">${personaMoral.nombreMoral}</p>
            </div>
        </div>
        
        <div class="content">
            <h2>🏢 Información de la Empresa</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Razón Social</div>
                    <div class="info-value">${personaMoral.nombreMoral}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Representante Legal</div>
                    <div class="info-value">${personaMoral.nombreRepresentanteLegal}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">RFC</div>
                    <div class="info-value"><span class="highlight">${accionista.rfc}</span></div>
                </div>
                <div class="info-item">
                    <div class="info-label">CURP</div>
                    <div class="info-value"><span class="highlight">${accionista.curp}</span></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${personaMoral.correoElectronico}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fecha de Constitución</div>
                    <div class="info-value">${personaMoral.fechaConstitucion}</div>
                </div>
            </div>

            <h2>📍 Domicilio y Actividad</h2>
            <div class="address-card">
                <div class="address-line"><strong>Dirección:</strong> ${domicilio.calle} #${domicilio.numeroExterior}, COL. ${domicilio.colonia}</div>
                <div class="address-line"><strong>CP:</strong> ${domicilio.cp}</div>
                <div class="address-line"><strong>Localidad:</strong> ${domicilio.localidad}</div>
                <div class="address-line"><strong>Entidad:</strong> ${domicilio.entidadFederativa}</div>
                <div class="address-line"><strong>País:</strong> ${domicilio.pais}</div>
                <div class="address-line"><strong>Teléfono:</strong> (${personaMoral.claveLada}) ${personaMoral.telefono}</div>
            </div>
            
            <div class="info-item">
                <div class="info-label">Actividad Principal</div>
                <div class="info-value">${personaMoral.actividadPrincipal}</div>
            </div>

            <h2>👤 Accionista Principal</h2>
            <div class="shareholder-card">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Nombre Completo</div>
                        <div class="info-value">${accionista.nombre} ${accionista.apellidoPaterno} ${accionista.apellidoMaterno}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">RFC</div>
                        <div class="info-value"><span class="highlight">${accionista.rfc}</span></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">CURP</div>
                        <div class="info-value"><span class="highlight">${accionista.curp}</span></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Nacionalidad</div>
                        <div class="info-value">${accionista.nacionalidad}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Acciones Fijas</div>
                        <div class="info-value">${parseInt(accionista.numeroAccionesFijas).toLocaleString()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Acciones Variables</div>
                        <div class="info-value">${parseInt(accionista.numeroAccionesVariables).toLocaleString()}</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-radius: 8px; color: #155724; text-align: center;">
                    <strong>Representante Legal:</strong> ${accionista.esRepresentanteLegal}
                </div>
            </div>

            <h2>📄 Documentos</h2>
            <div class="documents-section">
                <p style="margin-bottom: 1.5rem; color: #92400e; font-weight: 600; font-size: 1.1rem;">Documentos oficiales disponibles</p>
                ${data.documentos ? data.documentos.documento.map(doc => `
                    <div class="document-card">
                        <div class="document-title">📄 ${doc.descripcion}</div>
                        <div class="document-buttons">
                            <a href="${doc.uri}" target="_blank" class="btn btn-primary" onclick="handlePdfClick(this, '${doc.uri}');">
                                🔗 Abrir PDF
                            </a>
                            <button onclick="copyToClipboard('${doc.uri}')" class="btn btn-secondary">
                                📋 Copiar URL
                            </button>
                            <button onclick="openInNewWindow('${doc.uri}')" class="btn btn-success">
                                🪟 Nueva Ventana
                            </button>
                        </div>
                        <div class="document-url">
                            <strong>URL:</strong> ${doc.uri}
                        </div>
                    </div>
                `).join('') : '<p style="color: #6b7280; text-align: center; padding: 2rem;">No hay documentos disponibles</p>'}
                
                <div class="tips-section">
                    <div class="tips-title">💡 Consejos para abrir PDFs</div>
                    <ul class="tips-list">
                        <li>Si el PDF no carga, usa "Nueva Ventana" o "Copiar URL"</li>
                        <li>Algunos PDFs pueden requerir autenticación del gobierno</li>
                        <li>Prueba con diferentes navegadores si hay problemas</li>
                        <li><strong>Nota:</strong> Los PDFs del gobierno pueden estar temporalmente no disponibles</li>
                    </ul>
                </div>
                
                <div class="tips-section">
                    <div class="tips-title">🔄 Alternativas si los PDFs no funcionan</div>
                    <ul class="tips-list">
                        <li>Contacta a la entidad gubernamental para obtener los documentos</li>
                        <li>Visita el portal oficial de la Secretaría de Economía</li>
                        <li>Usa el folio de trámite: <strong>${personaMoral.folioTramite}</strong> para consultas</li>
                    </ul>
                </div>
                
                <div style="margin-top: 1rem; padding: 1.5rem; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; text-align: center;">
                    <h4 style="color: #92400e; margin: 0 0 0.5rem 0; font-size: 1.1rem;">📄 Información del Contrato</h4>
                    <p style="margin: 0; color: #92400e; font-size: 0.9rem;">
                        <strong>Nota:</strong> Los PDFs oficiales pueden no estar disponibles temporalmente. 
                        Toda la información del contrato está disponible en esta página web.
                    </p>
                </div>
            </div>

            <h2>📱 Acceso Rápido</h2>
            <div class="qr-section">
                <p style="margin-bottom: 2rem; font-size: 1.2rem; font-weight: 500; position: relative; z-index: 1;">Escanea el código QR para acceder a la versión online</p>
                <div class="qr-container">
                    ${qrDataURL ? `<img src="${qrDataURL}" alt="QR Code" class="qr-code">` : '<div style="width: 200px; height: 200px; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #6c757d;">QR Code no disponible</div>'}
                </div>
                <p style="margin-top: 2rem; font-size: 1rem; opacity: 0.9; position: relative; z-index: 1;">
                    <strong>URL:</strong> <a href="${CONFIG.QR_TARGET_URL}" target="_blank" style="color: #fff; text-decoration: underline; font-weight: 500;">${CONFIG.QR_TARGET_URL}</a>
                </p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8; position: relative; z-index: 1;">
                    <small>Folio: ${personaMoral.folioTramite} | Contrato Social SAS</small>
                </p>
            </div>

            <h2>ℹ️ Información Adicional</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Clave de Trámite</div>
                    <div class="info-value">${personaMoral.claveTramite}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Folio de Trámite</div>
                    <div class="info-value">${personaMoral.folioTramite}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Valor por Acción</div>
                    <div class="info-value">$${personaMoral.valorAccion}.00 MXN</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Capital Social</div>
                    <div class="info-value">$${parseFloat(personaMoral.capitalSocial).toLocaleString()}.00 MXN</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Duración</div>
                    <div class="info-value">${personaMoral.duracion}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tipo de Documento</div>
                    <div class="info-value">${data.informacion.tipoDocumento}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Documento generado automáticamente desde el contrato social XML</p>
            <p><small>Última actualización: <span id="currentDate"></span></small></p>
        </div>
    </div>

    <script>
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-MX');
        
        function handlePdfClick(element, url) {
            // Always show warning first for government PDFs
            showPdfWarning(url, element);
        }
        
        function showPdfWarning(url, element) {
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 500px; text-align: center;';
            warningDiv.innerHTML = '<div style="font-size: 24px; margin-bottom: 15px;">⚠️</div>' +
                '<h3 style="color: #856404; margin-bottom: 15px;">PDF del Gobierno Mexicano</h3>' +
                '<p style="color: #495057; margin-bottom: 20px; line-height: 1.5;">Los PDFs oficiales del gobierno pueden no estar disponibles o requerir autenticación especial.</p>' +
                '<div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">' +
                    '<button onclick="tryOpenPdf(\'' + url + '\', this)" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">🔗 Intentar Abrir</button>' +
                    '<button onclick="copyPdfUrl(\'' + url + '\')" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">📋 Copiar URL</button>' +
                    '<button onclick="this.closest(\'div\').remove()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">❌ Cancelar</button>' +
                '</div>' +
                '<p style="font-size: 12px; color: #6c757d; margin-top: 15px;">Si el PDF no carga, usa "Copiar URL" y ábrelo manualmente en el navegador</p>';
            document.body.appendChild(warningDiv);
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;';
            backdrop.onclick = () => {
                warningDiv.remove();
                backdrop.remove();
            };
            document.body.appendChild(backdrop);
        }
        
        function tryOpenPdf(url, button) {
            button.textContent = '⏳ Abriendo...';
            button.disabled = true;
            
            const warningDiv = button.closest('div');
            const backdrop = document.querySelector('div[style*="rgba(0,0,0,0.5)"]');
            if (backdrop) backdrop.remove();
            
            const newWindow = window.open(url, '_blank');
            
            if (!newWindow) {
                showPdfError('No se pudo abrir la ventana. Por favor, permite ventanas emergentes o usa "Copiar URL".');
                return;
            }
            
            setTimeout(() => {
                if (newWindow.closed) {
                    showPdfError('El PDF no se pudo cargar. Usa "Copiar URL" para intentar abrirlo manualmente.');
                } else {
                    showPdfSuccess('PDF abierto correctamente');
                }
            }, 2000);
            
            if (warningDiv) warningDiv.remove();
        }
        
        function copyPdfUrl(url) {
            navigator.clipboard.writeText(url).then(() => {
                showPdfSuccess('URL copiada al portapapeles. Pégalo en una nueva pestaña del navegador.');
            }).catch(() => {
                // Fallback
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showPdfSuccess('URL copiada al portapapeles. Pégalo en una nueva pestaña del navegador.');
            });
            
            // Close warning dialog
            const warningDiv = document.querySelector('div[style*="transform: translate(-50%, -50%)"]');
            const backdrop = document.querySelector('div[style*="rgba(0,0,0,0.5)"]');
            if (warningDiv) warningDiv.remove();
            if (backdrop) backdrop.remove();
        }
        
        function showPdfSuccess(message) {
            const successDiv = document.createElement('div');
            successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; background: #28a745; color: white; padding: 15px; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 300px; font-size: 14px;';
            successDiv.innerHTML = '<strong>✅ Éxito</strong><br>' + message + '<button onclick="this.parentElement.remove()" style="background: none; border: 1px solid white; color: white; padding: 5px 10px; margin-top: 10px; border-radius: 3px; cursor: pointer;">Cerrar</button>';
            document.body.appendChild(successDiv);
            setTimeout(() => { if (successDiv.parentElement) successDiv.remove(); }, 5000);
        }
        
        function showPdfError(message) {
            // Create a temporary error message
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; background: #dc3545; color: white; padding: 15px; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 300px; font-size: 14px; line-height: 1.4;';
            errorDiv.innerHTML = '<strong>⚠️ Error de PDF</strong><br>' + message + '<button onclick="this.parentElement.remove()" style="background: none; border: 1px solid white; color: white; padding: 5px 10px; margin-top: 10px; border-radius: 3px; cursor: pointer;">Cerrar</button>';
            document.body.appendChild(errorDiv);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 10000);
        }
        
        function copyToClipboard(url) {
            navigator.clipboard.writeText(url).then(() => {
                // Show success feedback
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = '✅ Copiado';
                button.style.background = '#28a745';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '#6c757d';
                }, 2000);
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = '✅ Copiado';
                button.style.background = '#28a745';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '#6c757d';
                }, 2000);
            });
        }
        
        function openInNewWindow(url) {
            const newWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            if (!newWindow) {
                alert('No se pudo abrir la ventana. Por favor, permite ventanas emergentes.');
            }
        }
    </script>
</body>
</html>`;
}

/**
 * Create deployment README
 * @returns {string} README content
 */
function createDeployREADME() {
    return `# Contrato Social - Deployment

## Quick Deploy

### Static Hosting Options

1. **GitHub Pages**
   - Push to repository
   - Enable Pages in settings
   - Set source to main branch

2. **Netlify**
   - Drag & drop this folder to netlify.com/drop
   - Or connect Git repository

3. **Vercel**
   - Run: \`vercel --cwd .\`
   - Deploy automatically

4. **Any Web Server**
   - Upload all files to web root
   - Ensure index.html is accessible

## Files

- \`contratoSocial.updated.xml\` - Processed XML (optional)
- \`index.html\` - Main contract view (required)
- \`README.md\` - This file

## Features

- ✅ All personal identifiers replaced
- ✅ No signature blocks
- ✅ QR code for quick access
- ✅ Responsive design
- ✅ Mobile-friendly

## QR Code

The QR code points to: \`${CONFIG.QR_TARGET_URL}\`

To change the target URL, edit the QR code URL in index.html.

Generated: ${new Date().toISOString()}
`;
}

/**
 * Ensure dist directory exists
 */
function ensureDistDir() {
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist', { recursive: true });
    }
}

/**
 * Main transformation function
 */
async function transform() {
    try {
        console.log('🔄 Starting XML transformation...');
        
        // Ensure dist directory exists
        ensureDistDir();
        
        // Step 1: Read XML and perform string replacements
        console.log('📖 Reading and replacing XML content...');
        const xmlContent = readAndReplaceXML();
        
        // Step 2: Parse to object and patch structured fields
        console.log('🔧 Parsing and patching structured fields...');
        const xmlObj = parseAndPatchXML(xmlContent);
        
        // Step 3: Serialize back to XML
        console.log('💾 Serializing XML...');
        const serializedXML = serializeXML(xmlObj);
        
        // Step 4: Write updated XML
        fs.writeFileSync(CONFIG.OUTPUT_XML, serializedXML);
        console.log(`✅ XML written to ${CONFIG.OUTPUT_XML}`);
        
        // Step 5: Generate QR code
        console.log('📱 Generating QR code...');
        const qrDataURL = await generateQRCode();
        
        // Step 6: Build HTML
        console.log('🌐 Building HTML...');
        const htmlContent = buildHTML(xmlObj, qrDataURL);
        fs.writeFileSync(CONFIG.OUTPUT_HTML, htmlContent);
        console.log(`✅ HTML written to ${CONFIG.OUTPUT_HTML}`);
        
        // Step 7: Create deployment README
        console.log('📝 Creating deployment README...');
        const readmeContent = createDeployREADME();
        fs.writeFileSync(CONFIG.OUTPUT_README, readmeContent);
        console.log(`✅ README written to ${CONFIG.OUTPUT_README}`);
        
        console.log('\n🎉 Transformation complete!');
        console.log('📁 Files created in dist/ directory');
        console.log('🚀 Ready for deployment to any static host');
        
    } catch (error) {
        console.error('❌ Transformation failed:', error);
        process.exit(1);
    }
}

// Run transformation
transform();
